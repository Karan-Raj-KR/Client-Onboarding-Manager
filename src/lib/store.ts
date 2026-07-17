import { useState, useEffect } from 'react';
import { KagazState, Deal, Quote, Invoice, Enquiry, Payment, Reminder, TailoredDocument, DEFAULT_STATE, paiseToRupee, formatINR } from './schema';

export * from './schema';

let memoryState = DEFAULT_STATE;

export function getKagazState(): KagazState {
  return memoryState;
}

export async function fetchKagazState() {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      memoryState = await res.json();
      notify();
    }
  } catch (e) {
    console.error('Failed to fetch state from API', e);
  }
}

export async function saveKagazState(state: KagazState) {
  memoryState = state;
  notify(); // Optimistic update
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
  } catch (e) {
    console.error('Failed to save state to API', e);
  }
}

export function resetKagazStore() {
  saveKagazState(DEFAULT_STATE);
}

// === OBSERVER PATTERN FOR REACT SYNCHRONIZATION ===

const LISTENERS = new Set<() => void>();
export function subscribe(listener: () => void) {
  LISTENERS.add(listener);
  return () => {
    LISTENERS.delete(listener);
  };
}

export function notify() {
  LISTENERS.forEach((l) => l());
}

export function useKagazStore() {
  const [state, setState] = useState<KagazState>(() => getKagazState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchKagazState().then(() => setLoaded(true));
    }

    const handleUpdate = () => {
      setState(getKagazState());
    };

    const unsubscribe = subscribe(handleUpdate);

    return () => {
      unsubscribe();
    };
  }, [loaded]);

  return state;
}

// === BUSINESS TRANSACTION LOGIC ===

const FALLBACK_DEMO_EXTRACTION = {
  project_title: 'Restaurant Website with Online Ordering',
  client_name: 'Aditi Sharma (Aditi\'s Kitchen)',
  scope_summary: 'A responsive website for a local restaurant, complete with online menu listing, digital shopping cart checkout, and WhatsApp order submission routing.',
  budget_min_paise: 3000000,
  budget_max_paise: 4000000,
  timeline_days: 14,
  confidence_bps: 9400,
  line_items: [
    {
      id: 'li_demo_1',
      rate_card_item_id: 'rc_web',
      description: 'Restaurant Website + Online Ordering Setup',
      quantity: 1,
      unit_price_paise: 3500000, // Pre-fill recommended ₹35,000
      tax_rate_bps: 1800,
    },
  ],
};

/**
 * Simulates AI extraction on a deal
 */
export async function extractDealWithAI(dealId: string): Promise<Deal | null> {
  const state = getKagazState();
  const dealIndex = state.deals.findIndex((d) => d.id === dealId);
  if (dealIndex === -1) return null;

  const deal = state.deals[dealIndex];
  if (deal.status !== 'New') return deal;

  const rawText = deal.notes || deal.scope_summary || '';
  let extractionData = FALLBACK_DEMO_EXTRACTION;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data) {
        let parsedData = json.data;
        if (typeof parsedData === 'string') {
          let cleanStr = parsedData.trim();
          if (cleanStr.startsWith('```json')) cleanStr = cleanStr.substring(7);
          else if (cleanStr.startsWith('```')) cleanStr = cleanStr.substring(3);
          if (cleanStr.endsWith('```')) cleanStr = cleanStr.substring(0, cleanStr.length - 3);
          cleanStr = cleanStr.trim();
          parsedData = JSON.parse(cleanStr);
        }
        
        extractionData = {
          ...FALLBACK_DEMO_EXTRACTION,
          project_title: parsedData.project_title ?? '',
          client_name: parsedData.client_name ?? '',
          scope_summary: parsedData.scope_summary ?? '',
          budget_min_paise: typeof parsedData.budget_min_paise === 'number' ? parsedData.budget_min_paise : 0,
          budget_max_paise: typeof parsedData.budget_max_paise === 'number' ? parsedData.budget_max_paise : 0,
          timeline_days: typeof parsedData.timeline_days === 'number' ? parsedData.timeline_days : 0,
          confidence_bps: typeof parsedData.confidence_bps === 'number' ? parsedData.confidence_bps : 0,
        };
        
        // Also map phone if they returned it (though it wasn't in demo fallback, it's in Deal)
        if (typeof parsedData.client_phone === 'string') {
          (extractionData as any).client_phone = parsedData.client_phone;
        } else {
          (extractionData as any).client_phone = '';
        }

        if (Array.isArray(parsedData.missing_information)) {
          (extractionData as any).missing_information = parsedData.missing_information;
        }
      } else {
        console.error('API /extract returned ok: false', json);
      }
    } else {
      console.error('Fetch to /api/extract failed with status:', res.status);
    }
  } catch (error) {
    console.error('Fetch to /api/extract failed or timed out:', error);
  }

  const updatedDeal: Deal = {
    ...deal,
    status: 'Draft',
    ...extractionData,
  };
  
  if ((extractionData as any).missing_information) {
    updatedDeal.missing_information = (extractionData as any).missing_information;
  }

  const newDeals = [...state.deals];
  newDeals[dealIndex] = updatedDeal;

  saveKagazState({
    ...state,
    deals: newDeals,
  });

  return updatedDeal;
}

/**
 * Tailors all seeded document templates for a specific deal using the LLM.
 * Called AFTER acceptQuote — never blocks the accept cascade.
 * Failures are caught and logged; documents get status 'failed' instead of crashing.
 */
export async function tailorDocumentsForDeal(dealId: string): Promise<TailoredDocument[]> {
  const state = getKagazState();
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return [];

  const templates = state.templates;
  if (!templates || templates.length === 0) return [];

  // Find the quote for this deal to include quote data in the context
  const quote = state.quotes.find((q) => q.deal_id === dealId);

  // Build an enriched deal object with formatted amounts for the LLM
  const dealContext = {
    ...deal,
    formatted_subtotal: quote ? `₹${(quote.subtotal_paise / 100).toLocaleString('en-IN')}` : 'N/A',
    formatted_tax: quote ? `₹${(quote.tax_paise / 100).toLocaleString('en-IN')}` : 'N/A',
    formatted_total: quote ? `₹${(quote.total_paise / 100).toLocaleString('en-IN')}` : 'N/A',
    quote_number: quote?.number || 'N/A',
    quote_date: quote?.created_at ? new Date(quote.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
    payment_terms: quote?.notes_to_client || 'As per agreement',
  };

  // Set initial 'generating' status for all templates
  const initialDocs: TailoredDocument[] = templates.map((t) => ({
    template_id: t.id,
    name: t.name,
    markdown: '',
    status: 'generating' as const,
  }));

  // Save generating state so UI can show spinners
  const dealIndex = state.deals.findIndex((d) => d.id === dealId);
  if (dealIndex !== -1) {
    const newDeals = [...state.deals];
    newDeals[dealIndex] = { ...newDeals[dealIndex], tailored_documents: initialDocs };
    saveKagazState({ ...getKagazState(), deals: newDeals });
  }

  // Tailor each template concurrently
  const results = await Promise.allSettled(
    templates.map(async (template) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const res = await fetch('/api/tailor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template_body: template.body_markdown, deal: dealContext }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.tailored_markdown) {
            return {
              template_id: template.id,
              name: template.name,
              markdown: json.tailored_markdown,
              status: 'ready' as const,
            };
          }
        }
        throw new Error(`Tailor API returned error for template ${template.id}`);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error(`Failed to tailor template ${template.id}:`, err);
        return {
          template_id: template.id,
          name: template.name,
          markdown: '',
          status: 'failed' as const,
        };
      }
    })
  );

  const finalDocs: TailoredDocument[] = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { template_id: '', name: '', markdown: '', status: 'failed' as const }
  );

  // Persist the final results
  const latestState = getKagazState();
  const latestDealIndex = latestState.deals.findIndex((d) => d.id === dealId);
  if (latestDealIndex !== -1) {
    const newDeals = [...latestState.deals];
    newDeals[latestDealIndex] = { ...newDeals[latestDealIndex], tailored_documents: finalDocs };
    saveKagazState({ ...latestState, deals: newDeals });
  }

  return finalDocs;
}

/**
 * Updates a draft deal details and its line items
 */
export function updateDeal(dealId: string, updates: Partial<Deal>): Deal | null {
  const state = getKagazState();
  const dealIndex = state.deals.findIndex((d) => d.id === dealId);
  if (dealIndex === -1) return null;

  const updatedDeal: Deal = {
    ...state.deals[dealIndex],
    ...updates,
  };

  const newDeals = [...state.deals];
  newDeals[dealIndex] = updatedDeal;

  saveKagazState({
    ...state,
    deals: newDeals,
  });

  return updatedDeal;
}

/**
 * Generates a branded Quote for a Deal
 */
export function generateQuote(
  dealId: string,
  validUntilDate: string,
  notesToClient: string
): Quote | null {
  const state = getKagazState();
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal) return null;

  // Calculate pricing from line items
  let subtotal = 0;
  let tax = 0;

  deal.line_items.forEach((item) => {
    const itemSubtotal = item.unit_price_paise * item.quantity;
    const itemTax = Math.round((itemSubtotal * item.tax_rate_bps) / 10000);
    subtotal += itemSubtotal;
    tax += itemTax;
  });

  const total = subtotal + tax;

  // Generate unique Quote number
  const year = new Date().getFullYear();
  const quoteCount = state.quotes.length + 1;
  const quoteNumber = `Q-${year}-${String(quoteCount).padStart(4, '0')}`;
  const publicToken = `token_${Math.random().toString(36).substring(2, 15)}`;

  const newQuote: Quote = {
    id: `qt_${Math.random().toString(36).substring(2, 9)}`,
    deal_id: dealId,
    number: quoteNumber,
    public_token: publicToken,
    status: 'Quoted',
    valid_until: validUntilDate,
    subtotal_paise: subtotal,
    tax_paise: tax,
    total_paise: total,
    notes_to_client: notesToClient,
    accepted_at: null,
    created_at: new Date().toISOString(),
  };

  // Update deal status to Quoted
  const updatedDeals = state.deals.map((d) =>
    d.id === dealId ? { ...d, status: 'Quoted' as const } : d
  );

  saveKagazState({
    ...state,
    quotes: [...state.quotes, newQuote],
    deals: updatedDeals,
  });

  return newQuote;
}

/**
 * Accepts a Quote and triggers the creation cascade
 * IDEMPOTENT: If quote is already accepted, returns current invoice/payment records.
 */
export function acceptQuote(publicToken: string, acceptedByName: string): {
  quote: Quote;
  invoice: Invoice;
  payment: Payment;
  reminder: Reminder;
} | null {
  const state = getKagazState();
  const quoteIndex = state.quotes.findIndex((q) => q.public_token === publicToken);
  if (quoteIndex === -1) return null;

  const quote = state.quotes[quoteIndex];

  // If already accepted, return existing artifacts to maintain idempotency
  if (quote.status === 'Accepted' || quote.accepted_at) {
    const invoice = state.invoices.find((i) => i.quote_id === quote.id);
    const payment = state.payments.find((p) => p.invoice_id === invoice?.id);
    const reminder = state.reminders.find((r) => r.invoice_id === invoice?.id);

    if (invoice && payment && reminder) {
      return { quote, invoice, payment, reminder };
    }
  }

  // Transaction start
  const updatedQuote: Quote = {
    ...quote,
    status: 'Accepted',
    accepted_at: new Date().toISOString(),
  };

  const newQuotes = [...state.quotes];
  newQuotes[quoteIndex] = updatedQuote;

  // Update deal status to Payment Pending (Won)
  const updatedDeals = state.deals.map((d) =>
    d.id === quote.deal_id ? { ...d, status: 'Payment Pending' as const } : d
  );

  // Generate invoice number
  const year = new Date().getFullYear();
  const invoiceCount = state.invoices.length + 1;
  const invoiceNumber = `INV-${year}-${String(invoiceCount).padStart(4, '0')}`;
  const invoiceId = `inv_${Math.random().toString(36).substring(2, 9)}`;

  const newInvoice: Invoice = {
    id: invoiceId,
    quote_id: quote.id,
    number: invoiceNumber,
    status: 'Issued',
    issued_at: new Date().toISOString(),
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days due
    subtotal_paise: quote.subtotal_paise,
    tax_paise: quote.tax_paise,
    total_paise: quote.total_paise,
    pdf_path: null,
    created_at: new Date().toISOString(),
  };

  // Generate payment link record (mock)
  const paymentId = `pay_${Math.random().toString(36).substring(2, 9)}`;
  const amountRupees = paiseToRupee(quote.total_paise).toFixed(2);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(state.business.bank_or_upi_handle)}&pn=${encodeURIComponent(state.business.brand_name)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoiceNumber)}`;

  const newPayment: Payment = {
    id: paymentId,
    invoice_id: invoiceId,
    provider: 'mock',
    payment_url: upiUrl,
    amount_paise: quote.total_paise,
    status: 'pending',
    paid_at: null,
  };

  // Arm reminders
  const deal = state.deals.find((d) => d.id === quote.deal_id);
  const reminderId = `rem_${Math.random().toString(36).substring(2, 9)}`;
  const newReminder: Reminder = {
    id: reminderId,
    invoice_id: invoiceId,
    scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days later
    channel: 'whatsapp',
    status: 'armed',
    body: `Hi ${deal?.client_name || 'Client'}, this is a reminder that invoice ${invoiceNumber} for ${formatINR(paiseToRupee(quote.total_paise))} is due in 5 days. You can view it here: https://kagaz.in/q/${publicToken}`,
  };

  saveKagazState({
    ...state,
    quotes: newQuotes,
    deals: updatedDeals,
    invoices: [...state.invoices, newInvoice],
    payments: [...state.payments, newPayment],
    reminders: [...state.reminders, newReminder],
  });

  return {
    quote: updatedQuote,
    invoice: newInvoice,
    payment: newPayment,
    reminder: newReminder,
  };
}

/**
 * Simulates client payment completion
 */
export function simulatePayment(invoiceId: string): Invoice | null {
  const state = getKagazState();
  const invoiceIndex = state.invoices.findIndex((i) => i.id === invoiceId);
  if (invoiceIndex === -1) return null;

  const invoice = state.invoices[invoiceIndex];
  if (invoice.status === 'Paid') return invoice;

  const updatedInvoice: Invoice = {
    ...invoice,
    status: 'Paid',
  };

  const newInvoices = [...state.invoices];
  newInvoices[invoiceIndex] = updatedInvoice;

  // Update payment record
  const updatedPayments = state.payments.map((p) =>
    p.invoice_id === invoiceId
      ? { ...p, status: 'paid' as const, paid_at: new Date().toISOString() }
      : p
  );

  // Update deal status to Paid
  const quote = state.quotes.find((q) => q.id === invoice.quote_id);
  const updatedDeals = state.deals.map((d) =>
    quote && d.id === quote.deal_id ? { ...d, status: 'Paid' as const } : d
  );

  // Cancel pending reminders for this invoice
  const updatedReminders = state.reminders.map((r) =>
    r.invoice_id === invoiceId ? { ...r, status: 'cancelled' as const } : r
  );

  saveKagazState({
    ...state,
    invoices: newInvoices,
    payments: updatedPayments,
    deals: updatedDeals,
    reminders: updatedReminders,
  });

  return updatedInvoice;
}

// === API SPEC COMPATIBLE MOCK ENDPOINTS ===
// These wrap the local DB operations to simulate API calls in the frontend if needed

export const api = {
  extractEnquiry: async (rawText: string): Promise<{ enquiry: Enquiry; deal: Deal }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const state = getKagazState();

    const enqId = `enq_${Math.random().toString(36).substring(2, 9)}`;
    const newEnquiry: Enquiry = {
      id: enqId,
      source: 'whatsapp_simulated',
      raw_text: rawText,
      transcript: rawText,
      received_at: new Date().toISOString(),
    };

    // Find the demo deal, copy it as a new one
    const demoDeal = state.deals.find((d) => d.id === 'dl_demo');
    const newDealId = `dl_${Math.random().toString(36).substring(2, 9)}`;
    const newDeal: Deal = {
      ...(demoDeal || DEFAULT_STATE.deals[3]),
      id: newDealId,
      enquiry_id: enqId,
      status: 'New',
      created_at: new Date().toISOString(),
    };

    saveKagazState({
      ...state,
      deals: [newDeal, ...state.deals],
    });

    return { enquiry: newEnquiry, deal: newDeal };
  },

  getDeals: (): Deal[] => {
    return getKagazState().deals;
  },

  getDeal: (id: string): Deal | undefined => {
    return getKagazState().deals.find((d) => d.id === id);
  },

  getDashboardSummary: () => {
    const state = getKagazState();
    
    // Counts
    const enquiries = state.deals.filter((d) => ['New', 'Extracted', 'Draft'].includes(d.status)).length;
    const quoted = state.deals.filter((d) => d.status === 'Quoted').length;
    const won = state.deals.filter((d) => ['Accepted', 'Payment Pending', 'Paid'].includes(d.status)).length;

    // Rupee calculations (pre-GST service value of the deals)
    let quotedPaise = 0;
    let wonPaise = 0;
    let collectedPaise = 0;

    state.deals.forEach((deal) => {
      // Calculate subtotal of this deal
      let subtotal = 0;
      deal.line_items.forEach((li) => {
        subtotal += li.unit_price_paise * li.quantity;
      });

      // Special handling for seed data which might not have items calculated yet
      if (subtotal === 0) {
        if (deal.id === 'dl_paid') subtotal = 5000000;
        else if (deal.id === 'dl_pending') subtotal = 2800000;
        else if (deal.id === 'dl_quoted') subtotal = 4200000;
      }

      if (deal.status === 'Quoted') {
        quotedPaise += subtotal;
      } else if (['Accepted', 'Payment Pending', 'Paid'].includes(deal.status)) {
        wonPaise += subtotal;
        if (deal.status === 'Paid') {
          collectedPaise += subtotal;
        }
      }
    });

    return {
      counts: { enquiries, quoted, won },
      amounts_paise: {
        quoted: quotedPaise,
        won: wonPaise,
        collected: collectedPaise,
      },
      currency: 'INR',
    };
  },
};
