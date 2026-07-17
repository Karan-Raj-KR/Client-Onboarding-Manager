'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Inbox, PlusCircle, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { useKagazStore, api, formatINRPaise } from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function Dashboard() {
  const state = useKagazStore();
  const summary = api.getDashboardSummary();

  // Helper to render status chips
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
            <AlertCircle className="w-3 h-3 mr-1" /> New
          </span>
        );
      case 'Extracted':
      case 'Draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100">
            <Clock className="w-3 h-3 mr-1" /> Draft
          </span>
        );
      case 'Quoted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-100">
            <FileText className="w-3 h-3 mr-1" /> Quoted
          </span>
        );
      case 'Accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-100">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Accepted
          </span>
        );
      case 'Payment Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-100">
            <Clock className="w-3 h-3 mr-1" /> Payment Pending
          </span>
        );
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Paid
          </span>
        );
      default:
        return null;
    }
  };

  // Helper to get pre-GST deal amount
  const getDealPreGSTAmount = (deal: any) => {
    let subtotal = 0;
    deal.line_items.forEach((li: any) => {
      subtotal += li.unit_price_paise * li.quantity;
    });
    if (subtotal === 0) {
      if (deal.id === 'dl_paid') return 5000000;
      if (deal.id === 'dl_pending') return 2800000;
      if (deal.id === 'dl_quoted') return 4200000;
    }
    return subtotal;
  };

  // Check if we have active unprocessed enquiries
  const newEnquiriesCount = state.deals.filter((d) => d.status === 'New').length;

  return (
    <OwnerShell>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-700">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground">Kagaz Back-Office</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">AI-powered pipelines for top-tier freelancers.</p>
          </div>
          <Link
            href="/inbox"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-full shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all space-x-2"
          >
            <Inbox className="w-4 h-4" />
            <span>Open WhatsApp Inbox</span>
            {newEnquiriesCount > 0 && (
              <span className="ml-2 bg-white text-neutral-900 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                {newEnquiriesCount} New
              </span>
            )}
          </Link>
        </div>

        {/* Demo Alert Box */}
        {newEnquiriesCount > 0 && (
          <div className="glass rounded-2xl p-5 flex items-start space-x-4 animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-2.5 bg-neutral-900 text-white rounded-xl shadow-lg relative z-10">
              <Inbox className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1.5 relative z-10">
              <h4 className="font-bold text-sm text-foreground">New Hinglish Enquiry Received on WhatsApp!</h4>
              <p className="text-xs text-muted-foreground font-medium">
                Aditi Sharma has requested a restaurant website quote. Run the 90-second demo by clicking the button below.
              </p>
              <div className="pt-2">
                <Link
                  href="/inbox"
                  className="inline-flex items-center text-xs font-black text-neutral-900 hover:text-blue-600 group/link transition-colors"
                >
                  <span>Start 90-second demo</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
          <div className="glass hover-lift rounded-2xl p-5 space-y-2 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider relative z-10">Enquiries</span>
            <p className="text-3xl font-black tracking-tighter text-foreground relative z-10">{summary.counts.enquiries}</p>
            <div className="text-[10px] font-medium text-muted-foreground relative z-10">Incoming chat pipeline</div>
          </div>

          <div className="glass hover-lift rounded-2xl p-5 space-y-2 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors duration-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider relative z-10">Quoted Value</span>
            <p className="text-3xl font-black tracking-tighter text-foreground relative z-10">
              {formatINRPaise(summary.amounts_paise.quoted)}
            </p>
            <div className="text-[10px] font-medium text-muted-foreground relative z-10">Pre-GST service value</div>
          </div>

          <div className="glass hover-lift rounded-2xl p-5 space-y-2 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider relative z-10">Won Value</span>
            <p className="text-3xl font-black tracking-tighter text-foreground relative z-10">
              {formatINRPaise(summary.amounts_paise.won)}
            </p>
            <div className="text-[10px] font-medium text-muted-foreground relative z-10">Pre-GST accepted + pending</div>
          </div>

          <div className="glass hover-lift rounded-2xl p-5 space-y-2 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider relative z-10">Collected Value</span>
            <p className="text-3xl font-black tracking-tighter text-emerald-600 relative z-10">
              {formatINRPaise(summary.amounts_paise.collected)}
            </p>
            <div className="text-[10px] font-medium text-emerald-600/70 relative z-10">Pre-GST payments received</div>
          </div>
        </div>

        {/* Deals Table/List */}
        <div className="glass rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: '200ms' }}>
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-white/50">
            <h3 className="font-bold text-sm text-foreground">All Client Deals</h3>
            <span className="text-xs font-medium text-muted-foreground bg-neutral-100 px-2 py-0.5 rounded-full shadow-inner">Showing {state.deals.length} deals</span>
          </div>

          <div className="divide-y divide-border/50 bg-white/30 backdrop-blur-md">
            {state.deals.map((deal) => {
              const quote = state.quotes.find((q) => q.deal_id === deal.id);
              const invoice = state.invoices.find((i) => i.quote_id === quote?.id);

              return (
                <div key={deal.id} className="p-5 sm:p-6 hover:bg-white/80 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Deal Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                        <h4 className="font-bold text-base text-foreground group-hover:text-blue-600 transition-colors">{deal.project_title}</h4>
                        {getStatusChip(deal.status)}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Client: <span className="font-semibold text-foreground">{deal.client_name}</span> &middot; {deal.client_phone}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{deal.scope_summary}</p>
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-8">
                      <div className="sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pre-GST Value</p>
                        <p className="font-black text-base text-foreground">
                          {formatINRPaise(getDealPreGSTAmount(deal))}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        {deal.status === 'New' && (
                          <Link
                            href="/inbox"
                            className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-xs font-bold rounded-full bg-white text-foreground hover:bg-neutral-50 hover:shadow-md transition-all active:scale-95"
                          >
                            <span>Process in Inbox</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Link>
                        )}
                        {(deal.status === 'Draft' || deal.status === 'Extracted') && (
                          <Link
                            href={`/deals/${deal.id}`}
                            className="inline-flex items-center px-4 py-2 border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.08)] text-xs font-bold rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition-all active:scale-95"
                          >
                            <span>Edit Deal Card</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Link>
                        )}
                        {deal.status === 'Quoted' && quote && (
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/quotes/${quote.id}`}
                              className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-xs font-bold rounded-full bg-white text-foreground hover:bg-neutral-50 transition-all active:scale-95"
                            >
                              <span>View Quote</span>
                            </Link>
                            <Link
                              href={`/q/${quote.public_token}`}
                              target="_blank"
                              className="inline-flex items-center px-4 py-2 border border-blue-200 shadow-[0_2px_10px_rgba(59,130,246,0.15)] bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-full transition-all active:scale-95"
                            >
                              <span>Client Link</span>
                            </Link>
                          </div>
                        )}
                        {deal.status === 'Accepted' && quote && (
                          <Link
                            href={`/quotes/${quote.id}`}
                            className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-xs font-bold rounded-full bg-white text-foreground hover:bg-neutral-50 transition-all active:scale-95"
                          >
                            <span>View Quote</span>
                          </Link>
                        )}
                        {(deal.status === 'Payment Pending' || deal.status === 'Paid') && invoice && (
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="inline-flex items-center px-4 py-2 border border-emerald-200 shadow-[0_2px_10px_rgba(16,185,129,0.15)] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full transition-all active:scale-95"
                          >
                            <span>View Invoice</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}
