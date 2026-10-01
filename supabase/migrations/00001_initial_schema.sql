-- 00001_initial_schema.sql
-- HabitOS Core MVP Schema with RLS and Constraints

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_profiles_user_id UNIQUE (user_id)
);

-- 2. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 100),
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General' CHECK (char_length(category) <= 50),
    target_value NUMERIC NOT NULL CHECK (target_value > 0),
    target_unit TEXT NOT NULL CHECK (char_length(trim(target_unit)) > 0 AND char_length(target_unit) <= 50),
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
    reminder_time TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Habit Logs Table
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    actual_value NUMERIC NOT NULL CHECK (actual_value >= 0),
    status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'missed', 'skipped')),
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'telegram', 'ai', 'iot', 'reader')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_habit_logs_habit_date UNIQUE (habit_id, log_date)
);

-- 4. Recovery Tokens Table (1 skip per calendar week)
CREATE TABLE IF NOT EXISTS public.recovery_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    available INTEGER NOT NULL DEFAULT 1 CHECK (available >= 0 AND available <= 1),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_recovery_tokens_user_week UNIQUE (user_id, week_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON public.habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON public.habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user_week ON public.recovery_tokens(user_id, week_start);

-- 5. Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_habits_updated_at ON public.habits;
CREATE TRIGGER set_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_habit_logs_updated_at ON public.habit_logs;
CREATE TRIGGER set_habit_logs_updated_at
BEFORE UPDATE ON public.habit_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Trigger for Auto-Creating Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, timezone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Habit Builder'),
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_tokens ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- Profiles: Users can only read and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Habits: Users can only CRUD their own habits
DROP POLICY IF EXISTS "Users can select own habits" ON public.habits;
CREATE POLICY "Users can select own habits"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);

-- Habit Logs: Users can only CRUD their own habit logs and only for habits they own
DROP POLICY IF EXISTS "Users can select own habit logs" ON public.habit_logs;
CREATE POLICY "Users can select own habit logs"
    ON public.habit_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habit logs" ON public.habit_logs;
CREATE POLICY "Users can insert own habit logs"
    ON public.habit_logs FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.habits WHERE id = habit_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update own habit logs" ON public.habit_logs;
CREATE POLICY "Users can update own habit logs"
    ON public.habit_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.habits WHERE id = habit_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete own habit logs" ON public.habit_logs;
CREATE POLICY "Users can delete own habit logs"
    ON public.habit_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Recovery Tokens: Users can only CRUD their own recovery tokens
DROP POLICY IF EXISTS "Users can select own recovery tokens" ON public.recovery_tokens;
CREATE POLICY "Users can select own recovery tokens"
    ON public.recovery_tokens FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recovery tokens" ON public.recovery_tokens;
CREATE POLICY "Users can insert own recovery tokens"
    ON public.recovery_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recovery tokens" ON public.recovery_tokens;
CREATE POLICY "Users can update own recovery tokens"
    ON public.recovery_tokens FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
