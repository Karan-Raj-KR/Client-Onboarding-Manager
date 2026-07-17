import { useState, useEffect } from 'react';

// === DATA MODELS ===

export interface BusinessProfile {
  id: string;
  legal_name: string;
  brand_name: string;
  gstin: string;
  address: string;
  bank_or_upi_handle: string;
  logo_url: string;
}

export interface RateCardItem {
  id: string;
  name: string;
  description: string;
  sac_code: string;
  unit_price_paise: number;
  tax_rate_bps: number; // e.g. 1800 = 18.00%
  active: boolean;
}

export interface Enquiry {
  id: string;
  source: string;
  raw_text: string;
  transcript: string;
  received_at: string;
}

export interface DealLineItem {
  id: string;
  rate_card_item_id: string;
  description: string;
  quantity: number;
  unit_price_paise: number;
  tax_rate_bps: number;
}

export interface Deal {
  id: string;
  enquiry_id: string | null;
  client_name: string;
  client_phone: string;
  project_title: string;
  scope_summary: string;
  budget_min_paise: number;
  budget_max_paise: number;
  timeline_days: number;
  status: 'New' | 'Extracted' | 'Draft' | 'Quoted' | 'Accepted' | 'Payment Pending' | 'Paid';
  confidence_bps: number;
  missing_information: string[];
  notes: string | null;
  line_items: DealLineItem[];
  created_at: string;
}

export interface Quote {
  id: string;
  deal_id: string;
  number: string;
  public_token: string;
  status: 'Draft' | 'Quoted' | 'Accepted' | 'Expired';
  valid_until: string;
  subtotal_paise: number; // Pre-GST service value
  tax_paise: number;
  total_paise: number;
  notes_to_client: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  quote_id: string;
  number: string;
  status: 'Draft' | 'Issued' | 'Paid' | 'Cancelled';
  issued_at: string;
  due_at: string;
  subtotal_paise: number;
  tax_paise: number;
  total_paise: number;
  pdf_path: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  provider: 'mock';
  payment_url: string;
  amount_paise: number; // Full invoice total (with GST)
  status: 'pending' | 'paid';
  paid_at: string | null;
}

export interface Reminder {
  id: string;
  invoice_id: string;
  scheduled_for: string;
  channel: 'whatsapp' | 'email';
  status: 'armed' | 'sent' | 'cancelled';
  body: string;
}

export interface KagazState {
  business: BusinessProfile;
  rateCard: RateCardItem[];
  deals: Deal[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  reminders: Reminder[];
}

// === INR FORMATTING HELPERS ===

export function paiseToRupee(paise: number): number {
  return paise / 100;
}

export function rupeeToPaise(rupee: number): number {
  return Math.round(rupee * 100);
}

export function formatINR(rupeeAmount: number, includeDecimals = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupeeAmount);
}

export function formatINRPaise(paiseAmount: number, includeDecimals = false): string {
  return formatINR(paiseToRupee(paiseAmount), includeDecimals);
}

// === SEED DATA ===

const INITIAL_BUSINESS: BusinessProfile = {
  id: 'biz_karyo',
  legal_name: 'KĀRYO TECHNOLOGIES PVT LTD',
  brand_name: 'KĀRYO',
  gstin: '29ABCDE1234F1Z5',
  address: '12, 3rd Cross Road, Koramangala 4th Block, Bengaluru, Karnataka 560034',
  bank_or_upi_handle: 'karyo@upi',
  logo_url: '/logo.png',
};

const INITIAL_RATE_CARD: RateCardItem[] = [
  {
    id: 'rc_web',
    name: 'Restaurant Website + Online Ordering Setup',
    description: 'Custom React-based website, digital menu, shopping cart, WhatsApp ordering integration, and Google Business setup.',
    sac_code: '998313',
    unit_price_paise: 3500000, // ₹35,000
    tax_rate_bps: 1800, // 18.00%
    active: true,
  },
  {
    id: 'rc_brand',
    name: 'Brand Identity Starter',
    description: 'Logo suite, primary color palette, typography guidelines, visiting card design, and social media templates.',
    sac_code: '998311',
    unit_price_paise: 1800000, // ₹18,000
    tax_rate_bps: 1800,
    active: true,
  },
  {
    id: 'rc_social',
    name: 'Social Media Monthly Retainer',
    description: '12 customized graphics, caption copywriting in local language/tone, hashtag strategy, and monthly performance report.',
    sac_code: '998315',
    unit_price_paise: 2500000, // ₹25,000
    tax_rate_bps: 1800,
    active: true,
  },
  {
    id: 'rc_consult',
    name: 'Strategy Consultation',
    description: '2-hour deep-dive growth strategy session, competitor analysis snapshot, and local promotion action checklist.',
    sac_code: '998319',
    unit_price_paise: 500000, // ₹5,000
    tax_rate_bps: 1800,
    active: true,
  },
];

const INITIAL_DEALS: Deal[] = [
  {
    id: 'dl_paid',
    enquiry_id: null,
    client_name: 'Aaranya Sharma (Aaranya Boutique)',
    client_phone: '+91 98860 12345',
    project_title: 'Aaranya Boutique Branding',
    scope_summary: 'Complete brand guidelines, primary logo, and social media launch package.',
    budget_min_paise: 4000000, // ₹40,000
    budget_max_paise: 6000000, // ₹60,000
    timeline_days: 30,
    status: 'Paid',
    confidence_bps: 9500,
    missing_information: [],
    notes: 'Historical deal. Paid on time.',
    line_items: [
      {
        id: 'li_p1',
        rate_card_item_id: 'rc_brand',
        description: 'Brand Identity Starter Package',
        quantity: 1,
        unit_price_paise: 1800000,
        tax_rate_bps: 1800,
      },
      {
        id: 'li_p2',
        rate_card_item_id: 'rc_social',
        description: 'Social Media Launch Retainer (Customized)',
        quantity: 1,
        unit_price_paise: 3200000,
        tax_rate_bps: 1800,
      },
    ],
    created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 'dl_pending',
    enquiry_id: null,
    client_name: 'Rajesh Kumar (Gourmet Chai)',
    client_phone: '+91 99000 54321',
    project_title: 'Gourmet Chai Socials',
    scope_summary: 'Retainer for social media copywriting and strategy consultation.',
    budget_min_paise: 2000000,
    budget_max_paise: 3000000,
    timeline_days: 30,
    status: 'Payment Pending',
    confidence_bps: 9000,
    missing_information: [],
    notes: 'Historical deal. Awaiting invoice clearance.',
    line_items: [
      {
        id: 'li_pn1',
        rate_card_item_id: 'rc_social',
        description: 'Social Media Monthly Retainer',
        quantity: 1,
        unit_price_paise: 2500000,
        tax_rate_bps: 1800,
      },
      {
        id: 'li_pn2',
        rate_card_item_id: 'rc_consult',
        description: 'Strategy Consultation',
        quantity: 1,
        unit_price_paise: 300000,
        tax_rate_bps: 1800,
      },
    ],
    created_at: '2026-07-01T12:00:00Z',
  },
  {
    id: 'dl_quoted',
    enquiry_id: null,
    client_name: 'Dr. Ananya Rao (Veda Yoga)',
    client_phone: '+91 97410 98765',
    project_title: 'Veda Yoga Strategy',
    scope_summary: 'Strategy consultation and initial brand guidelines.',
    budget_min_paise: 3500000,
    budget_max_paise: 4500000,
    timeline_days: 20,
    status: 'Quoted',
    confidence_bps: 8500,
    missing_information: ['Exact studio locations'],
    notes: 'Historical deal. Quote currently valid.',
    line_items: [
      {
        id: 'li_q1',
        rate_card_item_id: 'rc_brand',
        description: 'Brand Identity Starter Package (Custom)',
        quantity: 1,
        unit_price_paise: 1850000,
        tax_rate_bps: 1800,
      },
      {
        id: 'li_q2',
        rate_card_item_id: 'rc_social',
        description: 'Social Media Marketing Launch',
        quantity: 1,
        unit_price_paise: 2350000,
        tax_rate_bps: 1800,
      },
    ],
    created_at: '2026-07-10T15:30:00Z',
  },
  {
    id: 'dl_demo',
    enquiry_id: 'enq_demo',
    client_name: 'Aditi Sharma',
    client_phone: '+91 98450 67890',
    project_title: 'Restaurant Website with Online Ordering',
    scope_summary: 'Five-page website with menu card, cart, online order collection via WhatsApp, and basic SEO.',
    budget_min_paise: 3000000, // ₹30,000
    budget_max_paise: 4000000, // ₹40,000
    timeline_days: 14,
    status: 'New',
    confidence_bps: 9400,
    missing_information: ['GSTIN', 'menu item pricing', 'delivery partner integrations'],
    notes: 'bhai restaurant ke liye website chahiye, online ordering bhi, budget 30-40k, kitne din?',
    line_items: [],
    created_at: '2026-07-17T15:00:00Z',
  },
];

const INITIAL_QUOTES: Quote[] = [
  {
    id: 'qt_paid',
    deal_id: 'dl_paid',
    number: 'Q-2026-0098',
    public_token: 'token_paid',
    status: 'Accepted',
    valid_until: '2026-06-22',
    subtotal_paise: 5000000, // ₹50,000
    tax_paise: 900000,
    total_paise: 5900000,
    notes_to_client: 'Please make 100% payment on receipt.',
    accepted_at: '2026-06-16T11:00:00Z',
    created_at: '2026-06-15T11:00:00Z',
  },
  {
    id: 'qt_pending',
    deal_id: 'dl_pending',
    number: 'Q-2026-0099',
    public_token: 'token_pending',
    status: 'Accepted',
    valid_until: '2026-07-08',
    subtotal_paise: 2800000, // ₹28,000
    tax_paise: 504000,
    total_paise: 3304000,
    notes_to_client: '50% advance, 50% on milestone complete.',
    accepted_at: '2026-07-02T10:00:00Z',
    created_at: '2026-07-01T13:00:00Z',
  },
  {
    id: 'qt_quoted',
    deal_id: 'dl_quoted',
    number: 'Q-2026-0100',
    public_token: 'token_yoga',
    status: 'Quoted',
    valid_until: '2026-07-24',
    subtotal_paise: 4200000, // ₹42,000
    tax_paise: 756000,
    total_paise: 4956000,
    notes_to_client: 'Validity 14 days. Prices exclude extra domain hosting charges.',
    accepted_at: null,
    created_at: '2026-07-10T16:00:00Z',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_paid',
    quote_id: 'qt_paid',
    number: 'INV-2026-0098',
    status: 'Paid',
    issued_at: '2026-06-16T11:05:00Z',
    due_at: '2026-06-23T11:05:00Z',
    subtotal_paise: 5000000,
    tax_paise: 900000,
    total_paise: 5900000,
    pdf_path: '/invoices/inv_paid.pdf',
    created_at: '2026-06-16T11:05:00Z',
  },
  {
    id: 'inv_pending',
    quote_id: 'qt_pending',
    number: 'INV-2026-0099',
    status: 'Issued',
    issued_at: '2026-07-02T10:05:00Z',
    due_at: '2026-07-09T10:05:00Z',
    subtotal_paise: 2800000,
    tax_paise: 504000,
    total_paise: 3304000,
    pdf_path: '/invoices/inv_pending.pdf',
    created_at: '2026-07-02T10:05:00Z',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_paid',
    invoice_id: 'inv_paid',
    provider: 'mock',
    payment_url: 'https://upi.example/mock-pay/inv_paid',
    amount_paise: 5900000,
    status: 'paid',
    paid_at: '2026-06-16T15:00:00Z',
  },
  {
    id: 'pay_pending',
    invoice_id: 'inv_pending',
    provider: 'mock',
    payment_url: 'https://upi.example/mock-pay/inv_pending',
    amount_paise: 3304000,
    status: 'pending',
    paid_at: null,
  },
];

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem_pending',
    invoice_id: 'inv_pending',
    scheduled_for: '2026-07-18T10:00:00Z',
    channel: 'whatsapp',
    status: 'armed',
    body: 'Hi Rajesh, a quick reminder that invoice INV-2026-0099 for ₹33,040 is pending. You can pay here: https://kagaz.in/pay/token_pending',
  },
];

const DEFAULT_STATE: KagazState = {
  business: INITIAL_BUSINESS,
  rateCard: INITIAL_RATE_CARD,
  deals: INITIAL_DEALS,
  quotes: INITIAL_QUOTES,
  invoices: INITIAL_INVOICES,
  payments: INITIAL_PAYMENTS,
  reminders: INITIAL_REMINDERS,
};

// === DATABASE ACTIONS ===

const DB_KEY = 'kagaz_db_v1';

export function getKagazState(): KagazState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  const stored = window.localStorage.getItem(DB_KEY);
  if (!stored) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse Kagaz DB from localStorage, resetting', e);
    window.localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
}

export function saveKagazState(state: KagazState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(state));
  notify();
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

  useEffect(() => {
    // Initial mount hydration - deferred to a microtask to avoid synchronous render updates collision
    queueMicrotask(() => {
      setState(getKagazState());
    });

    const handleUpdate = () => {
      setState(getKagazState());
    };

    const unsubscribe = subscribe(handleUpdate);

    // Sync across open browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DB_KEY) {
        handleUpdate();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return state;
}

// === BUSINESS TRANSACTION LOGIC ===

/**
 * Simulates AI extraction on a deal
 */
export function extractDealWithAI(dealId: string): Deal | null {
  const state = getKagazState();
  const dealIndex = state.deals.findIndex((d) => d.id === dealId);
  if (dealIndex === -1) return null;

  const deal = state.deals[dealIndex];
  if (deal.status !== 'New') return deal;

  const updatedDeal: Deal = {
    ...deal,
    status: 'Draft',
    // Pre-populate extraction content
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

  const newDeals = [...state.deals];
  newDeals[dealIndex] = updatedDeal;

  saveKagazState({
    ...state,
    deals: newDeals,
  });

  return updatedDeal;
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
      ...(demoDeal || INITIAL_DEALS[3]),
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
