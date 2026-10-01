import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { habitCreateSchema } from '@/lib/validation/habit-schema';
import {
  calculateCurrentStreak,
  calculateBestStreak,
  calculateSevenDayStatus,
  calculateCompletionRate,
  calculateConsistencyScore,
  getWeekStartMonday,
  formatDate,
} from '@/lib/streaks/streak-engine';
import { HabitLog } from '@/types/habit';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const todayStr = dateParam || formatDate(new Date());
    const weekStart = getWeekStartMonday(todayStr);

    // 1. Fetch user's active habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (habitsError) {
      return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
    }

    // 2. Fetch logs for this user
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: true });

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // 3. Fetch recovery token for current calendar week
    const { data: recoveryToken, error: tokenError } = await supabase
      .from('recovery_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle();

    const availableRecoveryTokens = recoveryToken ? recoveryToken.available : 1;

    // Group logs by habit_id
    const logsByHabit = new Map<string, HabitLog[]>();
    for (const log of (logs || []) as HabitLog[]) {
      const existing = logsByHabit.get(log.habit_id) || [];
      existing.push(log);
      logsByHabit.set(log.habit_id, existing);
    }

    // Process each habit with streak engine
    let totalStreak = 0;
    const enrichedHabits = (habits || []).map((habit) => {
      const habitLogs = logsByHabit.get(habit.id) || [];
      const currentStreak = calculateCurrentStreak(habitLogs, todayStr);
      const bestStreak = calculateBestStreak(habitLogs);
      const sevenDays = calculateSevenDayStatus(habitLogs, todayStr);
      const completionRate = calculateCompletionRate(habitLogs);
      const todayLog = habitLogs.find((l) => l.log_date === todayStr);

      totalStreak += currentStreak;

      return {
        ...habit,
        logs: habitLogs,
        todayLog: todayLog || null,
        currentStreak,
        bestStreak,
        sevenDays,
        completionRate,
      };
    });

    const avgStreak = habits && habits.length > 0 ? Math.round(totalStreak / habits.length) : 0;
    const allLogs = (logs || []) as HabitLog[];
    const consistency = calculateConsistencyScore(allLogs, todayStr, avgStreak);

    return NextResponse.json({
      habits: enrichedHabits,
      consistency,
      recovery: {
        weekStart,
        available: availableRecoveryTokens,
        usedAt: recoveryToken?.used_at || null,
      },
      todayStr,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = habitCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data: newHabit, error: insertError } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category,
        target_value: parsed.data.target_value,
        target_unit: parsed.data.target_unit,
        frequency: parsed.data.frequency,
        reminder_time: parsed.data.reminder_time,
        is_active: true,
      })
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create habit: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json({ habit: newHabit }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
