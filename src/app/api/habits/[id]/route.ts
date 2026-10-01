import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { habitUpdateSchema } from '@/lib/validation/habit-schema';

export async function PATCH(
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
    const parsed = habitUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data: updatedHabit, error: updateError } = await supabase
      .from('habits')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update habit: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ habit: updatedHabit });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Soft delete habit: set is_active = false so historical logs remain intact
    const { error: deleteError } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete habit: ' + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Habit deleted' });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
