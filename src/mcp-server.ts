import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getServerState, setServerState } from './lib/server-db';
import { Deal, Quote, Invoice, KagazState } from './lib/store';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function syncDealToSupabase(state: KagazState, dealId: string) {
  if (!supabase) return;
  try {
    const deal = state.deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const quotes = state.quotes.filter(q => q.deal_id === dealId);
    const quoteIds = quotes.map(q => q.id);
    const invoices = state.invoices.filter(i => quoteIds.includes(i.quote_id));
    const invoiceIds = invoices.map(i => i.id);
    const payments = state.payments.filter(p => invoiceIds.includes(p.invoice_id));
    const reminders = state.reminders.filter(r => invoiceIds.includes(r.invoice_id));

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
    
    await supabase.from('deals').upsert(payload);
  } catch (error) {
    console.error('Failed to sync to Supabase from MCP', error);
  }
}

const server = new Server(
  {
    name: 'karyo-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_deals',
        description: 'Get all deals in the CRM',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_rate_card',
        description: 'Get all rate card items',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'create_deal',
        description: 'Create a new deal with optional line items for pricing',
        inputSchema: {
          type: 'object',
          properties: {
            client_name: { type: 'string' },
            project_title: { type: 'string' },
            budget_min_paise: { type: 'number' },
            budget_max_paise: { type: 'number' },
            line_items: {
              type: 'array',
              description: 'Optional line items for the deal to calculate quote totals',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number', description: 'Defaults to 1' },
                  unit_price_paise: { type: 'number', description: 'Price per unit in paise (1 INR = 100 paise)' },
                  tax_rate_bps: { type: 'number', description: 'Tax rate in basis points (e.g., 1800 for 18%). Defaults to 1800' }
                },
                required: ['description', 'unit_price_paise']
              }
            }
          },
          required: ['client_name', 'project_title'],
        },
      },
      {
        name: 'update_deal_status',
        description: 'Update the status of a specific deal',
        inputSchema: {
          type: 'object',
          properties: {
            deal_id: { type: 'string' },
            status: { type: 'string', description: 'New, Draft, Quoted, Accepted, Payment Pending, Paid' },
          },
          required: ['deal_id', 'status'],
        },
      },
      {
        name: 'create_quote',
        description: 'Generate a quote for a specific deal based on its line items',
        inputSchema: {
          type: 'object',
          properties: {
            deal_id: { type: 'string' },
          },
          required: ['deal_id'],
        },
      },
      {
        name: 'accept_quote',
        description: 'Mark a quote as accepted by the client',
        inputSchema: {
          type: 'object',
          properties: {
            quote_id: { type: 'string' },
          },
          required: ['quote_id'],
        },
      },
      {
        name: 'create_invoice',
        description: 'Generate an invoice from an accepted quote',
        inputSchema: {
          type: 'object',
          properties: {
            quote_id: { type: 'string' },
          },
          required: ['quote_id'],
        },
      },
      {
        name: 'mark_invoice_paid',
        description: 'Mark an invoice as Paid and log the payment',
        inputSchema: {
          type: 'object',
          properties: {
            invoice_id: { type: 'string' },
          },
          required: ['invoice_id'],
        },
      },
      {
        name: 'get_invoices',
        description: 'Get all invoices',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_quotes',
        description: 'Get all quotes',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'send_quote_email',
        description: 'Send a quote to the client via email',
        inputSchema: {
          type: 'object',
          properties: {
            quote_id: { type: 'string' },
            to_email: { type: 'string', description: 'The email address of the client' },
          },
          required: ['quote_id', 'to_email'],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const state = getServerState();

  try {
    switch (request.params.name) {
      case 'get_deals': {
        return { content: [{ type: 'text', text: JSON.stringify(state.deals, null, 2) }] };
      }
      
      case 'get_rate_card': {
        return { content: [{ type: 'text', text: JSON.stringify(state.rateCard, null, 2) }] };
      }

      case 'get_invoices': {
        return { content: [{ type: 'text', text: JSON.stringify(state.invoices, null, 2) }] };
      }

      case 'get_quotes': {
        return { content: [{ type: 'text', text: JSON.stringify(state.quotes, null, 2) }] };
      }

      case 'create_deal': {
        const { client_name, project_title, budget_min_paise, budget_max_paise, line_items } = request.params.arguments as any;
        
        const mappedLineItems = Array.isArray(line_items) ? line_items.map((item: any) => ({
          id: `li_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          rate_card_item_id: '',
          description: item.description,
          quantity: item.quantity || 1,
          unit_price_paise: item.unit_price_paise,
          tax_rate_bps: item.tax_rate_bps || 1800
        })) : [];

        const newDeal: Deal = {
          id: `dl_${Date.now()}`,
          enquiry_id: null,
          client_name,
          client_phone: '',
          project_title,
          scope_summary: '',
          budget_min_paise: budget_min_paise || 0,
          budget_max_paise: budget_max_paise || 0,
          timeline_days: 0,
          status: 'New',
          confidence_bps: 10000,
          missing_information: [],
          notes: null,
          line_items: mappedLineItems,
          created_at: new Date().toISOString()
        };
        state.deals.push(newDeal);
        setServerState(state);
        await syncDealToSupabase(state, newDeal.id);
        return { content: [{ type: 'text', text: `Created deal ${newDeal.id}` }] };
      }

      case 'update_deal_status': {
        const { deal_id, status } = request.params.arguments as any;
        const deal = state.deals.find((d) => d.id === deal_id);
        if (!deal) throw new Error(`Deal ${deal_id} not found.`);
        deal.status = status;
        setServerState(state);
        await syncDealToSupabase(state, deal.id);
        return { content: [{ type: 'text', text: `Deal ${deal_id} updated to ${status}.` }] };
      }

      case 'create_quote': {
        const { deal_id } = request.params.arguments as any;
        const deal = state.deals.find((d) => d.id === deal_id);
        if (!deal) throw new Error(`Deal ${deal_id} not found.`);
        
        let subtotal = 0;
        let tax = 0;
        for (const item of deal.line_items) {
          const itemTotal = item.unit_price_paise * item.quantity;
          subtotal += itemTotal;
          tax += Math.round(itemTotal * (item.tax_rate_bps / 10000));
        }

        const newQuote: Quote = {
          id: `qt_${Date.now()}`,
          deal_id: deal.id,
          number: `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          public_token: `tok_${Date.now()}`,
          status: 'Quoted',
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          subtotal_paise: subtotal,
          tax_paise: tax,
          total_paise: subtotal + tax,
          notes_to_client: 'Generated automatically by MCP',
          accepted_at: null,
          created_at: new Date().toISOString()
        };

        deal.status = 'Quoted';
        state.quotes.push(newQuote);
        setServerState(state);
        await syncDealToSupabase(state, deal.id);
        return { content: [{ type: 'text', text: `Quote ${newQuote.id} created for Deal ${deal.id}. Public link: ${process.env.PUBLIC_APP_URL || 'http://localhost:3000'}/q/${newQuote.public_token}` }] };
      }

      case 'accept_quote': {
        const { quote_id } = request.params.arguments as any;
        const quote = state.quotes.find(q => q.id === quote_id);
        if (!quote) throw new Error(`Quote ${quote_id} not found`);
        quote.status = 'Accepted';
        quote.accepted_at = new Date().toISOString();
        const deal = state.deals.find(d => d.id === quote.deal_id);
        if (deal) {
          deal.status = 'Accepted';
          setServerState(state);
          await syncDealToSupabase(state, deal.id);
        } else {
          setServerState(state);
        }
        return { content: [{ type: 'text', text: `Quote ${quote.id} accepted` }] };
      }

      case 'create_invoice': {
        const { quote_id } = request.params.arguments as any;
        const quote = state.quotes.find(q => q.id === quote_id);
        if (!quote) throw new Error(`Quote ${quote_id} not found`);
        
        const newInvoice: Invoice = {
          id: `inv_${Date.now()}`,
          quote_id: quote.id,
          number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'Issued',
          issued_at: new Date().toISOString(),
          due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          subtotal_paise: quote.subtotal_paise,
          tax_paise: quote.tax_paise,
          total_paise: quote.total_paise,
          pdf_path: null,
          created_at: new Date().toISOString()
        };

        const deal = state.deals.find(d => d.id === quote.deal_id);
        if (deal) {
          deal.status = 'Payment Pending';
          state.invoices.push(newInvoice);
          setServerState(state);
          await syncDealToSupabase(state, deal.id);
        } else {
          state.invoices.push(newInvoice);
          setServerState(state);
        }
        return { content: [{ type: 'text', text: `Invoice ${newInvoice.id} created from Quote ${quote.id}` }] };
      }

      case 'mark_invoice_paid': {
        const { invoice_id } = request.params.arguments as any;
        const invoice = state.invoices.find(i => i.id === invoice_id);
        if (!invoice) throw new Error(`Invoice ${invoice_id} not found`);
        
        invoice.status = 'Paid';
        
        state.payments.push({
          id: `pay_${Date.now()}`,
          invoice_id: invoice.id,
          provider: 'mock',
          payment_url: `https://karyo.in/pay/${invoice.id}`,
          amount_paise: invoice.total_paise,
          status: 'paid',
          paid_at: new Date().toISOString()
        });

        const quote = state.quotes.find(q => q.id === invoice.quote_id);
        if (quote) {
          const deal = state.deals.find(d => d.id === quote.deal_id);
          if (deal) {
            deal.status = 'Paid';
            setServerState(state);
            await syncDealToSupabase(state, deal.id);
            return { content: [{ type: 'text', text: `Invoice ${invoice.id} marked as paid` }] };
          }
        }

        setServerState(state);
        return { content: [{ type: 'text', text: `Invoice ${invoice.id} marked as paid` }] };
      }

      case 'send_quote_email': {
        const { quote_id, to_email } = request.params.arguments as any;
        const quote = state.quotes.find(q => q.id === quote_id);
        if (!quote) throw new Error(`Quote ${quote_id} not found`);
        const deal = state.deals.find(d => d.id === quote.deal_id);
        
        try {
          const baseUrl = process.env.PUBLIC_APP_URL || 'https://karyo-client-onboarding-manager.vercel.app';
          const response = await fetch(`http://localhost:3000/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: to_email,
              subject: `Your Quotation for ${deal?.project_title || 'Project'}`,
              quoteNumber: quote.number,
              quoteUrl: `${baseUrl}/q/${quote.public_token}`,
              clientName: deal?.client_name,
              brandName: state.business.brand_name
            })
          });
          if (!response.ok) {
            throw new Error(`Email API failed: ${response.statusText}`);
          }
          return { content: [{ type: 'text', text: `Email successfully sent to ${to_email} for Quote ${quote_id}` }] };
        } catch (e: any) {
          throw new Error(`Failed to send email: ${e.message}`);
        }
      }

      default:
        throw new Error('Unknown tool');
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('KĀRYO MCP server running with automated CRUD tools on stdio');
}

main().catch((error) => {
  console.error('Fatal error in MCP server:', error);
  process.exit(1);
});
