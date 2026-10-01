export type HabitStatus = 'completed' | 'partial' | 'missed' | 'skipped' | 'pending';
export type HabitSource = 'manual' | 'telegram' | 'ai' | 'iot' | 'reader';
export type HabitFrequency = 'daily' | 'weekly';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  category: string;
  target_value: number;
  target_unit: string;
  frequency: HabitFrequency;
  reminder_time?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  actual_value: number;
  status: HabitStatus;
  source: HabitSource;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecoveryToken {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD (Monday)
  available: number; // 0 or 1
  used_at?: string | null;
  created_at: string;
}

export interface DayStatus {
  date: string; // YYYY-MM-DD
  dayLabel: string; // 'Mon', 'Tue', etc.
  status: HabitStatus;
  actual_value?: number;
  isToday: boolean;
}

export interface ConsistencyScoreBreakdown {
  score: number; // 0-100
  completionRateScore: number; // out of 40
  recent7DayScore: number; // out of 30
  streakStabilityScore: number; // out of 20
  recoveryDisciplineScore: number; // out of 10
  completionRatePercent: number;
  recent7DayPercent: number;
  streakDays: number;
}
