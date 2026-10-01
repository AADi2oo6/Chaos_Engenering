'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/dashboard/Header';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitModal } from '@/components/habits/CreateHabitModal';
import { EditHabitModal } from '@/components/habits/EditHabitModal';
import { DeleteHabitDialog } from '@/components/habits/DeleteHabitDialog';
import { ConsistencyBreakdownModal } from '@/components/dashboard/ConsistencyBreakdownModal';
import { Habit, HabitLog, DayStatus, ConsistencyScoreBreakdown } from '@/types/habit';
import { HabitCreateInput, HabitUpdateInput } from '@/lib/validation/habit-schema';
import {
  Plus,
  Flame,
  Trophy,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface EnrichedHabit extends Habit {
  todayLog?: HabitLog | null;
  currentStreak: number;
  bestStreak: number;
  sevenDays: DayStatus[];
  completionRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>('');
  const [habits, setHabits] = useState<EnrichedHabit[]>([]);
  const [consistency, setConsistency] = useState<ConsistencyScoreBreakdown>({
    score: 0,
    completionRateScore: 0,
    recent7DayScore: 0,
    streakStabilityScore: 0,
    recoveryDisciplineScore: 0,
    completionRatePercent: 0,
    recent7DayPercent: 0,
    streakDays: 0,
  });
  const [recoveryTokensAvailable, setRecoveryTokensAvailable] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [isScoreOpen, setIsScoreOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setDisplayName(
        user.user_metadata?.display_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'OPERATOR'
      );

      const res = await fetch('/api/habits');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('FAILED TO RETRIEVE TELEMETRY DATA');
      }

      const data = await res.json();
      setHabits(data.habits || []);
      if (data.consistency) setConsistency(data.consistency);
      if (data.recovery) setRecoveryTokensAvailable(data.recovery.available);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'COMMUNICATION ERROR', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreateHabit = async (input: HabitCreateInput) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'FAILED TO CREATE HABIT');
    }

    showToast(`HABIT PROTOCOL INITIALIZED: ${input.name.toUpperCase()}`);
    await loadData();
  };

  const handleUpdateHabit = async (id: string, input: HabitUpdateInput) => {
    const res = await fetch(`/api/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'FAILED TO COMMIT REVISION');
    }

    showToast('HABIT CONFIGURATION COMMITTED');
    await loadData();
  };

  const handleDeleteHabit = async (id: string) => {
    const res = await fetch(`/api/habits/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'FAILED TO DEACTIVATE');
    }

    showToast('HABIT PROTOCOL DEACTIVATED');
    await loadData();
  };

  const handleLogProgress = async (habitId: string, actualValue: number) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/habits/${habitId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        log_date: today,
        actual_value: actualValue,
        source: 'manual',
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      showToast(errData.error || 'LOG ENTRY FAILED', 'error');
      return;
    }

    const resData = await res.json();
    if (resData.status === 'completed') {
      showToast('✓ TARGET COMPLETED // STREAK EXTENDED');
    } else {
      showToast('PARTIAL VALUE RECORDED');
    }

    await loadData();
  };

  const handleRecover = async (habitId: string, date: string) => {
    const res = await fetch(`/api/habits/${habitId}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        log_date: date,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      showToast(errData.error || 'RECOVERY TOKEN EXHAUSTED', 'error');
      return;
    }

    showToast('↺ RECOVERY TOKEN APPLIED // STREAK PRESERVED');
    await loadData();
  };

  const handleQuickAdd = async (name: string, target_value: number, target_unit: string, category: string) => {
    try {
      await handleCreateHabit({
        name,
        target_value,
        target_unit,
        category,
        frequency: 'daily',
      });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'FAILED TO INITIALIZE TEMPLATE', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-black font-mono gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
        <p className="text-xs uppercase font-bold tracking-wider">
          INITIALIZING TELEMETRY DASHBOARD...
        </p>
      </div>
    );
  }

  // Summary statistics
  const activeCount = habits.length;
  const maxStreak = habits.reduce((acc, h) => Math.max(acc, h.currentStreak), 0);
  const bestAllTimeStreak = habits.reduce((acc, h) => Math.max(acc, h.bestStreak), 0);
  const avgCompletion =
    activeCount > 0
      ? Math.round(habits.reduce((acc, h) => acc + h.completionRate, 0) / activeCount)
      : 0;

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date())
    .toUpperCase();

  return (
    <div className="min-h-screen bg-white text-[#09090b] p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Brutalist Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_#09090b] text-xs font-mono font-bold animate-in fade-in slide-in-from-top-2 duration-150 ${
            toastMessage.type === 'error' ? 'text-[#dc2626]' : 'text-black'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-[#dc2626]" />
          ) : (
            <span className="w-2.5 h-2.5 bg-[#ea580c] shrink-0" />
          )}
          <span className="uppercase tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Industrial Header */}
      <Header
        displayName={displayName}
        consistency={consistency}
        recoveryTokensAvailable={recoveryTokensAvailable}
        onOpenScoreModal={() => setIsScoreOpen(true)}
      />

      {/* Hero Diagnostic Telemetry Grid */}
      <section className="space-y-3 font-mono">
        <div className="flex justify-between items-center text-xs font-bold uppercase text-zinc-600 border-b-2 border-black pb-1">
          <span>SYSTEM TELEMETRY // DAILY OVERVIEW</span>
          <span>DATE: {todayFormatted}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* 1. Consistency Index */}
          <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#09090b] space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">
              CONSISTENCY INDEX
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              <span className="text-[#ea580c]">{String(consistency.score).padStart(3, '0')}</span>{' '}
              <span className="text-xs text-zinc-400 font-normal">/ 100</span>
            </div>
            <div className="h-2 w-full bg-zinc-200 border border-black p-0.5 mt-1">
              <div
                className="h-full bg-black"
                style={{ width: `${consistency.score}%` }}
              />
            </div>
          </div>

          {/* 2. Current Streak */}
          <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#09090b] space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">
              TOP ACTIVE STREAK
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {String(maxStreak).padStart(2, '0')}{' '}
              <span className="text-xs text-zinc-500 font-bold uppercase">DAYS</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase">
              BEST ALL-TIME: {String(bestAllTimeStreak).padStart(2, '0')}D
            </div>
          </div>

          {/* 3. Average Completion */}
          <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#09090b] space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">
              COMPLETION RATE
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {avgCompletion}%
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase">
              {activeCount} ACTIVE PROTOCOLS
            </div>
          </div>

          {/* 4. Weekly Recovery Token */}
          <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#09090b] space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">
              RECOVERY TOKEN
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#ea580c]">
              0{recoveryTokensAvailable}{' '}
              <span className="text-xs text-black font-bold uppercase">READY</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase">
              1 SKIP ALLOWED / CALENDAR WEEK
            </div>
          </div>
        </div>
      </section>

      {/* Operations Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 font-mono">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black" />
            TODAY'S OPERATIONS
          </h2>
          <p className="text-xs text-zinc-600 font-medium">
            ENTER ACTUAL VALUES TO SATISFY DAILY TARGETS AND MAINTAIN RUNNING STREAKS.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-brutal-primary py-2.5 px-5 text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          [ DEPLOY NEW HABIT ]
        </button>
      </div>

      {/* Habit Protocol Grid or Empty State */}
      {habits.length === 0 ? (
        <div className="border-[3px] border-black bg-white p-8 md:p-12 shadow-[6px_6px_0px_0px_#09090b] text-center space-y-6 font-mono">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl mx-auto border-2 border-black shadow-[3px_3px_0px_0px_#ea580c]">
              ◈
            </div>
            <h3 className="text-lg font-black uppercase text-black">
              NO ACTIVE HABIT PROTOCOLS CONFIGURED
            </h3>
            <p className="text-xs text-zinc-600 font-sans font-medium leading-relaxed">
              Initialize your first habit by setting a daily numeric target. Select a pre-configured engineering template or configure a custom protocol.
            </p>
          </div>

          {/* Quick-Start Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-2">
            <button
              onClick={() => handleQuickAdd('READING', 10, 'PAGES', 'LEARNING')}
              className="p-4 border-2 border-black bg-white hover:bg-[#ea580c] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left shadow-[3px_3px_0px_0px_#09090b] group"
            >
              <div className="text-xs font-bold text-zinc-500 uppercase group-hover:text-black">01 / TEMPLATE</div>
              <div className="font-black text-sm text-black mt-1 uppercase">READ 10 PAGES</div>
              <div className="text-[11px] text-zinc-600 mt-1 font-bold group-hover:text-black">LEARNING • 10 PAGES/DAY</div>
            </button>

            <button
              onClick={() => handleQuickAdd('WALKING', 5000, 'STEPS', 'FITNESS')}
              className="p-4 border-2 border-black bg-white hover:bg-[#ea580c] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left shadow-[3px_3px_0px_0px_#09090b] group"
            >
              <div className="text-xs font-bold text-zinc-500 uppercase group-hover:text-black">02 / TEMPLATE</div>
              <div className="font-black text-sm text-black mt-1 uppercase">WALK 5000 STEPS</div>
              <div className="text-[11px] text-zinc-600 mt-1 font-bold group-hover:text-black">FITNESS • 5000 STEPS/DAY</div>
            </button>

            <button
              onClick={() => handleQuickAdd('STUDY', 60, 'MINUTES', 'FOCUS')}
              className="p-4 border-2 border-black bg-white hover:bg-[#ea580c] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left shadow-[3px_3px_0px_0px_#09090b] group"
            >
              <div className="text-xs font-bold text-zinc-500 uppercase group-hover:text-black">03 / TEMPLATE</div>
              <div className="font-black text-sm text-black mt-1 uppercase">STUDY 60 MINS</div>
              <div className="text-[11px] text-zinc-600 mt-1 font-bold group-hover:text-black">FOCUS • 60 MINS/DAY</div>
            </button>

            <button
              onClick={() => handleQuickAdd('WATER', 2, 'LITRES', 'HEALTH')}
              className="p-4 border-2 border-black bg-white hover:bg-[#ea580c] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left shadow-[3px_3px_0px_0px_#09090b] group"
            >
              <div className="text-xs font-bold text-zinc-500 uppercase group-hover:text-black">04 / TEMPLATE</div>
              <div className="font-black text-sm text-black mt-1 uppercase">DRINK 2 LITRES</div>
              <div className="text-[11px] text-zinc-600 mt-1 font-bold group-hover:text-black">HEALTH • 2 LITRES/DAY</div>
            </button>
          </div>

          <div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-brutal-primary px-6 py-3 text-xs"
            >
              INITIALIZE CUSTOM PROTOCOL
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit, index) => (
            <HabitCard
              key={habit.id}
              index={index}
              habit={habit}
              recoveryTokensAvailable={recoveryTokensAvailable}
              onLog={handleLogProgress}
              onRecover={handleRecover}
              onEdit={(h) => setEditingHabit(h)}
              onDelete={(h) => setDeletingHabit(h)}
            />
          ))}
        </div>
      )}

      {/* Aggregate 7-Day System Status Table (Section 25) */}
      {habits.length > 0 && (
        <section className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_0px_#09090b] space-y-3 font-mono">
          <div className="flex justify-between items-center text-xs font-bold uppercase border-b-2 border-black pb-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-black" />
              SYSTEM TELEMETRY MATRIX // LAST 7 CALENDAR DAYS
            </span>
            <span className="text-[11px] text-zinc-500">
              ■ COMPLETED • ↺ RECOVERED • × MISSED • · PENDING
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-zinc-100 text-black uppercase">
                  <th className="p-2.5 font-bold">HABIT PROTOCOL</th>
                  <th className="p-2.5 font-bold">DAILY TARGET</th>
                  <th className="p-2.5 font-bold">STREAK</th>
                  {habits[0]?.sevenDays.map((d, i) => (
                    <th key={i} className="p-2.5 font-bold text-center">
                      {d.dayLabel.toUpperCase()}
                    </th>
                  ))}
                  <th className="p-2.5 font-bold text-right">HIT RATE</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, idx) => (
                  <tr
                    key={habit.id}
                    className="border-b border-black hover:bg-zinc-50 transition-colors"
                  >
                    <td className="p-2.5 font-black uppercase text-black">
                      {String(idx + 1).padStart(2, '0')} / {habit.name}
                    </td>
                    <td className="p-2.5 text-zinc-700">
                      {habit.target_value} {habit.target_unit.toUpperCase()}
                    </td>
                    <td className="p-2.5 font-black text-[#ea580c]">
                      {String(habit.currentStreak).padStart(2, '0')}D
                    </td>
                    {habit.sevenDays.map((d, i) => (
                      <td key={i} className="p-2.5 text-center">
                        <span
                          className={`inline-block w-6 h-6 leading-6 text-center font-bold border ${
                            d.status === 'completed'
                              ? 'bg-black text-white border-black'
                              : d.status === 'skipped'
                              ? 'bg-[#ea580c] text-black font-black border-black'
                              : d.status === 'missed'
                              ? 'bg-white text-[#dc2626] border-black'
                              : 'bg-zinc-100 text-zinc-400 border-zinc-300'
                          }`}
                        >
                          {d.status === 'completed'
                            ? '■'
                            : d.status === 'skipped'
                            ? '↺'
                            : d.status === 'missed'
                            ? '×'
                            : '·'}
                        </span>
                      </td>
                    ))}
                    <td className="p-2.5 text-right font-black">
                      {habit.completionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modals */}
      <CreateHabitModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateHabit}
      />

      <EditHabitModal
        habit={editingHabit}
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onUpdate={handleUpdateHabit}
      />

      <DeleteHabitDialog
        habit={deletingHabit}
        isOpen={!!deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onConfirm={handleDeleteHabit}
      />

      <ConsistencyBreakdownModal
        isOpen={isScoreOpen}
        onClose={() => setIsScoreOpen(false)}
        consistency={consistency}
      />
    </div>
  );
}
