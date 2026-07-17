'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, FileText, Plus, Trash2, ArrowLeft, Percent, HelpCircle, ShieldCheck } from 'lucide-react';
import {
  useKagazStore,
  updateDeal,
  generateQuote,
  formatINRPaise,
  paiseToRupee,
  rupeeToPaise,
} from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function EditDealCard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const state = useKagazStore();
  const deal = state.deals.find((d) => d.id === id);

  // Form state
  const [projectTitle, setProjectTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [scopeSummary, setScopeSummary] = useState('');
  const [timelineDays, setTimelineDays] = useState(14);
  const [budgetMin, setBudgetMin] = useState(30000);
  const [budgetMax, setBudgetMax] = useState(40000);
  
  // Line items state
  const [dealItems, setDealItems] = useState<{
    id: string;
    rate_card_item_id: string;
    description: string;
    quantity: number;
    unitPriceRupees: number;
    taxRateBps: number;
  }[]>([]);

  // Quote properties
  const [validUntil, setValidUntil] = useState('');
  const [notesToClient, setNotesToClient] = useState('50% advance to initiate work. Delivery in 14 days.');

  // Load deal details on mount or state change
  useEffect(() => {
    if (deal) {
      setProjectTitle(deal.project_title);
      setClientName(deal.client_name);
      setClientPhone(deal.client_phone);
      setScopeSummary(deal.scope_summary);
      setTimelineDays(deal.timeline_days);
      setBudgetMin(paiseToRupee(deal.budget_min_paise));
      setBudgetMax(paiseToRupee(deal.budget_max_paise));
      
      // Load or default line items
      if (deal.line_items.length > 0) {
        setDealItems(
          deal.line_items.map((item) => ({
            id: item.id,
            rate_card_item_id: item.rate_card_item_id,
            description: item.description,
            quantity: item.quantity,
            unitPriceRupees: paiseToRupee(item.unit_price_paise),
            taxRateBps: item.tax_rate_bps,
          }))
        );
      } else {
        // Pre-populate with the Restaurant Website rate item if this is the demo deal
        if (deal.id === 'dl_demo') {
          const webItem = state.rateCard.find((r) => r.id === 'rc_web');
          if (webItem) {
            setDealItems([
              {
                id: `li_${Math.random().toString(36).substring(2, 9)}`,
                rate_card_item_id: webItem.id,
                description: webItem.name,
                quantity: 1,
                unitPriceRupees: paiseToRupee(webItem.unit_price_paise),
                taxRateBps: webItem.tax_rate_bps,
              },
            ]);
          }
        }
      }

      // Default quote validity to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setValidUntil(defaultDate.toISOString().split('T')[0]);
    }
  }, [deal, state.rateCard]);

  if (!deal) {
    return (
      <OwnerShell>
        <div className="p-10 text-center glass rounded-3xl animate-in fade-in max-w-md mx-auto mt-20">
          <h2 className="text-2xl font-black text-rose-600 tracking-tight">Deal Not Found</h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">The requested deal card does not exist.</p>
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

  // Calculate live totals (in Rupees)
  const calculateTotals = () => {
    let subtotal = 0;
    let gst = 0;
    
    dealItems.forEach((item) => {
      const itemSubtotal = item.unitPriceRupees * item.quantity;
      const itemGst = (itemSubtotal * item.taxRateBps) / 10000;
      subtotal += itemSubtotal;
      gst += itemGst;
    });

    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const { subtotal, gst, total } = calculateTotals();

  // Add line item from rate card
  const addRateCardItem = (rateItemId: string) => {
    const rateItem = state.rateCard.find((r) => r.id === rateItemId);
    if (!rateItem) return;

    setDealItems([
      ...dealItems,
      {
        id: `li_${Math.random().toString(36).substring(2, 9)}`,
        rate_card_item_id: rateItem.id,
        description: rateItem.name,
        quantity: 1,
        unitPriceRupees: paiseToRupee(rateItem.unit_price_paise),
        taxRateBps: rateItem.tax_rate_bps,
      },
    ]);
  };

  // Add custom custom line item
  const addCustomItem = () => {
    setDealItems([
      ...dealItems,
      {
        id: `li_${Math.random().toString(36).substring(2, 9)}`,
        rate_card_item_id: 'custom',
        description: 'Custom Service Line Item',
        quantity: 1,
        unitPriceRupees: 5000,
        taxRateBps: 1800, // 18% standard GST
      },
    ]);
  };

  // Update line item details
  const updateLineItem = (index: number, updates: any) => {
    const newItems = [...dealItems];
    newItems[index] = { ...newItems[index], ...updates };
    setDealItems(newItems);
  };

  // Delete line item
  const removeLineItem = (index: number) => {
    const newItems = dealItems.filter((_, i) => i !== index);
    setDealItems(newItems);
  };

  // Save deal as draft in store
  const handleSaveDraft = () => {
    updateDeal(deal.id, {
      project_title: projectTitle,
      client_name: clientName,
      client_phone: clientPhone,
      scope_summary: scopeSummary,
      timeline_days: timelineDays,
      budget_min_paise: rupeeToPaise(budgetMin),
      budget_max_paise: rupeeToPaise(budgetMax),
      line_items: dealItems.map((item) => ({
        id: item.id,
        rate_card_item_id: item.rate_card_item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price_paise: rupeeToPaise(item.unitPriceRupees),
        tax_rate_bps: item.taxRateBps,
      })),
      status: 'Draft',
    });
    router.push('/');
  };

  // Generate Quotation
  const handleGenerateQuote = () => {
    // 1. Update deal first
    updateDeal(deal.id, {
      project_title: projectTitle,
      client_name: clientName,
      client_phone: clientPhone,
      scope_summary: scopeSummary,
      timeline_days: timelineDays,
      budget_min_paise: rupeeToPaise(budgetMin),
      budget_max_paise: rupeeToPaise(budgetMax),
      line_items: dealItems.map((item) => ({
        id: item.id,
        rate_card_item_id: item.rate_card_item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price_paise: rupeeToPaise(item.unitPriceRupees),
        tax_rate_bps: item.taxRateBps,
      })),
    });

    // 2. Generate Quote
    const quote = generateQuote(deal.id, validUntil, notesToClient);
    if (quote) {
      router.push(`/quotes/${quote.id}`);
    }
  };

  return (
    <OwnerShell>
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 fade-in pb-12">
        {/* Top bar */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 border border-border bg-white rounded-full hover:bg-neutral-50 text-muted-foreground transition-all hover:-translate-x-1 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground">Review AI Extraction</h1>
            <p className="text-xs font-medium text-muted-foreground">Review and customize details before generating quote.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Deal Form Cards (2/3 width) */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Form details card */}
            <div className="glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-bold text-base text-foreground border-b border-border/50 pb-3 flex items-center justify-between">
                <span>1. Project & Client Metadata</span>
                <span className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                  {deal.confidence_bps / 100}% AI Confidence
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Title</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client Phone</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Timeline (Days)</label>
                  <input
                    type="number"
                    value={timelineDays}
                    onChange={(e) => setTimelineDays(Number(e.target.value))}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Extracted Budget Min (₹)</label>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Extracted Budget Max (₹)</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scope Summary</label>
                <textarea
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium text-foreground leading-relaxed shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-shadow resize-none"
                />
              </div>

              {/* Missing Info list */}
              {deal.missing_information.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 space-y-2">
                  <h5 className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center">
                    <HelpCircle className="w-4 h-4 mr-1.5" />
                    Recommended items to ask client
                  </h5>
                  <ul className="list-disc pl-5 text-sm font-medium text-amber-800 space-y-1">
                    {deal.missing_information.map((info, idx) => (
                      <li key={idx}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pricing / Line Items selection */}
            <div className="glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="border-b border-border/50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-bold text-base text-foreground">2. Quote Line Items</h3>
                
                {/* Quick Add from Rate Card */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addRateCardItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-neutral-50 border border-border rounded-full px-4 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  >
                    <option value="">+ Add rate card item</option>
                    {state.rateCard.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatINRPaise(item.unit_price_paise)})
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={addCustomItem}
                    className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-xs font-bold bg-white text-foreground rounded-full hover:bg-neutral-50 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Custom Line
                  </button>
                </div>
              </div>

              {dealItems.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-border/60 rounded-2xl text-sm font-medium text-muted-foreground bg-white/30">
                  No line items added yet. Choose from the rate card or add a custom item above.
                </div>
              ) : (
                <div className="space-y-4">
                  {dealItems.map((item, idx) => (
                    <div key={item.id} className="p-4 sm:p-5 bg-white border border-border/50 shadow-[0_2px_15px_rgba(0,0,0,0.02)] rounded-2xl space-y-4 relative group transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                      <button
                        onClick={() => removeLineItem(idx)}
                        className="absolute top-3 right-3 p-2 bg-neutral-50 hover:bg-rose-100 text-muted-foreground hover:text-rose-600 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pr-10">
                        {/* Description */}
                        <div className="sm:col-span-6 space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(idx, { description: e.target.value })}
                            className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                          />
                        </div>

                        {/* Qty */}
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(idx, { quantity: Number(e.target.value) })}
                            className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="sm:col-span-4 space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Unit Price (₹)</label>
                          <input
                            type="number"
                            value={item.unitPriceRupees}
                            onChange={(e) => updateLineItem(idx, { unitPriceRupees: Number(e.target.value) })}
                            className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-dashed border-border/50">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-2 py-0.5">
                            GST {item.taxRateBps / 100}%
                          </span>
                          <span className="font-semibold text-muted-foreground">SAC {state.rateCard.find((r) => r.id === item.rate_card_item_id)?.sac_code || '998319'}</span>
                        </div>
                        <div className="font-bold text-foreground">
                          Pre-GST: {formatINRPaise(rupeeToPaise(item.unitPriceRupees * item.quantity))} &middot; Total: <span className="text-blue-600">{formatINRPaise(rupeeToPaise(item.unitPriceRupees * item.quantity * (1 + item.taxRateBps / 10000)))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar calculations & CTAs (1/3 width) */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Live math card */}
            <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:sticky lg:top-28">
              <h3 className="font-bold text-base text-foreground border-b border-border/50 pb-3">Live Calculation</h3>
              
              <div className="space-y-3.5 text-sm font-medium">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal <span className="text-[10px] uppercase tracking-wider">(Pre-GST)</span></span>
                  <span className="font-bold text-foreground">{formatINRPaise(rupeeToPaise(subtotal))}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>GST <span className="text-[10px] uppercase tracking-wider">(18%)</span></span>
                  <span className="font-bold text-foreground">{formatINRPaise(rupeeToPaise(gst))}</span>
                </div>
                <div className="border-t border-border/60 pt-4 flex justify-between items-center text-lg font-black text-foreground">
                  <span>Total</span>
                  <span className="text-blue-600">{formatINRPaise(rupeeToPaise(total))}</span>
                </div>
              </div>

              {/* Note on pre-GST accounting */}
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4 text-[11px] text-blue-900 leading-relaxed flex items-start space-x-2">
                <span className="text-blue-600 font-bold mt-0.5">ℹ</span>
                <span>
                  <strong>Pipeline Rule:</strong> Only the pre-GST subtotal (<strong>{formatINRPaise(rupeeToPaise(subtotal))}</strong>) will count towards your Won and Collected value on the dashboard.
                </span>
              </div>
            </div>

            {/* Quotation parameters card */}
            <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-bold text-base text-foreground border-b border-border/50 pb-3">Quotation Settings</h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quote Validity Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Terms & Notes (to client)</label>
                  <textarea
                    value={notesToClient}
                    onChange={(e) => setNotesToClient(e.target.value)}
                    rows={4}
                    className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium text-foreground leading-relaxed shadow-inner focus:outline-none focus:ring-2 focus:ring-neutral-900/10 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="space-y-3">
              <button
                onClick={handleGenerateQuote}
                disabled={dealItems.length === 0}
                className="w-full inline-flex items-center justify-center space-x-2 py-4 px-6 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-bold rounded-2xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:scale-95"
              >
                <FileText className="w-5 h-5" />
                <span>Generate Branded Quote</span>
              </button>

              <button
                onClick={handleSaveDraft}
                className="w-full inline-flex items-center justify-center space-x-2 py-4 px-6 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <Save className="w-5 h-5" />
                <span>Save Draft Deal</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </OwnerShell>
  );
}
