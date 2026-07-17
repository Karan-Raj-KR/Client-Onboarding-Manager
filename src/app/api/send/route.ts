import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, quoteNumber, quoteUrl, clientName, brandName } = await request.json();

    if (!to || !quoteUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `${brandName || 'Kagaz'} <onboarding@resend.dev>`,
      to: [to],
      subject: subject || `Your Quotation from ${brandName || 'Kagaz'}`,
      html: `
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
            
            <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin-bottom: 0;">
              Sent via <strong>Kagaz</strong> on behalf of ${brandName || 'our agency'}.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
