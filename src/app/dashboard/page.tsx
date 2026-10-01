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
  Sparkles,
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
          'Habit Builder'
      );

      const res = await fetch('/api/habits');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load habits data');
      }

      const data = await res.json();
      setHabits(data.habits || []);
      if (data.consistency) setConsistency(data.consistency);
      if (data.recovery) setRecoveryTokensAvailable(data.recovery.available);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error fetching dashboard data', 'error');
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
      throw new Error(errData.error || 'Failed to create habit');
    }

    showToast(`Created habit: ${input.name}!`);
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
      throw new Error(errData.error || 'Failed to update habit');
    }

    showToast('Habit updated successfully!');
    await loadData();
  };

  const handleDeleteHabit = async (id: string) => {
    const res = await fetch(`/api/habits/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to delete habit');
    }

    showToast('Habit removed from active dashboard.');
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
      showToast(errData.error || 'Failed to log daily value', 'error');
      return;
    }

    const resData = await res.json();
    if (resData.status === 'completed') {
      showToast('🎉 Daily target completed! Streak extended.');
    } else {
      showToast('Progress recorded.');
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
      showToast(errData.error || 'Failed to apply recovery token', 'error');
      return;
    }

    showToast('🛟 Recovery applied! Streak successfully protected.');
    await loadData();
  };

  // Quick starter helper
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
      showToast(e instanceof Error ? e.message : 'Error creating preset', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading your habit dashboard...</p>
      </div>
    );
  }

  // Summary statistics across active habits
  const activeCount = habits.length;
  const maxStreak = habits.reduce((acc, h) => Math.max(acc, h.currentStreak), 0);
  const bestAllTimeStreak = habits.reduce((acc, h) => Math.max(acc, h.bestStreak), 0);
  const avgCompletion =
    activeCount > 0
      ? Math.round(habits.reduce((acc, h) => acc + h.completionRate, 0) / activeCount)
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        displayName={displayName}
        consistency={consistency}
        recoveryTokensAvailable={recoveryTokensAvailable}
        onOpenScoreModal={() => setIsScoreOpen(true)}
      />

      {/* Top Stats Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Top Active Streak</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{maxStreak} <span className="text-sm font-normal text-slate-500">days</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span>Best All-Time</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{bestAllTimeStreak} <span className="text-sm font-normal text-slate-500">days</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="h-4 w-4 text-indigo-400" />
            <span>Avg Completion</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{avgCompletion}%</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>Weekly Recovery</span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-300">
            {recoveryTokensAvailable} <span className="text-sm font-normal text-slate-500">left</span>
          </div>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex justify-between items-center pt-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Today's Habits</h2>
          <p className="text-xs text-slate-400">Log daily values, meet targets, and preserve streaks</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all hover:gap-2.5"
        >
          <Plus className="h-4 w-4" /> Add Habit
        </button>
      </div>

      {/* Habits Grid or Empty State */}
      {habits.length === 0 ? (
        <div className="p-8 md:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">You haven't created any habits yet</h3>
            <p className="text-xs text-slate-400">
              Start your journey by setting a daily target. Select one of the quick suggestions below or create your own custom habit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
            <button
              onClick={() => handleQuickAdd('Reading', 10, 'pages', 'Learning')}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-left space-y-1 group"
            >
              <div className="text-2xl mb-1">📖</div>
              <div className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                Read 10 pages
              </div>
              <div className="text-[11px] text-slate-500">Learning • 10 pages/day</div>
            </button>

            <button
              onClick={() => handleQuickAdd('Walking', 5000, 'steps', 'Fitness')}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-left space-y-1 group"
            >
              <div className="text-2xl mb-1">🚶</div>
              <div className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                Walk 5000 steps
              </div>
              <div className="text-[11px] text-slate-500">Fitness • 5000 steps/day</div>
            </button>

            <button
              onClick={() => handleQuickAdd('Study', 60, 'minutes', 'Focus')}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-left space-y-1 group"
            >
              <div className="text-2xl mb-1">📚</div>
              <div className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                Study 60 minutes
              </div>
              <div className="text-[11px] text-slate-500">Focus • 60 mins/day</div>
            </button>

            <button
              onClick={() => handleQuickAdd('Drink Water', 2, 'litres', 'Health')}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-left space-y-1 group"
            >
              <div className="text-2xl mb-1">💧</div>
              <div className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">
                Drink 2 litres
              </div>
              <div className="text-[11px] text-slate-500">Health • 2 litres/day</div>
            </button>
          </div>

          <div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20"
            >
              Create Custom Habit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
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
