'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Play, Pause, ChevronLeft, Send, CheckCheck, Loader2 } from 'lucide-react';
import { useKagazStore, extractDealWithAI } from '@/lib/store';
import OwnerShell from '@/components/OwnerShell';

export default function InboxPage() {
  const router = useRouter();
  const state = useKagazStore();
  
  // Navigation / UI State
  const [activeChat, setActiveChat] = useState<'demo' | 'paid' | 'pending' | 'quoted'>('demo');
  const [showMobileList, setShowMobileList] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState(0);

  // Voice Note Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated AI logs during extraction
  const extractionLogs = [
    'Detecting enquiry language (Hinglish)...',
    'Analyzing requirements: [Website, Online Ordering Setup]...',
    'Matching to KĀRYO Rate Card...',
    'Estimating budget bounds: ₹30,000 - ₹40,000...',
    'Resolving recommended price: ₹35,000 (Confidence: 94%)...',
    'Saving Draft Deal dl_demo...',
  ];

  // Handle Play/Pause of voice note
  const togglePlay = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setPlayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timerRef.current!);
            setIsPlaying(false);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle AI Extraction cascade
  const handleAIProcess = () => {
    setIsExtracting(true);
    setExtractionStep(0);

    // Increment extraction log steps
    const stepInterval = setInterval(() => {
      setExtractionStep((prev) => {
        if (prev >= extractionLogs.length - 1) {
          clearInterval(stepInterval);
          // Apply state change in database
          extractDealWithAI('dl_demo');
          // Redirect to deal page
          setTimeout(() => {
            router.push('/deals/dl_demo');
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
  };

  // Chats list data
  const chats = [
    {
      id: 'demo',
      name: 'Aditi Sharma',
      sub: 'bhai restaurant ke liye website chahiye...',
      time: '15:00',
      unread: true,
      avatar: 'AS',
      avatarBg: 'bg-emerald-600',
    },
    {
      id: 'quoted',
      name: 'Dr. Ananya Rao',
      sub: 'Quote Q-2026-0100 sent',
      time: '10-Jul',
      unread: false,
      avatar: 'AR',
      avatarBg: 'bg-purple-600',
    },
    {
      id: 'pending',
      name: 'Rajesh Kumar',
      sub: 'Invoice INV-2026-0099 pending',
      time: '02-Jul',
      unread: false,
      avatar: 'RK',
      avatarBg: 'bg-amber-600',
    },
    {
      id: 'paid',
      name: 'Aaranya Sharma',
      sub: 'Payment ₹59,000 received',
      time: '16-Jun',
      unread: false,
      avatar: 'AS',
      avatarBg: 'bg-blue-600',
    },
  ];

  return (
    <OwnerShell>
      <div className="flex-1 flex glass rounded-3xl overflow-hidden min-h-[600px] shadow-sm animate-in slide-in-from-bottom-8 duration-700 mb-8">
        
        {/* Left Side: Chats List */}
        <div className={`w-full md:w-80 border-r border-border/50 bg-white/40 flex flex-col ${
          showMobileList ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="p-5 border-b border-border/50 bg-white/50 backdrop-blur-md flex justify-between items-center">
            <h2 className="font-bold text-lg text-foreground tracking-tight">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat.id as any);
                  setShowMobileList(false);
                }}
                className={`w-full p-4 text-left transition-all flex items-start space-x-4 border-b border-border/30 ${
                  activeChat === chat.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner ${chat.avatarBg}`}>
                  {chat.avatar}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-sm text-foreground truncate">{chat.name}</h4>
                    <span className="text-[10px] font-medium text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-medium">{chat.sub}</p>
                </div>
                {chat.unread && (
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-3 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Chat Conversation Pane */}
        <div className={`flex-1 flex flex-col bg-neutral-50/50 relative ${
          showMobileList ? 'hidden' : 'flex'
        }`}>
          
          {/* Chat Header */}
          <div className="p-4 border-b border-border/50 bg-white/60 backdrop-blur-md flex items-center space-x-3 z-10">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden p-2 hover:bg-neutral-100 rounded-full text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ${
              activeChat === 'demo' ? 'bg-emerald-600' :
              activeChat === 'quoted' ? 'bg-purple-600' :
              activeChat === 'pending' ? 'bg-amber-600' : 'bg-blue-600'
            }`}>
              {activeChat === 'demo' ? 'AS' :
               activeChat === 'quoted' ? 'AR' :
               activeChat === 'pending' ? 'RK' : 'AS'}
            </div>
            
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {activeChat === 'demo' ? 'Aditi Sharma (Aditi\'s Kitchen)' :
                 activeChat === 'quoted' ? 'Dr. Ananya Rao' :
                 activeChat === 'pending' ? 'Rajesh Kumar' : 'Aaranya Sharma'}
              </h3>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">online</p>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col justify-end bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[size:350px] opacity-90">
            
            {activeChat !== 'demo' ? (
              <div className="mx-auto glass rounded-full px-6 py-2 text-[11px] font-bold text-muted-foreground text-center max-w-xs shadow-sm">
                This historical chat has been resolved.
              </div>
            ) : (
              <>
                {/* Voice Note Message */}
                <div className="self-start max-w-[85%] bg-white rounded-2xl rounded-tl-sm p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-border/50 space-y-3">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-all shrink-0 hover:scale-105 active:scale-95"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-blue-600" /> : <Play className="w-5 h-5 fill-blue-600 ml-0.5" />}
                    </button>
                    
                    {/* Simulated Voice note waveform */}
                    <div className="w-48 h-8 flex items-center space-x-0.5">
                      {Array.from({ length: 35 }).map((_, i) => {
                        const heights = [2, 4, 3, 5, 8, 4, 3, 6, 9, 12, 14, 10, 4, 3, 7, 5, 4, 8, 10, 6, 3, 5, 8, 10, 12, 8, 4, 2, 5, 7, 3, 4, 2, 2, 1];
                        const progressBoundary = playProgress / (100 / 35);
                        const isPlayed = i < progressBoundary;
                        return (
                          <span
                            key={i}
                            className={`w-[3px] rounded-full transition-colors duration-200 ${
                              isPlayed ? 'bg-blue-600' : 'bg-neutral-200'
                            }`}
                            style={{ height: `${heights[i] * 2.2}px` }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground self-end shrink-0 mb-1">
                      {isPlaying ? `0:${String(Math.floor(playProgress * 0.14)).padStart(2, '0')}` : '0:14'}
                    </span>
                  </div>
                  
                  {/* Transcript Toggle & View */}
                  <div className="border-t border-dashed border-border/60 pt-3">
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                    >
                      {showTranscript ? 'Hide Cached Transcript' : 'Show Cached Transcript'}
                    </button>
                    
                    {showTranscript && (
                      <p className="text-sm font-medium text-foreground mt-2 bg-neutral-50 p-3 rounded-xl border border-border/50 leading-relaxed">
                        “bhai restaurant ke liye website chahiye, online ordering bhi, budget 30-40k, kitne din?”
                      </p>
                    )}
                  </div>
                </div>

                {/* Text Message */}
                <div className="self-start max-w-[80%] bg-white rounded-2xl rounded-tl-sm p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-border/50">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    bhai restaurant ke liye website chahiye, online ordering bhi, budget 30-40k, kitne din?
                  </p>
                  <span className="block text-right text-[10px] font-bold text-muted-foreground mt-2">15:00</span>
                </div>

                {/* AI Action Box in Stream */}
                <div className="mx-auto w-full max-w-sm glass border border-white/40 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 my-6 hover-lift">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-foreground">Kagaz AI</h4>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Unstructured Hinglish enquiry detected. We can map this client to your rate card, create a budget estimate, and draft a deal card in 1 tap.
                  </p>
                  <button
                    onClick={handleAIProcess}
                    disabled={isExtracting}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] relative overflow-hidden animate-shimmer bg-[length:200%_auto] disabled:opacity-50 disabled:animate-none"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Process with Kagaz AI</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Dummy WhatsApp Input */}
          <div className="p-4 bg-white/60 backdrop-blur-md border-t border-border/50 flex items-center space-x-3 z-10">
            <input
              type="text"
              disabled
              placeholder="Use 'Process with Kagaz AI' to extract deal..."
              className="flex-1 bg-white border border-border/80 shadow-inner rounded-full px-5 py-2.5 text-xs text-muted-foreground cursor-not-allowed font-medium"
            />
            <button disabled className="p-2.5 bg-neutral-100 rounded-full text-muted-foreground">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Extraction Progress Overlay Modal (Dark Glassmorphic) */}
        {isExtracting && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl relative overflow-hidden">
              {/* Laser Scanning Line */}
              <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-laser z-20 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              
              <div className="flex items-center space-x-4 relative z-10">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
                <h3 className="font-black text-lg tracking-tight text-white">Kagaz AI Engine</h3>
              </div>
              
              <div className="bg-black/50 border border-neutral-800/80 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[11px] text-blue-400 space-y-2.5 relative z-10 shadow-inner scroll-smooth no-scrollbar">
                {extractionLogs.slice(0, extractionStep + 1).map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <span className="text-purple-500 font-bold">&gt;</span>
                    <span className="font-medium tracking-tight leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-wider relative z-10">
                Converting Hinglish payload to deal schema...
              </p>
            </div>
          </div>
        )}

      </div>
    </OwnerShell>
  );
}
