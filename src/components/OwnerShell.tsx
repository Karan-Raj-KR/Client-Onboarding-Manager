'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Inbox, CreditCard, Settings, RefreshCw, LogOut, Loader2, FileText } from 'lucide-react';
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
    { name: 'Inbox', href: '/inbox', icon: Inbox },
    { name: 'Templates', href: '/settings/templates', icon: FileText },
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
        <header className="w-full max-w-6xl glass rounded-full px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity shrink-0">
              <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500">Kagaz</span>
              <span className="hidden sm:inline bg-neutral-100 text-neutral-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-neutral-200 shadow-sm">
                {state.business.brand_name}
              </span>
            </Link>

            {/* Main Navigation (Top) */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    className={`flex items-center justify-center px-3 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-neutral-100 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden md:inline text-xs font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Stats Summary */}
            <div className="hidden lg:flex items-center space-x-6 text-sm mr-4 border-r border-border/60 pr-6">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Won</p>
                <p className="font-bold text-foreground">{formatINRPaise(summary.amounts_paise.won)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Collected</p>
                <p className="font-bold text-emerald-600">{formatINRPaise(summary.amounts_paise.collected)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
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
                className="p-2 text-rose-500 hover:text-white hover:bg-rose-50 hover:border-rose-200 rounded-full transition-all flex items-center justify-center shadow-sm border border-transparent"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-12 flex flex-col">
        {children}
      </main>
    </div>
  );
}
