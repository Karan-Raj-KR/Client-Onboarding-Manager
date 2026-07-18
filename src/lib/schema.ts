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
  tailored_documents?: any[];
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

export interface Template {
  id: string;
  name: string;
  body_markdown: string;
}

export interface KagazState {
  business: BusinessProfile;
  rateCard: RateCardItem[];
  deals: Deal[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  reminders: Reminder[];
  templates: Template[];
  isLoaded?: boolean;
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
    body: 'Hi Rajesh, a quick reminder that invoice INV-2026-0099 for ₹33,040 is pending. You can pay here: https://karyo.in/pay/token_pending',
  },
];

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'tpl_demo',
    name: 'Standard Service Agreement',
    body_markdown: `# Service Agreement\n\nThis Service Agreement is entered into by and between [YOUR COMPANY NAME] and [CLIENT NAME] on [DATE].\n\n## 1. Scope of Work\nThe Service Provider agrees to deliver the following project: **[PROJECT TITLE]**.\n\n[SCOPE OF WORK]\n\n## 2. Timeline\nThe estimated timeline for completion is [TIMELINE].\n\n## 3. Compensation\nThe total compensation for the services described above is [TOTAL AMOUNT] (excluding GST). Payment terms are strictly as per the generated invoice.\n\n## 4. Acceptance\nBy accepting this proposal, the Client agrees to the terms and conditions outlined in this document.\n\n---\n*Signed digitally by KĀRYO system upon quote acceptance.*`
  }
];

export const DEFAULT_STATE: KagazState = {
  business: INITIAL_BUSINESS,
  rateCard: INITIAL_RATE_CARD,
  deals: INITIAL_DEALS,
  quotes: INITIAL_QUOTES,
  invoices: INITIAL_INVOICES,
  payments: INITIAL_PAYMENTS,
  reminders: INITIAL_REMINDERS,
  templates: INITIAL_TEMPLATES,
};

// === DATABASE ACTIONS ===

