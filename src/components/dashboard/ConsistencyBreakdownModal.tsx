'use client';

import React from 'react';
import { X, Activity } from 'lucide-react';
import { ConsistencyScoreBreakdown } from '@/types/habit';

interface ConsistencyBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  consistency: ConsistencyScoreBreakdown;
}

export function ConsistencyBreakdownModal({
  isOpen,
  onClose,
  consistency,
}: ConsistencyBreakdownModalProps) {
  if (!isOpen) return null;

  const formattedScore = String(consistency.score).padStart(3, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
      <div className="w-full max-w-lg bg-white border-[3px] border-black p-6 shadow-[8px_8px_0px_0px_#09090b] space-y-6 font-mono text-xs">
        {/* Title Bar */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#ea580c]" />
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              CONSISTENCY INDEX DIAGNOSTIC // 0–100
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* High-Contrast Index Display */}
        <div className="border-2 border-black p-5 bg-zinc-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500">
              OVERALL SYSTEM INDEX
            </div>
            <div className="text-4xl font-black text-black tracking-tight mt-1">
              <span className="text-[#ea580c]">{formattedScore}</span>{' '}
              <span className="text-xl text-zinc-400">/ 100</span>
            </div>
          </div>
          <div className="text-right text-[11px] text-zinc-600 max-w-[200px] font-sans font-medium">
            Deterministic calculation from active Supabase habit history and execution telemetry.
          </div>
        </div>

        {/* Diagnostic Bars */}
        <div className="space-y-4">
          {/* 1. Target Completion */}
          <div className="border-2 border-black p-3 space-y-1.5 bg-white">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-black uppercase">TARGET COMPLETION RATE</span>
              <span className="text-black">{consistency.completionRateScore} / 40 PTS</span>
            </div>
            <div className="h-3 w-full bg-zinc-200 border border-black p-0.5">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${(consistency.completionRateScore / 40) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-600 font-sans">
              {consistency.completionRatePercent}% of logged sessions met or exceeded daily target numbers.
            </div>
          </div>

          {/* 2. 7-Day Consistency */}
          <div className="border-2 border-black p-3 space-y-1.5 bg-white">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-black uppercase">RECENT 7-DAY RHYTHM</span>
              <span className="text-black">{consistency.recent7DayScore} / 30 PTS</span>
            </div>
            <div className="h-3 w-full bg-zinc-200 border border-black p-0.5">
              <div
                className="h-full bg-[#ea580c] transition-all"
                style={{ width: `${(consistency.recent7DayScore / 30) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-600 font-sans">
              Evaluates steady execution without multi-day gaps over the last 7 calendar days.
            </div>
          </div>

          {/* 3. Streak Stability */}
          <div className="border-2 border-black p-3 space-y-1.5 bg-white">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-black uppercase">STREAK STABILITY</span>
              <span className="text-black">{consistency.streakStabilityScore} / 20 PTS</span>
            </div>
            <div className="h-3 w-full bg-zinc-200 border border-black p-0.5">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${(consistency.streakStabilityScore / 20) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-600 font-sans">
              Active consecutive streak momentum ({consistency.streakDays} days).
            </div>
          </div>

          {/* 4. Recovery Discipline */}
          <div className="border-2 border-black p-3 space-y-1.5 bg-white">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-black uppercase">RECOVERY DISCIPLINE</span>
              <span className="text-black">{consistency.recoveryDisciplineScore} / 10 PTS</span>
            </div>
            <div className="h-3 w-full bg-zinc-200 border border-black p-0.5">
              <div
                className="h-full bg-[#ea580c] transition-all"
                style={{ width: `${(consistency.recoveryDisciplineScore / 10) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-600 font-sans">
              Disciplined utilization of weekly protection tokens without excessive skips.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full btn-brutal-primary py-2.5 text-xs"
        >
          CLOSE DIAGNOSTIC
        </button>
      </div>
    </div>
  );
}
