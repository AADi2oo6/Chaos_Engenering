'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Activity, Shield, Terminal } from 'lucide-react';
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const formattedScore = String(consistency.score).padStart(3, '0');

  return (
    <header className="border-b-[3px] border-black pb-5 mb-8 space-y-4">
      {/* Top Navbar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand Logo & System ID */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black text-white flex items-center justify-center font-mono font-black text-lg border-2 border-black shadow-[2px_2px_0px_0px_#ea580c]">
            ◈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base tracking-tight uppercase">
                CHAOS // HABIT SYSTEM
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 border border-black text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 bg-[#16a34a] inline-block animate-pulse" />
                SYSTEM ONLINE
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-600 uppercase font-semibold">
              OPERATOR: <span className="text-black font-black">{displayName || 'HABIT_BUILDER'}</span>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap font-mono">
          {/* Recovery Token Resource */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#09090b] text-xs">
            <span
              className={`w-2 h-2 ${
                recoveryTokensAvailable > 0 ? 'bg-[#ea580c]' : 'bg-zinc-400'
              }`}
            />
            <span className="text-zinc-600 font-bold uppercase">RECOVERY:</span>
            <span className="font-black text-black">
              {recoveryTokensAvailable > 0 ? '01 READY' : '00 USED'}
            </span>
          </div>

          {/* Consistency Index Trigger */}
          <button
            onClick={onOpenScoreModal}
            className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#09090b] hover:bg-[#ea580c] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] text-xs transition-all cursor-pointer group"
            title="Inspect Consistency Index breakdown"
          >
            <Activity className="h-3.5 w-3.5 text-black" />
            <span className="font-bold uppercase text-zinc-700 group-hover:text-black">INDEX:</span>
            <span className="font-black text-[#ea580c] group-hover:text-black text-sm">
              {formattedScore} / 100
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn-brutal-secondary py-1.5 px-3 text-xs"
            title="Disconnect session"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">DISCONNECT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
