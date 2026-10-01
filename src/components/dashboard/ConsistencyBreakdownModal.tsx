'use client';

import React from 'react';
import { X, Activity, CheckCircle, Flame, Shield, HelpCircle } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Consistency Score</h2>
              <p className="text-xs text-slate-400">Deterministic & explainable evaluation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Big Score Display */}
        <div className="text-center py-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight">
            {consistency.score} <span className="text-2xl text-slate-500 font-normal">/ 100</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Calculated directly from your verified Supabase habit history and recent consistency.
          </p>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-3.5">
          {/* 1. Target Completion Rate */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Target Completion Rate</span>
              </div>
              <span className="font-bold text-emerald-400">
                {consistency.completionRateScore} / 40 pts
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(consistency.completionRateScore / 40) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {consistency.completionRatePercent}% of your tracked entries met or exceeded your daily target.
            </p>
          </div>

          {/* 2. Recent 7-Day Consistency */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
                <span>Recent 7-Day Rhythm</span>
              </div>
              <span className="font-bold text-indigo-400">
                {consistency.recent7DayScore} / 30 pts
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${(consistency.recent7DayScore / 30) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluates steady activity across the past 7 calendar days.
            </p>
          </div>

          {/* 3. Streak Stability */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Streak Momentum</span>
              </div>
              <span className="font-bold text-amber-400">
                {consistency.streakStabilityScore} / 20 pts
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(consistency.streakStabilityScore / 20) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Current active streak across your habits ({consistency.streakDays} days).
            </p>
          </div>

          {/* 4. Recovery Discipline */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                <span>Recovery Discipline</span>
              </div>
              <span className="font-bold text-cyan-400">
                {consistency.recoveryDisciplineScore} / 10 pts
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${(consistency.recoveryDisciplineScore / 10) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Rewards sustaining momentum while keeping skips minimal.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
