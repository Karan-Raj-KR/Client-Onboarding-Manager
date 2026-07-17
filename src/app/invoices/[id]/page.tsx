'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, CheckCircle, CreditCard, AlertCircle, ShieldCheck } from 'lucide-react';
import { useKagazStore, simulatePayment, formatINRPaise, paiseToRupee } from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const state = useKagazStore();
  const invoice = state.invoices.find((i) => i.id === id);
  const quote = state.quotes.find((q) => q.id === invoice?.quote_id);
  const deal = state.deals.find((d) => d.id === quote?.deal_id);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  React.useEffect(() => {
    if (invoice && typeof window !== 'undefined') {
      const origin = window.location.origin;
      setPublicUrl(`${origin}/pay/${invoice.id}`);
    }
  }, [invoice]);

  if (!invoice || !quote || !deal) {
    return (
      <OwnerShell>
        <div className="p-10 text-center glass rounded-3xl animate-in fade-in max-w-md mx-auto mt-20">
          <h2 className="text-2xl font-black text-rose-600 tracking-tight">Invoice Not Found</h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">The requested invoice does not exist.</p>
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

  // Trigger simulated payment
  const handleSimulatePayment = () => {
    simulatePayment(invoice.id);
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
    }, 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Send Email via API
  const handleSendEmail = async () => {
    const email = window.prompt("Enter client's email address to send this invoice:");
    if (!email) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Invoice #${invoice.number} from ${state.business.brand_name}`,
          quoteNumber: invoice.number, // Reusing field
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

  // Mock QR code SVG for clean vector display
  const renderMockQRCode = () => (
    <svg width="140" height="140" viewBox="0 0 29 29" className="text-neutral-800 fill-current">
      {/* Position Detection Patterns */}
      <path d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2zm18-2h7v7h-7zm1 1v5h5V1zm1 1h3v3H20zM0 22h7v7H0zm1 1v5h5v-5zm1 1h3v3H2z" />
      {/* Random-looking QR matrix points */}
      <path d="M9 0h2v1H9zm4 0h1v3h-1zm3 0h1v1h-1zm1 1h1v2h-1zm-4 2h2v1h-2zm6 0h1v1h-1zm-9 2h1v2H8zm4 0h1v1h-1zm3 1h2v1h-2zM9 7h1v1H9zm2 1h1v2h-1zm2 0h2v1h-2zm-6 2h1v1H7zm2 0h1v2H9zm3 0h1v1h-1zm5-2h1v3h-1zm3 0h1v1h-1zm0 2h1v1h-1zm-5 2h2v1h-2zm6 0h2v1h-2zm-12 2h3v1h-3zm5 0h1v1h-1zm2 0h1v2h-1zm3 0h1v1h-1zm3 0h1v1h-1zm-9 2h2v1h-2zm4 0h1v2h-1zm3 0h1v1h-1zm6 0h1v2h-1zm-13 2h1v2h-1zm2 0h1v1h-1zm3 0h2v1h-2zm6 0h1v1h-1zm-11 2h1v1H9zm3 0h2v1h-2zm5 0h1v1h-1zm2 0h1v1h-1zm2 1h2v1h-2z" />
      <rect x="13" y="13" width="3" height="3" fill="#C85A17" />
    </svg>
  );

  return (
    <OwnerShell>
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 fade-in pb-12">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4 no-print">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 border border-border bg-white rounded-full hover:bg-neutral-50 text-muted-foreground transition-all hover:-translate-x-1 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-foreground">Invoice Details</h1>
              <p className="text-xs font-medium text-muted-foreground">Invoice Number: {invoice.number} &middot; Status: <span className="font-bold text-foreground">{invoice.status}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <ArrowLeft className="w-4 h-4 rotate-135" /> {/* Use an icon or leave empty, reusing Arrow for now but let's just use text if no generic mail icon is imported */}
              <span>{isSending ? 'Sending...' : 'Email Client'}</span>
            </button>

            {invoice.status !== 'Paid' && (
              <button
                onClick={handleSimulatePayment}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgb(16,185,129,0.3)] hover:-translate-y-0.5 active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Simulate Client Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Payment Toast Overlay */}
        {paymentSuccess && (
          <div className="bg-emerald-50/90 border border-emerald-200/60 text-emerald-900 text-sm font-semibold p-4 sm:p-5 rounded-2xl shadow-sm no-print flex items-start space-x-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-emerald-100 p-2 rounded-full shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-emerald-800">Payment Simulated Successfully!</p>
              <p className="text-[11px] font-medium text-emerald-700/80 leading-relaxed max-w-xl">
                Invoice marked as Paid. Dashboard metrics updated (Collected value increased by {formatINRPaise(invoice.subtotal_paise)}).
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* GST Invoice Details Document (Left 2/3) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-border/40 p-8 md:p-12 print-container print-card relative overflow-hidden">
            
            {/* Subtle background pattern */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-900/5 rounded-bl-full -z-10 blur-3xl pointer-events-none" />

            {/* Paid Stamp for high-fidelity feel */}
            {invoice.status === 'Paid' && (
              <div className="absolute top-10 right-10 border-4 border-emerald-500/80 text-emerald-600/90 font-black uppercase rounded-2xl px-6 py-2 text-2xl tracking-[0.2em] rotate-12 bg-white/90 select-none z-10 shadow-lg backdrop-blur-sm">
                PAID
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-border/60 pb-8">
              <div className="space-y-2.5">
                <span className="text-2xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500">{state.business.brand_name}</span>
                <p className="text-[11px] font-medium text-muted-foreground max-w-sm leading-relaxed">{state.business.address}</p>
                <p className="text-[11px] font-bold text-foreground">GSTIN: {state.business.gstin}</p>
              </div>
              
              <div className="md:text-right space-y-2">
                <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">TAX INVOICE</h2>
                <div className="text-[11px] font-medium text-muted-foreground space-y-1">
                  <p>Invoice Number: <span className="font-bold text-foreground">{invoice.number}</span></p>
                  <p>Issue Date: <span className="font-bold text-foreground">{new Date(invoice.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                  <p>Due Date: <span className="font-bold text-foreground">{new Date(invoice.due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                </div>
              </div>
            </div>

            {/* Client billing info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-border/60">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Billed To</p>
                <h4 className="font-black text-sm text-foreground">{deal.client_name}</h4>
                <p className="text-xs font-medium text-muted-foreground">{deal.client_phone}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Title</p>
                <h4 className="font-black text-sm text-foreground">{deal.project_title}</h4>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">Generated from Quote: {quote.number}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto pt-8 pb-4">
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

            {/* Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t-2 border-border pt-8 mt-2">
              <div className="space-y-2 md:max-w-xs">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Invoice Declaration</h5>
                <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged. Subject to Bengaluru jurisdiction.
                </p>
              </div>

              <div className="w-full md:w-80 space-y-3 text-xs font-medium bg-neutral-50/80 p-5 rounded-2xl border border-border/50">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal <span className="text-[9px] uppercase">(Pre-GST Base)</span></span>
                  <span className="font-bold text-foreground">{formatINRPaise(invoice.subtotal_paise)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>CGST <span className="text-[9px] uppercase">(9%)</span></span>
                  <span className="font-bold text-foreground">{formatINRPaise(invoice.tax_paise / 2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>SGST <span className="text-[9px] uppercase">(9%)</span></span>
                  <span className="font-bold text-foreground">{formatINRPaise(invoice.tax_paise / 2)}</span>
                </div>
                <div className="border-t border-border pt-3 mt-1 flex justify-between items-center text-sm font-black text-foreground">
                  <span className="uppercase tracking-widest text-[11px]">Total Invoice Value</span>
                  <span className="text-xl text-neutral-900">{formatINRPaise(invoice.total_paise, true)}</span>
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

            {/* Footer */}
            <div className="border-t border-dashed border-border/80 pt-8 mt-12 text-center text-muted-foreground text-[10px] space-y-1.5 font-medium">
              <p>This is a computer-generated GST-ready Tax Invoice.</p>
              <p>Thank you for your business!</p>
            </div>

          </div>

          {/* UPI Payment Card Side Panel (Right 1/3 - Hidden in Print) */}
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 no-print lg:sticky lg:top-28 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-base text-foreground border-b border-border/50 pb-3 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-neutral-800" />
              <span>UPI Payment Card</span>
            </h3>

            {invoice.status === 'Paid' ? (
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-6 text-center space-y-3 shadow-inner">
                <div className="bg-white p-3 rounded-full w-14 h-14 mx-auto flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-black text-sm text-emerald-900">Invoice Fully Paid</h4>
                  <p className="text-[11px] font-medium text-emerald-800 leading-relaxed max-w-[200px] mx-auto">
                    The payment of <strong>{formatINRPaise(invoice.total_paise)}</strong> was simulated and reconciled. The deal is moved to <strong>Won</strong> and revenue is logged.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex flex-col items-center">
                
                {/* Mock QR Code Container */}
                <div className="border border-border p-5 rounded-3xl bg-white shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex items-center justify-center">
                  {renderMockQRCode()}
                </div>

                <div className="text-center space-y-1.5 w-full">
                  <p className="text-xs font-black text-foreground uppercase tracking-widest">Scan & Pay via UPI</p>
                  <p className="text-[11px] font-medium text-muted-foreground">UPI Handle: {state.business.bank_or_upi_handle}</p>
                  <div className="bg-neutral-50 border border-border/50 rounded-xl py-2 mt-2 shadow-inner">
                    <p className="text-lg font-black text-neutral-900">{formatINRPaise(invoice.total_paise, true)}</p>
                  </div>
                </div>

                {/* Mock payment URL box */}
                <div className="w-full bg-neutral-900 rounded-xl p-3 font-mono text-[10px] text-neutral-300 break-all leading-relaxed shadow-inner">
                  <span className="font-bold text-white uppercase tracking-wider text-[9px] mb-1 block opacity-70">UPI String:</span>
                  upi://pay?pa=karyo@upi&pn=KĀRYO&am={paiseToRupee(invoice.total_paise).toFixed(2)}&cu=INR&tn=Invoice%20{invoice.number}
                </div>

                <div className="w-full space-y-3 pt-2">
                  <button
                    onClick={handleSimulatePayment}
                    className="w-full inline-flex items-center justify-center space-x-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-[0_4px_14px_0_rgb(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Simulate Payment</span>
                  </button>
                  
                  <div className="flex items-start space-x-2 text-[10px] font-medium text-muted-foreground leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/50">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-amber-900 block mb-0.5">Hackathon Demo Boundary:</strong> Clicking "Simulate Payment" will immediately reconcile this invoice as Paid and update the Collected revenue totals on the main Dashboard.
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </OwnerShell>
  );
}
