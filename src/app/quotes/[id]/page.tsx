'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Printer, ExternalLink, Check, FileText } from 'lucide-react';
import { useKagazStore, formatINRPaise, formatINR } from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function QuotePreview() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const state = useKagazStore();
  const quote = state.quotes.find((q) => q.id === id);
  const deal = state.deals.find((d) => d.id === quote?.deal_id);

  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (quote && typeof window !== 'undefined') {
      const origin = window.location.origin;
      setPublicUrl(`${origin}/q/${quote.public_token}`);
    }
  }, [quote]);

  if (!quote || !deal) {
    return (
      <OwnerShell>
        <div className="p-10 text-center glass rounded-3xl animate-in fade-in max-w-md mx-auto mt-20">
          <h2 className="text-2xl font-black text-rose-600 tracking-tight">Quote Not Found</h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">The requested quote does not exist.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 inline-flex items-center px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 transition-colors text-white text-sm font-bold rounded-full shadow-[0_4px_14px_0_rgb(0,0,0,0.15)]"
          >
            Go Back
          </button>
        </div>
      </OwnerShell>
    );
  }

  // Copy quote link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open window print dialog
  const handlePrint = () => {
    window.print();
  };

  // Send Email via API
  const handleSendEmail = async () => {
    const email = window.prompt("Enter client's email address to send this quotation:");
    if (!email) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Quotation #${quote.number} from ${state.business.brand_name}`,
          quoteNumber: quote.number,
          quoteUrl: publicUrl,
          clientName: deal.client_name,
          brandName: state.business.brand_name,
        }),
      });
      if (res.ok) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email. Ensure you are using a verified Resend address (like your own email) on the free tier.');
      }
    } catch (e) {
      alert('Error sending email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <OwnerShell>
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 fade-in pb-12">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4 no-print">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 border border-border bg-white rounded-full hover:bg-neutral-50 text-muted-foreground transition-all hover:-translate-x-1 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-foreground">Quotation Issued</h1>
              <p className="text-xs font-medium text-muted-foreground">Quote number: {quote.number} &middot; Status: <span className="font-bold text-foreground">{quote.status}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 border border-border bg-white hover:bg-neutral-50 text-xs font-bold rounded-full text-foreground transition-all shadow-sm active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Client Link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 border border-border bg-white hover:bg-neutral-50 text-xs font-bold rounded-full text-foreground transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF / Print</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isSending ? 'Sending...' : 'Email Client'}</span>
            </button>

            <a
              href={`/q/${quote.public_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 text-xs font-bold rounded-full transition-all shadow-sm active:scale-95"
            >
              <span>Test Client View</span>
              <ExternalLink className="w-4 h-4 ml-0.5" />
            </a>
          </div>
        </div>

        {/* Demo Instruction Card (Hidden when printing) */}
        <div className="bg-blue-50/80 border border-blue-200/50 p-4 sm:p-5 rounded-2xl no-print space-y-2.5 shadow-sm">
          <h4 className="font-black text-xs text-blue-800 uppercase tracking-wider flex items-center">
            <span className="text-base mr-2">👉</span> Demo Walkthrough Instruction
          </h4>
          <p className="text-xs font-medium text-blue-900/80 leading-relaxed max-w-3xl">
            Click <strong className="text-blue-900">"Test Client View"</strong> above to open the public client acceptance page in a new browser tab. 
            Once you accept the quote in that tab, come back here or check the Dashboard—it will instantly sync and update in real-time!
          </p>
        </div>

        {/* Branded Quotation Document Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-border/40 p-8 md:p-12 max-w-4xl mx-auto print-container print-card relative overflow-hidden">
          
          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-900/5 rounded-bl-full -z-10 blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-border/60 pb-8">
            <div className="space-y-2.5">
              <span className="text-2xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500">{state.business.brand_name}</span>
              <p className="text-[11px] font-medium text-muted-foreground max-w-sm leading-relaxed">{state.business.address}</p>
              <p className="text-[11px] font-bold text-foreground">GSTIN: {state.business.gstin}</p>
            </div>
            
            <div className="md:text-right space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">QUOTATION</h2>
              <div className="text-[11px] font-medium text-muted-foreground space-y-1">
                <p>Quote Number: <span className="font-bold text-foreground">{quote.number}</span></p>
                <p>Date: <span className="font-bold text-foreground">{new Date(quote.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                <p>Valid Until: <span className="font-bold text-rose-600">{new Date(quote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
              </div>
            </div>
          </div>

          {/* Client Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-border/60">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Client Profile</p>
              <h4 className="font-black text-sm text-foreground">{deal.client_name}</h4>
              <p className="text-xs font-medium text-muted-foreground">{deal.client_phone}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Overview</p>
              <h4 className="font-black text-sm text-foreground">{deal.project_title}</h4>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">Timeline: {deal.timeline_days} Days</p>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="py-8 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scope of Work</h4>
            <p className="text-xs font-medium text-foreground leading-relaxed bg-neutral-50 p-4 rounded-2xl border border-border/50">
              {deal.scope_summary}
            </p>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-border text-muted-foreground font-bold tracking-wide uppercase text-[9px]">
                  <th className="py-3 px-2">Service Description</th>
                  <th className="py-3 px-2 text-center">SAC Code</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Price (₹)</th>
                  <th className="py-3 px-2 text-right">GST Rate</th>
                  <th className="py-3 px-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {deal.line_items.map((item) => {
                  const lineTotal = item.unit_price_paise * item.quantity;
                  return (
                    <tr key={item.id} className="text-foreground hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-2 font-bold">{item.description}</td>
                      <td className="py-4 px-2 text-center text-muted-foreground">
                        {state.rateCard.find((r) => r.id === item.rate_card_item_id)?.sac_code || '998319'}
                      </td>
                      <td className="py-4 px-2 text-center">{item.quantity}</td>
                      <td className="py-4 px-2 text-right">{formatINRPaise(item.unit_price_paise)}</td>
                      <td className="py-4 px-2 text-right text-blue-700 font-bold">{(item.tax_rate_bps / 100).toFixed(1)}%</td>
                      <td className="py-4 px-2 text-right font-black">{formatINRPaise(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Breakdown */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t-2 border-border pt-8 mt-2">
            {/* Notes Section */}
            <div className="space-y-2 md:max-w-md">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Terms & Notes</h5>
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed whitespace-pre-line">{quote.notes_to_client}</p>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full md:w-80 space-y-3 text-xs font-medium bg-neutral-50/80 p-5 rounded-2xl border border-border/50">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal <span className="text-[9px] uppercase">(Pre-GST)</span></span>
                <span className="font-bold text-foreground">{formatINRPaise(quote.subtotal_paise)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Integrated GST <span className="text-[9px] uppercase">(18%)</span></span>
                <span className="font-bold text-foreground">{formatINRPaise(quote.tax_paise)}</span>
              </div>
              <div className="border-t border-border pt-3 mt-1 flex justify-between items-center text-sm font-black text-foreground">
                <span className="uppercase tracking-widest text-[11px]">Grand Total</span>
                <span className="text-xl text-neutral-900">{formatINRPaise(quote.total_paise, true)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end border-t-2 border-border pt-8 mt-12 mb-4">
            <div className="space-y-4 w-48">
              <div className="border-b border-border/80 pb-1">
                <input type="text" placeholder="Owner Signature..." className="w-full bg-transparent outline-none text-foreground font-signature text-2xl placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:text-sm" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Authorized By</p>
                <p className="font-bold text-sm text-foreground">{state.business.brand_name}</p>
              </div>
            </div>
            <div className="space-y-4 w-48">
              <div className="border-b border-border/80 pb-1">
                <input type="text" placeholder="Client Signature..." className="w-full bg-transparent outline-none text-foreground font-signature text-2xl placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:text-sm" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accepted By</p>
                <input type="text" placeholder="Client Name" defaultValue={deal.client_name} className="w-full font-bold text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50" />
              </div>
            </div>
          </div>

          {/* Footer Signature placeholder */}
          <div className="border-t border-dashed border-border/80 pt-8 mt-12 text-center text-muted-foreground text-[10px] space-y-1.5 font-medium">
            <p>This is a computer-generated quotation prepared by <strong>KĀRYO</strong> via <strong>Kagaz</strong>.</p>
            <p>For any queries, please reach out to hello@karyo.in.</p>
          </div>

        </div>

      </div>
    </OwnerShell>
  );
}
