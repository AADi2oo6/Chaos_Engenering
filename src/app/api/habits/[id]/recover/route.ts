import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recoveryLogSchema } from '@/lib/validation/habit-schema';
import { getWeekStartMonday } from '@/lib/streaks/streak-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = recoveryLogSchema.safeParse({ ...body, habit_id: id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const logDate = parsed.data.log_date;
    const weekStart = getWeekStartMonday(logDate);

    // 1. Verify habit exists and belongs to user
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // 2. Check if a recovery token for this calendar week is available
    const { data: existingToken, error: tokenError } = await supabase
      .from('recovery_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (tokenError) {
      return NextResponse.json(
        { error: 'Failed to verify recovery token: ' + tokenError.message },
        { status: 500 }
      );
    }

    if (existingToken && existingToken.available === 0) {
      return NextResponse.json(
        {
          error:
            'You have already used your 1 recovery token for this week (' +
            weekStart +
            '). Kind recovery resets every Monday!',
        },
        { status: 400 }
      );
    }

    // 3. Mark the recovery token as consumed (available = 0)
    const { error: consumeError } = await supabase
      .from('recovery_tokens')
      .upsert(
        {
          user_id: user.id,
          week_start: weekStart,
          available: 0,
          used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,week_start' }
      );

    if (consumeError) {
      return NextResponse.json(
        { error: 'Failed to consume recovery token: ' + consumeError.message },
        { status: 500 }
      );
    }

    // 4. Upsert the habit log as 'skipped' (recovery)
    const { data: log, error: logError } = await supabase
      .from('habit_logs')
      .upsert(
        {
          habit_id: id,
          user_id: user.id,
          log_date: logDate,
          actual_value: 0,
          status: 'skipped',
          source: 'manual',
          notes: 'Protected with weekly recovery token',
        },
        { onConflict: 'habit_id,log_date' }
      )
      .select('*')
      .single();

    if (logError) {
      return NextResponse.json(
        { error: 'Failed to apply recovery to log: ' + logError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly recovery applied! Streak protected.',
      log,
      weekStart,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
