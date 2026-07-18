'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FilePlus, CreditCard, Settings, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { useKagazStore, resetKagazStore, formatINRPaise, api } from '@/lib/store';
import { createClient } from '@/lib/supabase';

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useKagazStore();
  const summary = api.getDashboardSummary();
  const supabase = createClient();

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        setIsAuthChecking(false);
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Enquiry', href: '/inbox', icon: FilePlus },
    { name: 'Rate Card', href: '/settings/rate-card', icon: Settings },
  ];

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the demo data to its initial state?')) {
      resetKagazStore();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Floating Glass Header */}
      <div className="relative pt-4 z-40 px-4 mb-6 flex justify-center no-print w-full pointer-events-none">
        <header className="w-full max-w-5xl glass rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500">KĀRYO</span>
              <span className="text-muted-foreground text-[10px] font-semibold px-2 py-0.5 tracking-wide">
                Client onboarding manager
              </span>
            </Link>
          </div>

          {/* Quick Stats Summary */}
          <div className="hidden md:flex items-center space-x-8 text-sm">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Won (Pre-GST)</p>
              <p className="font-bold text-foreground">{formatINRPaise(summary.amounts_paise.won)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Collected</p>
              <p className="font-bold text-emerald-600">{formatINRPaise(summary.amounts_paise.collected)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={handleReset}
              title="Reset Demo Data"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-neutral-100 rounded-full transition-all hover:rotate-180 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-full transition-all flex items-center justify-center shadow-sm border border-transparent hover:border-rose-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-24 md:pb-6 flex flex-col">
        {children}
      </main>

      {/* Bottom Nav Bar (Mobile-friendly sticky footer on small screens, tab bar on large) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-2 py-2 md:hidden no-print shadow-xl">
        <div className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-muted-foreground hover:bg-neutral-100 hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
