'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Trophy,
  Clock,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';
import { Habit, HabitLog, DayStatus } from '@/types/habit';

interface HabitCardProps {
  index: number;
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
  index,
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

  const targetValue = Number(habit.target_value);
  const currentActual = habit.todayLog ? Number(habit.todayLog.actual_value) : 0;
  const isCompleted = habit.todayLog?.status === 'completed';
  const isPartial = habit.todayLog?.status === 'partial';
  const progressPercent = Math.min(100, Math.round((currentActual / targetValue) * 100));

  // Check if yesterday is eligible for recovery (i.e. was missed and not yet recovered)
  const yesterdayStatus =
    habit.sevenDays.length >= 2 ? habit.sevenDays[habit.sevenDays.length - 2] : null;
  const canProtectStreak =
    yesterdayStatus &&
    yesterdayStatus.status === 'missed' &&
    recoveryTokensAvailable > 0;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ea580c', '#09090b', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      // ignore
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(actualInput);
    if (isNaN(val) || val < 0) return;

    setLogging(true);
    try {
      await onLog(habit.id, val);
      if (val >= targetValue) {
        triggerCelebration();
      }
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

  const formattedIndex = String(index + 1).padStart(2, '0');
  const formattedStreak = String(habit.currentStreak).padStart(2, '0');
  const formattedBest = String(habit.bestStreak).padStart(2, '0');

  return (
    <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_0px_#09090b] flex flex-col justify-between space-y-4 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#09090b] transition-all">
      {/* Top Header Row */}
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2 border-b-2 border-black pb-2.5 font-mono">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-black">
                {formattedIndex} / {habit.name.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-100 border border-black uppercase text-zinc-700">
                {habit.category}
              </span>
            </div>
            {habit.description && (
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5 line-clamp-1">
                {habit.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(habit)}
              className="p-1.5 border border-black bg-white hover:bg-black hover:text-white transition-colors"
              title="Edit Habit Configuration"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(habit)}
              className="p-1.5 border border-black bg-white text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-colors"
              title="Delete Habit"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Target and Today Telemetry */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="border-2 border-black p-2 bg-zinc-50">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">DAILY TARGET</div>
            <div className="text-sm font-black text-black mt-0.5">
              {targetValue} {habit.target_unit.toUpperCase()}
            </div>
          </div>
          <div className="border-2 border-black p-2 bg-zinc-50">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">TODAY RECORDED</div>
            <div className="text-sm font-black text-[#ea580c] mt-0.5">
              {currentActual} {habit.target_unit.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Rectangular Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] font-mono font-bold">
            <span className="text-zinc-600 uppercase">COMPLETION</span>
            <span className="text-black font-black">{progressPercent}%</span>
          </div>
          <div className="h-3.5 w-full bg-zinc-200 border-2 border-black p-0.5">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-black' : 'bg-[#ea580c]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Status and Streak Row */}
        <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">STATUS</div>
            {isCompleted ? (
              <span className="inline-block bg-black text-white font-black px-2 py-0.5 text-[11px] uppercase border border-black">
                ■ COMPLETED
              </span>
            ) : isPartial ? (
              <span className="inline-block bg-white text-black font-black px-2 py-0.5 text-[11px] uppercase border-2 border-black">
                ◧ PARTIAL
              </span>
            ) : (
              <span className="inline-block bg-zinc-100 text-zinc-600 font-bold px-2 py-0.5 text-[11px] uppercase border border-black">
                □ PENDING
              </span>
            )}
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">STREAK</div>
            <div className="text-sm font-black text-[#ea580c]">
              {formattedStreak} <span className="text-[10px] text-black uppercase font-bold">DAYS</span>
              <span className="text-[10px] text-zinc-500 font-normal ml-1">
                (BEST: {formattedBest})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Technical Matrix */}
      <div className="space-y-2 pt-2 border-t-2 border-black font-mono">
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase">
          <span>7-DAY TELEMETRY</span>
          <span>{habit.completionRate}% HIT RATE</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {habit.sevenDays.map((day, idx) => {
            const isSuccess = day.status === 'completed';
            const isSkip = day.status === 'skipped';
            const isMiss = day.status === 'missed';

            return (
              <div key={idx} className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-zinc-500">{day.dayLabel[0]}</span>
                <div
                  className={`h-7 flex items-center justify-center font-bold text-xs border-2 border-black transition-colors ${
                    isSuccess
                      ? 'bg-black text-white'
                      : isSkip
                      ? 'bg-[#ea580c] text-black font-black'
                      : isMiss
                      ? 'bg-white text-[#dc2626]'
                      : 'bg-white text-zinc-400'
                  }`}
                  title={`${day.date}: ${day.status.toUpperCase()}${
                    day.actual_value !== undefined ? ` (${day.actual_value})` : ''
                  }`}
                >
                  {isSuccess ? '■' : isSkip ? '↺' : isMiss ? '×' : '·'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery Offer Banner if yesterday missed */}
      {canProtectStreak && (
        <div className="p-3 border-2 border-black bg-[#ea580c]/10 space-y-2 font-mono">
          <div className="flex items-start gap-2 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#ea580c] mt-0.5" />
            <div>
              <div className="font-black uppercase text-black">
                YESTERDAY MISSED ({yesterdayStatus.date})
              </div>
              <div className="text-[11px] text-zinc-700">
                STREAK CAN BE PROTECTED WITH 1 WEEKLY TOKEN.
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleUseRecovery}
              disabled={recovering}
              className="px-3 py-1 bg-[#ea580c] hover:bg-black hover:text-white text-black font-bold text-xs border-2 border-black uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_#09090b]"
            >
              {recovering ? (
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
              ) : (
                '↺ PROTECT STREAK'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Daily Value Input & Log Action Form */}
      <form onSubmit={handleLogSubmit} className="pt-2 flex items-center gap-2 font-mono">
        <input
          type="number"
          step="any"
          min="0"
          value={actualInput}
          onChange={(e) => setActualInput(e.target.value)}
          placeholder={`ENTER ${habit.target_unit.toUpperCase()}...`}
          className="flex-1 px-3 py-1.5 border-2 border-black bg-white text-xs text-black placeholder:text-zinc-400 focus:outline-none focus:border-[#ea580c]"
        />
        <button
          type="submit"
          disabled={logging || actualInput === ''}
          className="btn-brutal-primary py-1.5 px-4 text-xs font-bold"
        >
          {logging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'LOG'}
        </button>
      </form>
    </div>
  );
}
