import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { habitLogSchema } from '@/lib/validation/habit-schema';
import { evaluateCompletionStatus } from '@/lib/streaks/streak-engine';

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
    const parsed = habitLogSchema.safeParse({ ...body, habit_id: id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 1. Fetch habit to verify ownership and get target_value
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, target_value, is_active')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // 2. Evaluate completion status
    const status = evaluateCompletionStatus(parsed.data.actual_value, Number(habit.target_value));

    // 3. Upsert log in habit_logs table (handles UNIQUE(habit_id, log_date))
    const { data: log, error: logError } = await supabase
      .from('habit_logs')
      .upsert(
        {
          habit_id: id,
          user_id: user.id,
          log_date: parsed.data.log_date,
          actual_value: parsed.data.actual_value,
          status,
          source: parsed.data.source || 'manual',
          notes: parsed.data.notes || null,
        },
        { onConflict: 'habit_id,log_date' }
      )
      .select('*')
      .single();

    if (logError) {
      return NextResponse.json(
        { error: 'Failed to record log: ' + logError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ log, status });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
