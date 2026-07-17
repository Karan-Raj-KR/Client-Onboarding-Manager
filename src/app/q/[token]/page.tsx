'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, Clock, CheckCircle2, Loader2, FileCheck } from 'lucide-react';
import { useKagazStore, acceptQuote, formatINRPaise } from '@/lib/store';

export default function ClientAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const state = useKagazStore();
  
  // Find quote by token
  const quote = state.quotes.find((q) => q.public_token === token);
  const deal = state.deals.find((d) => d.id === quote?.deal_id);

  // Animation cascade state
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Quotation accepted',
    'Generating GST-ready invoice...',
    'Creating payment link...',
    'Arming reminders...',
  ];

  // If quote is already accepted, check if there's an invoice and direct to it
  useEffect(() => {
    if (quote && quote.status === 'Accepted') {
      const invoice = state.invoices.find((i) => i.quote_id === quote.id);
      if (invoice) {
        // Redirect directly without animation if already accepted
        router.push(`/pay/${invoice.id}`);
      }
    }
  }, [quote, state.invoices, router]);

  if (!quote || !deal) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="p-10 text-center glass rounded-3xl animate-in fade-in max-w-md mx-auto">
          <h2 className="text-2xl font-black text-rose-600 tracking-tight">Proposal Expired or Invalid</h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">This link is incorrect or the quote is no longer active.</p>
        </div>
      </div>
    );
  }

  // Run acceptance cascade
  const handleAccept = () => {
    setIsAccepting(true);
    setCurrentStep(0);

    // Trigger step-by-step checkmark animation
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          
          // Trigger the atomic accept transaction
          const result = acceptQuote(token, deal.client_name);
          
          // Redirect to client payment page
          setTimeout(() => {
            if (result) {
              router.push(`/pay/${result.invoice.id}`);
            }
          }, 800);
          
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10 px-4 flex flex-col justify-center items-center">
      {/* Mobile viewport simulator container */}
      <div className="w-full max-w-md glass rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-700 fade-in border border-border/40">
        
        {/* Header banner */}
        <div className="bg-neutral-900 p-8 text-white space-y-1.5 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          <span className="relative text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full border border-white/10 shadow-sm backdrop-blur-sm">Proposal</span>
          <h1 className="relative text-2xl font-black tracking-tighter mt-3">{state.business.brand_name}</h1>
          <p className="relative text-[11px] font-medium text-neutral-400">{state.business.legal_name}</p>
        </div>

        {/* Client details card */}
        <div className="p-6 border-b border-border/60 bg-neutral-50/80 space-y-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prepared For</span>
              <h4 className="font-black text-base text-foreground tracking-tight">{deal.client_name}</h4>
              <p className="text-xs font-medium text-muted-foreground">{deal.client_phone}</p>
            </div>
            <div className="text-right space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quote ID</span>
              <p className="font-black text-sm text-foreground">{quote.number}</p>
              <p className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Valid till: {new Date(quote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
          </div>

          <div className="bg-white border border-border/50 rounded-2xl p-4 flex justify-around text-center text-xs shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Timeline</span>
              <p className="font-black text-foreground flex items-center justify-center">
                <Clock className="w-4 h-4 mr-1.5 text-neutral-400" /> {deal.timeline_days} Days
              </p>
            </div>
            <div className="border-r border-border/60" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GST Ready</span>
              <p className="font-black text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" /> Yes
              </p>
            </div>
          </div>
        </div>

        {/* Project details */}
        <div className="p-6 flex-1 space-y-6">
          <div className="space-y-1.5">
            <h3 className="font-black text-base text-foreground tracking-tight">{deal.project_title}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">{deal.scope_summary}</p>
          </div>

          {/* Line items list */}
          <div className="space-y-4 border-t-2 border-border/60 pt-5">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estimated Costs</h5>
            <div className="space-y-4">
              {deal.line_items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="space-y-1 max-w-[70%]">
                    <p className="font-black text-foreground tracking-tight">{item.description}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">Qty: {item.quantity} &middot; GST {item.tax_rate_bps / 100}%</p>
                  </div>
                  <span className="font-black text-foreground">
                    {formatINRPaise(item.unit_price_paise * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t-2 border-border pt-5 space-y-2.5 text-xs font-medium">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Subtotal <span className="text-[10px] uppercase">(Base Value)</span></span>
              <span className="font-bold text-foreground">{formatINRPaise(quote.subtotal_paise)}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>GST <span className="text-[10px] uppercase">(18%)</span></span>
              <span className="font-bold text-foreground">{formatINRPaise(quote.tax_paise)}</span>
            </div>
            <div className="border-t border-border/80 pt-4 mt-2 flex justify-between items-center text-sm font-black text-foreground">
              <span className="uppercase tracking-widest text-[11px]">Total Quotation Cost</span>
              <span className="text-xl text-neutral-900">{formatINRPaise(quote.total_paise, true)}</span>
            </div>
          </div>
        </div>

        {/* Accept Button Footer */}
        <div className="p-6 border-t border-border/60 bg-neutral-50/50">
          <button
            onClick={handleAccept}
            className="group relative w-full py-4 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-2 overflow-hidden"
          >
            {/* Shimmer effect inside button */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
            <FileCheck className="w-5 h-5 relative z-10" />
            <span className="relative z-10 text-sm tracking-wide">Accept Proposal & Generate Invoice</span>
          </button>
        </div>

      </div>

      {/* Acceptance Progress Overlay Modal */}
      {isAccepting && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 space-y-6 shadow-2xl border border-white/20">
            <div className="flex items-center space-x-3 pb-4 border-b border-border/50">
              <Loader2 className="w-6 h-6 text-neutral-900 animate-spin" />
              <h3 className="font-black text-lg text-foreground tracking-tight">Accepting Quotation...</h3>
            </div>
            
            {/* Steps checklist */}
            <div className="space-y-4 pt-2">
              {steps.map((step, idx) => {
                const isDone = idx < currentStep;
                const isActive = idx === currentStep;

                return (
                  <div
                    key={idx}
                    className={`flex items-center space-x-4 transition-all duration-300 ${
                      isDone || isActive ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-neutral-900 animate-spin shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
                    )}
                    
                    <span className={`text-sm ${
                      isDone ? 'text-emerald-700 font-medium line-through decoration-emerald-200' :
                      isActive ? 'text-foreground font-black tracking-tight' : 'text-muted-foreground font-medium'
                    }`}>
                      {idx === 0 && isDone ? 'Quotation accepted' : step}
                    </span>
                  </div>
                );
              })}
            </div>

            {currentStep === steps.length - 1 && (
              <div className="pt-4 animate-in slide-in-from-bottom-2 fade-in">
                <p className="text-xs text-emerald-800 font-bold text-center bg-emerald-50 border border-emerald-200 py-3 px-4 rounded-xl animate-pulse shadow-inner">
                  Invoice generated! Launching payment gateway...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
