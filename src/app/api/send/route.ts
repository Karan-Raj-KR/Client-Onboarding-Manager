import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { getServerState } from '@/lib/server-db';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { to, subject, quoteNumber, quoteUrl, clientName, brandName } = await request.json();

    if (!to || !quoteUrl) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Auto-sync to Supabase to ensure public Vercel links work
    try {
      const state = getServerState();
      let dealToSync = null;
      let quote = null;
      
      // Find quote by token from quoteUrl, or by quoteNumber
      const publicTokenMatch = quoteUrl.match(/\/q\/(tok_[^/?]+)/);
      if (publicTokenMatch) {
        quote = state.quotes.find(q => q.public_token === publicTokenMatch[1]);
      } else if (quoteNumber) {
        quote = state.quotes.find(q => q.number === quoteNumber);
      }
      
      if (quote) {
        dealToSync = state.deals.find(d => d.id === quote.deal_id);
      }

      if (dealToSync) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const quotes = state.quotes.filter(q => q.deal_id === dealToSync.id);
          const quoteIds = quotes.map(q => q.id);
          const invoices = state.invoices.filter(i => quoteIds.includes(i.quote_id));
          const invoiceIds = invoices.map(i => i.id);
          const payments = state.payments.filter(p => invoiceIds.includes(p.invoice_id));
          const reminders = state.reminders.filter(r => invoiceIds.includes(r.invoice_id));

          const payload = {
            id: dealToSync.id,
            project_title: dealToSync.project_title,
            client_name: dealToSync.client_name,
            client_phone: dealToSync.client_phone,
            scope_summary: dealToSync.scope_summary,
            timeline_days: dealToSync.timeline_days,
            budget_min_paise: dealToSync.budget_min_paise,
            budget_max_paise: dealToSync.budget_max_paise,
            missing_information: dealToSync.missing_information,
            confidence_bps: dealToSync.confidence_bps,
            status: dealToSync.status,
            data: {
              enquiry_id: dealToSync.enquiry_id,
              notes: dealToSync.notes,
              line_items: dealToSync.line_items,
              quotes,
              invoices,
              payments,
              reminders
            }
          };
          await supabase.from('deals').upsert(payload);
          console.log(`Successfully synced deal ${dealToSync.id} to Supabase before sending email.`);
        }
      }
    } catch (syncError) {
      console.error('Failed to auto-sync to Supabase:', syncError);
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAF8F5;">
        <div style="background-color: #FFFFFF; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
          <h2 style="margin-top: 0; font-size: 24px; color: #09090B; font-weight: 800; letter-spacing: -0.5px;">Quotation ${quoteNumber ? `#${quoteNumber}` : ''}</h2>
          
          <p style="font-size: 15px; color: #6B7280; line-height: 1.6; margin-top: 24px;">
            Hi ${clientName || 'there'},
          </p>
          
          <p style="font-size: 15px; color: #6B7280; line-height: 1.6;">
            Please find the proposal and quotation for your project attached below. You can view the full details, review the line items, and accept the quotation directly via the secure link.
          </p>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${quoteUrl}" style="display: inline-block; background-color: #09090B; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 999px;">
              View & Accept Quotation
            </a>
          </div>
          
          <p style="font-size: 15px; color: #6B7280; line-height: 1.6;">
            If you have any questions or need modifications to the scope, please don't hesitate to reply to this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          
          <p style="margin: 0; font-size: 12px; color: #666666;">Sent via <strong>KĀRYO</strong> Client Onboarding Manager on behalf of ${brandName || 'our agency'}.</p>
        </div>
      </div>
    `;

    // Try Gmail first
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: `"${brandName || 'KĀRYO'}" <${process.env.GMAIL_USER}>`,
        to,
        subject: subject || `Your Quotation from ${brandName || 'KĀRYO'}`,
        html: htmlContent,
      });

      return NextResponse.json({ success: true, messageId: info.messageId, provider: 'gmail' });
    } 
    // Fallback to Resend if Gmail is not configured (e.g. on Vercel)
    else if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: `${brandName || 'KĀRYO'} <onboarding@resend.dev>`,
        to: [to],
        subject: subject || `Your Quotation from ${brandName || 'KĀRYO'}`,
        html: htmlContent,
      });

      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return NextResponse.json({ success: true, data, provider: 'resend' });
    } 
    
    return NextResponse.json({ error: 'No email provider configured. Add GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY.' }, { status: 500 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
