'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, FileText, Upload, Loader2, MessageSquare, AlignLeft } from 'lucide-react';
import { useKagazStore, processNewEnquiry } from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function InboxPage() {
  const router = useRouter();
  const state = useKagazStore();
  
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState('Raw text');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractionLogs = [
    'Detecting enquiry context...',
    'Analyzing requirements and scope...',
    'Matching to KĀRYO Rate Card...',
    'Estimating budget bounds...',
    'Structuring deal schema...',
    'Calculating confidence score...',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setRawText(text);
      }
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setRawText("bhai ek naya restaurant khol rahe hain hum 'Spice Route' naam se koramangala me. Hame ek badhiya website chahiye jisme online ordering bhi ho, whatsapp integration ke saath. Budget around 30k se 40k max hai. Kitne din lagenge banne me? jaldi start karna hai");
    setSourceType('WhatsApp chat');
  };

  const handleAIProcess = async () => {
    if (!rawText.trim()) return;

    setIsExtracting(true);
    setExtractionStep(0);

    const stepInterval = setInterval(() => {
      setExtractionStep((prev) => (prev + 1) % extractionLogs.length);
    }, 1500);

    const dealId = await processNewEnquiry(rawText, sourceType);

    clearInterval(stepInterval);
    router.push(`/deals/${dealId}`);
  };

  if (!state.isLoaded) {
    return (
      <OwnerShell>
        <div className="flex-1 flex flex-col items-center justify-center bg-background rounded-xl min-h-[600px] shadow-2xl border border-border/60 mb-8">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      </OwnerShell>
    );
  }

  const sources = [
    { id: 'Raw text', icon: AlignLeft },
    { id: 'Call/Meet transcript', icon: FileText },
    { id: 'WhatsApp chat', icon: MessageSquare },
  ];

  return (
    <OwnerShell>
      <div className="flex-1 flex flex-col bg-background rounded-xl overflow-hidden min-h-[600px] shadow-2xl border border-border/60 animate-in slide-in-from-bottom-8 duration-700 mb-8 p-6 md:p-10 relative">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-black tracking-tighter text-foreground">New Enquiry</h1>
            <p className="text-sm font-medium text-muted-foreground">Drop in a client request from any source and let KĀRYO AI analyze it.</p>
          </div>

          <div className="space-y-6 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-border/60 shadow-sm">
            
            {/* Source Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Source Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sources.map((src) => {
                  const Icon = src.icon;
                  const isActive = sourceType === src.id;
                  return (
                    <button
                      key={src.id}
                      onClick={() => setSourceType(src.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        isActive 
                          ? 'bg-neutral-900 border-neutral-900 text-white shadow-md' 
                          : 'bg-white border-border/80 text-muted-foreground hover:border-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2" />
                      <span className="text-[10px] font-bold text-center leading-tight">{src.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-3 relative">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client Enquiry</label>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={loadSample}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                  >
                    Load Sample Enquiry
                  </button>
                  <span className="text-muted-foreground/30">•</span>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider group"
                  >
                    <Upload className="w-3 h-3 mr-1 group-hover:-translate-y-0.5 transition-transform" />
                    Upload .txt
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept=".txt,.md" 
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                </div>
              </div>
              
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste raw typing, voice-typed text, a Call/Meet transcript, or a WhatsApp chat export..."
                className="w-full h-48 p-4 bg-white border border-border/80 rounded-2xl resize-none outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all text-sm shadow-inner"
              />
            </div>

            {/* Process Button */}
            <button
              onClick={handleAIProcess}
              disabled={isExtracting || !rawText.trim()}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:hover:shadow-none"
            >
              <Sparkles className="w-5 h-5" />
              <span>Process with KĀRYO AI</span>
            </button>
          </div>
        </div>

        {/* Extraction Progress Overlay Modal */}
        {isExtracting && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-laser z-20 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              
              <div className="flex items-center space-x-4 relative z-10">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
                <h3 className="font-black text-lg tracking-tight text-white">KĀRYO AI Engine</h3>
              </div>
              
              <div className="flex flex-col items-center justify-center h-48 space-y-6 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <div className="h-6 flex items-center justify-center overflow-hidden">
                  <p 
                    key={extractionStep} 
                    className="font-mono text-xs text-blue-400 animate-in slide-in-from-bottom-4 fade-in duration-300"
                  >
                    &gt; {extractionLogs[extractionStep]}
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-wider relative z-10">
                Converting payload to deal schema...
              </p>
            </div>
          </div>
        )}
      </div>
    </OwnerShell>
  );
}


