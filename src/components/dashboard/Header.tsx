'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Flame, Shield, HelpCircle, Activity } from 'lucide-react';
import { ConsistencyScoreBreakdown } from '@/types/habit';

interface HeaderProps {
  displayName: string;
  consistency: ConsistencyScoreBreakdown;
  recoveryTokensAvailable: number;
  onOpenScoreModal: () => void;
}

export function Header({
  displayName,
  consistency,
  recoveryTokensAvailable,
  onOpenScoreModal,
}: HeaderProps) {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b border-slate-800/80 pb-6 mb-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            {getGreeting()}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{displayName || 'Habit Builder'}</span>
            <span className="text-2xl">👋</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Recovery Token Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Shield className={`h-4 w-4 ${recoveryTokensAvailable > 0 ? 'text-cyan-400' : 'text-slate-600'}`} />
            <span className="text-slate-400">Weekly Recovery:</span>
            <span
              className={`font-semibold ${
                recoveryTokensAvailable > 0 ? 'text-cyan-300' : 'text-slate-500'
              }`}
            >
              {recoveryTokensAvailable > 0 ? '1 Token Ready' : 'Used this week'}
            </span>
          </div>

          {/* Consistency Score Badge */}
          <button
            onClick={onOpenScoreModal}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-500/60 text-xs transition-all group"
            title="Click to view score breakdown"
          >
            <Activity className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-slate-300">Consistency:</span>
            <span className="font-bold text-indigo-300 text-sm">{consistency.score}/100</span>
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400/70" />
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
