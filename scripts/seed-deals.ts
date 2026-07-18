import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { DEFAULT_STATE } from '../src/lib/schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding deals...');
  for (const deal of DEFAULT_STATE.deals) {
    const quotes = DEFAULT_STATE.quotes.filter((q) => q.deal_id === deal.id);
    const quoteIds = quotes.map((q) => q.id);
    const invoices = DEFAULT_STATE.invoices.filter((i) => quoteIds.includes(i.quote_id));
    const invoiceIds = invoices.map((i) => i.id);
    const payments = DEFAULT_STATE.payments.filter((p) => invoiceIds.includes(p.invoice_id));
    const reminders = DEFAULT_STATE.reminders.filter((r) => invoiceIds.includes(r.invoice_id));

    const payload = {
      id: deal.id,
      project_title: deal.project_title,
      client_name: deal.client_name,
      client_phone: deal.client_phone,
      scope_summary: deal.scope_summary,
      timeline_days: deal.timeline_days,
      budget_min_paise: deal.budget_min_paise,
      budget_max_paise: deal.budget_max_paise,
      missing_information: deal.missing_information,
      confidence_bps: deal.confidence_bps,
      status: deal.status,
      created_at: deal.created_at,
      data: {
        enquiry_id: deal.enquiry_id,
        notes: deal.notes,
        line_items: deal.line_items,
        quotes,
        invoices,
        payments,
        reminders
      }
    };

    const { error } = await supabase.from('deals').upsert(payload);
    if (error) {
      console.error(`Error inserting ${deal.id}:`, error);
    } else {
      console.log(`Successfully seeded ${deal.id}`);
    }
  }
  console.log('Done!');
}

seed();
