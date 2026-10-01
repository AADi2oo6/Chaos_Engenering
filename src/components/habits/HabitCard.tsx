'use client';

import React, { useState } from 'react';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Habit, HabitLog, DayStatus } from '@/types/habit';

interface HabitCardProps {
  habit: Habit & {
    todayLog?: HabitLog | null;
    currentStreak: number;
    bestStreak: number;
    sevenDays: DayStatus[];
    completionRate: number;
  };
  recoveryTokensAvailable: number;
  onLog: (habitId: string, actualValue: number) => Promise<void>;
  onRecover: (habitId: string, date: string) => Promise<void>;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

export function HabitCard({
  habit,
  recoveryTokensAvailable,
  onLog,
  onRecover,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [actualInput, setActualInput] = useState<string>(
    habit.todayLog ? String(habit.todayLog.actual_value) : ''
  );
  const [logging, setLogging] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const targetValue = Number(habit.target_value);
  const currentActual = habit.todayLog ? Number(habit.todayLog.actual_value) : 0;
  const isCompleted = habit.todayLog?.status === 'completed';
  const isPartial = habit.todayLog?.status === 'partial';
  const progressPercent = Math.min(100, Math.round((currentActual / targetValue) * 100));

  // Check if yesterday is eligible for recovery (i.e. was missed and not yet recovered)
  const yesterdayStatus = habit.sevenDays.length >= 2 ? habit.sevenDays[habit.sevenDays.length - 2] : null;
  const canProtectStreak =
    yesterdayStatus &&
    yesterdayStatus.status === 'missed' &&
    recoveryTokensAvailable > 0;

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(actualInput);
    if (isNaN(val) || val < 0) return;

    setLogging(true);
    try {
      await onLog(habit.id, val);
    } finally {
      setLogging(false);
    }
  };

  const handleUseRecovery = async () => {
    if (!yesterdayStatus) return;
    setRecovering(true);
    try {
      await onRecover(habit.id, yesterdayStatus.date);
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700/80 transition-all space-y-4 relative flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/50">
                {habit.category}
              </span>
              {habit.reminder_time && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" /> {habit.reminder_time}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-white tracking-tight">{habit.name}</h3>
            {habit.description && (
              <p className="text-xs text-slate-400 line-clamp-1">{habit.description}</p>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Habit options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-32 rounded-xl bg-slate-950 border border-slate-800 shadow-xl z-20 py-1"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(habit);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Habit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(habit);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Target and Today Stat */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div>
            Target: <span className="font-semibold text-slate-200">{targetValue} {habit.target_unit}/day</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            {isCompleted ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Done ({currentActual} {habit.target_unit})
              </span>
            ) : isPartial ? (
              <span className="text-amber-400 font-semibold">
                Partial ({currentActual}/{targetValue} {habit.target_unit})
              </span>
            ) : (
              <span className="text-slate-500">Pending today</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted
                ? 'bg-emerald-500'
                : isPartial
                ? 'bg-amber-500'
                : 'bg-slate-700'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Streak and Badges */}
      <div className="flex items-center justify-between gap-2 py-1 border-t border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-amber-400">
          <Flame className="h-4 w-4 fill-amber-500/20" />
          <span>{habit.currentStreak} day streak</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <Trophy className="h-3.5 w-3.5 text-yellow-500/80" />
          <span>Best: {habit.bestStreak}d</span>
        </div>
      </div>

      {/* 7-Day History Boxes */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
          <span>Last 7 Days</span>
          <span className="text-[10px]">
            {habit.completionRate}% completion
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {habit.sevenDays.map((day, idx) => {
            const isSuccess = day.status === 'completed';
            const isSkip = day.status === 'skipped';
            const isMiss = day.status === 'missed';
            const isPend = day.status === 'pending';

            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-1"
                title={`${day.date}: ${day.status}${day.actual_value !== undefined ? ` (${day.actual_value})` : ''}`}
              >
                <span className="text-[10px] text-slate-500">{day.dayLabel}</span>
                <div
                  className={`w-full aspect-square max-w-[36px] rounded-lg flex items-center justify-center font-bold text-xs transition-colors border ${
                    isSuccess
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : isSkip
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : isMiss
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                  }`}
                >
                  {isSuccess ? '✓' : isSkip ? '🛟' : isMiss ? '×' : '•'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery Promotion banner if yesterday was missed */}
      {canProtectStreak && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
          <div className="flex items-start gap-2 text-xs text-cyan-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-semibold">Yesterday missed ({yesterdayStatus.date})</p>
              <p className="text-[11px] text-slate-400">
                Your streak can be protected with your 1 weekly recovery token.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleUseRecovery}
              disabled={recovering}
              className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {recovering ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                '🛟 Use Recovery'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Log Today Input Form */}
      <form onSubmit={handleLogSubmit} className="pt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            step="any"
            min="0"
            value={actualInput}
            onChange={(e) => setActualInput(e.target.value)}
            placeholder={`Log ${habit.target_unit}...`}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={logging || actualInput === ''}
          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1 transition-all shadow-sm shadow-indigo-600/20"
        >
          {logging ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Log'}
        </button>
      </form>
    </div>
  );
}
