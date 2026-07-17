'use client';

import React, { useState } from 'react';
import { Save, HelpCircle } from 'lucide-react';
import { useKagazStore, saveKagazState, formatINRPaise, rupeeToPaise, paiseToRupee } from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function RateCardSettings() {
  const state = useKagazStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sacCode, setSacCode] = useState('');
  const [priceRupees, setPriceRupees] = useState(0);

  // Trigger edit mode
  const startEditing = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description);
    setSacCode(item.sac_code);
    setPriceRupees(paiseToRupee(item.unit_price_paise));
  };

  // Save updates to state
  const handleSave = () => {
    if (!editingId) return;

    const updatedRateCard = state.rateCard.map((item) =>
      item.id === editingId
        ? {
            ...item,
            name,
            description,
            sac_code: sacCode,
            unit_price_paise: rupeeToPaise(priceRupees),
          }
        : item
    );

    saveKagazState({
      ...state,
      rateCard: updatedRateCard,
    });

    setEditingId(null);
  };

  return (
    <OwnerShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1C1B19]">Rate Card Settings</h1>
          <p className="text-xs text-[#6F6D6A]">Manage your standard services, SAC codes, and pricing template defaults.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {state.rateCard.map((item) => (
              <div key={item.id} className="bg-white border border-[#E6DFD5] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[#1C1B19]">{item.name}</h3>
                    <div className="flex items-center space-x-2 text-[10px] text-[#6F6D6A] font-semibold">
                      <span className="bg-[#F3ECE3] px-2 py-0.5 rounded text-[#C85A17]">SAC: {item.sac_code}</span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded">
                        GST: {item.tax_rate_bps / 100}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#C85A17]">{formatINRPaise(item.unit_price_paise)}</p>
                    <button
                      onClick={() => startEditing(item)}
                      className="text-xs font-bold text-[#C85A17] hover:underline mt-1 block"
                    >
                      Edit Rate
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#6F6D6A] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Edit Panel (1/3 width) */}
          <div className="space-y-4">
            {editingId ? (
              <div className="bg-white border border-[#C85A17] rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-sm text-[#C85A17] border-b border-[#E6DFD5] pb-2">Edit Service Details</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#6F6D6A]">Service Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg px-3 py-2 text-sm text-[#1C1B19]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#6F6D6A]">SAC Code</label>
                    <input
                      type="text"
                      value={sacCode}
                      onChange={(e) => setSacCode(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg px-3 py-2 text-sm text-[#1C1B19]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#6F6D6A]">Base Price (₹)</label>
                    <input
                      type="number"
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(Number(e.target.value))}
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg px-3 py-2 text-sm text-[#1C1B19]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#6F6D6A]">Service Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD5] rounded-lg px-3 py-2 text-sm text-[#1C1B19] leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#C85A17] hover:bg-[#A94A10] text-[#FAF8F5] text-xs font-bold rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Rate</span>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 inline-flex items-center justify-center py-2 px-3 border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] text-[#1C1B19] text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-xl p-5 space-y-3">
                <HelpCircle className="w-6 h-6 text-[#C85A17]" />
                <h3 className="font-bold text-sm text-[#1C1B19]">How Rate Card works</h3>
                <p className="text-xs text-[#6F6D6A] leading-relaxed">
                  These rates serve as template pre-fills during the deal generation workflow. 
                  Modifying rates here does not impact previously issued quotes, as all historical quotations store an immutable snapshot of their items to maintain document consistency.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}
