import { HabitLog, DayStatus, ConsistencyScoreBreakdown, HabitStatus } from '@/types/habit';

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string into a Date object at UTC midnight
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Adds days to a date string YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Returns Monday (start of calendar week) for a given date YYYY-MM-DD
 */
export function getWeekStartMonday(dateStr: string): string {
  const d = parseDate(dateStr);
  const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Determines completion status based on actual value vs target value
 */
export function evaluateCompletionStatus(actualValue: number, targetValue: number): HabitStatus {
  if (actualValue >= targetValue) {
    return 'completed';
  }
  if (actualValue > 0) {
    return 'partial';
  }
  return 'missed';
}

/**
 * Calculate Current Streak from logs.
 * A completed day extends streak.
 * A recovery/skip preserves streak.
 * A missed day breaks streak.
 * Today having no log yet does not break streak (streak holds from yesterday).
 */
export function calculateCurrentStreak(logs: HabitLog[], todayStr: string): number {
  if (!logs || logs.length === 0) return 0;

  const logMap = new Map<string, HabitLog>();
  for (const log of logs) {
    logMap.set(log.log_date, log);
  }

  let streak = 0;
  const todayLog = logMap.get(todayStr);

  let checkDate = todayStr;

  // If today is completed or skipped (recovery), streak includes today
  if (todayLog && (todayLog.status === 'completed' || todayLog.status === 'skipped')) {
    streak = 1;
    checkDate = addDays(todayStr, -1);
  } else {
    // If today is not logged yet or is partial/missed, we check from yesterday
    checkDate = addDays(todayStr, -1);
  }

  // Walk backwards day by day
  while (true) {
    const log = logMap.get(checkDate);
    if (!log) {
      // Missing log on a past day breaks streak
      break;
    }

    if (log.status === 'completed' || log.status === 'skipped') {
      streak += 1;
      checkDate = addDays(checkDate, -1);
    } else {
      // 'partial' or 'missed' breaks streak
      break;
    }
  }

  return streak;
}

/**
 * Calculate Best Streak historically from logs
 */
export function calculateBestStreak(logs: HabitLog[]): number {
  if (!logs || logs.length === 0) return 0;

  // Sort logs ascending by date
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  
  // Deduplicate by date
  const uniqueDateMap = new Map<string, HabitLog>();
  for (const l of sorted) {
    uniqueDateMap.set(l.log_date, l);
  }

  const sortedDates = Array.from(uniqueDateMap.keys()).sort();
  if (sortedDates.length === 0) return 0;

  let bestStreak = 0;
  let currentRun = 0;
  let prevDate: string | null = null;

  for (const dateStr of sortedDates) {
    const log = uniqueDateMap.get(dateStr)!;
    const isSuccess = log.status === 'completed' || log.status === 'skipped';

    if (isSuccess) {
      if (prevDate === null) {
        currentRun = 1;
      } else {
        const expectedNext = addDays(prevDate, 1);
        if (expectedNext === dateStr) {
          currentRun += 1;
        } else {
          // Gap in days breaks the run
          currentRun = 1;
        }
      }
      prevDate = dateStr;
      if (currentRun > bestStreak) {
        bestStreak = currentRun;
      }
    } else {
      currentRun = 0;
      prevDate = null;
    }
  }

  return bestStreak;
}

/**
 * Calculate the last 7 calendar days visualization ending on todayStr
 */
export function calculateSevenDayStatus(logs: HabitLog[], todayStr: string): DayStatus[] {
  const logMap = new Map<string, HabitLog>();
  for (const l of logs) {
    logMap.set(l.log_date, l);
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: DayStatus[] = [];

  // Generate dates from today-6 to today
  for (let i = 6; i >= 0; i--) {
    const dateStr = addDays(todayStr, -i);
    const dateObj = parseDate(dateStr);
    const dayLabel = dayLabels[dateObj.getUTCDay()];
    const isToday = dateStr === todayStr;

    const log = logMap.get(dateStr);
    let status: HabitStatus = 'missed';

    if (log) {
      status = log.status;
    } else if (isToday) {
      status = 'pending';
    } else {
      status = 'missed';
    }

    result.push({
      date: dateStr,
      dayLabel,
      status,
      actual_value: log ? Number(log.actual_value) : undefined,
      isToday
    });
  }

  return result;
}

/**
 * Calculate Completion Rate (percentage 0-100)
 * Note: 'skipped' (recovery) counts as non-completed for completion rate as per requirements!
 */
export function calculateCompletionRate(logs: HabitLog[]): number {
  if (!logs || logs.length === 0) return 0;
  
  const completedCount = logs.filter(l => l.status === 'completed').length;
  return Math.round((completedCount / logs.length) * 100);
}

/**
 * Explainable Consistency Score / 100
 * Model:
 * 40% = Overall Completion Rate (0-40)
 * 30% = Recent 7-Day Consistency (0-30)
 * 20% = Streak Stability (0-20, capped at 14+ days for full score)
 * 10% = Recovery Discipline (0-10, rewarding active habits without over-skipping)
 */
export function calculateConsistencyScore(
  logs: HabitLog[],
  todayStr: string,
  currentStreak: number
): ConsistencyScoreBreakdown {
  if (!logs || logs.length === 0) {
    return {
      score: 0,
      completionRateScore: 0,
      recent7DayScore: 0,
      streakStabilityScore: 0,
      recoveryDisciplineScore: 0,
      completionRatePercent: 0,
      recent7DayPercent: 0,
      streakDays: 0
    };
  }

  // 1. Completion Rate (40%)
  const completionRatePercent = calculateCompletionRate(logs);
  const completionRateScore = Math.round((completionRatePercent / 100) * 40);

  // 2. Recent 7-day consistency (30%)
  const last7 = calculateSevenDayStatus(logs, todayStr);
  const successful7Days = last7.filter(d => d.status === 'completed' || d.status === 'skipped').length;
  // Exclude today if it's still pending so the user isn't penalized mid-day
  const evaluated7Days = last7.filter(d => d.status !== 'pending').length;
  const recent7DayPercent = evaluated7Days > 0 ? Math.round((successful7Days / evaluated7Days) * 100) : 100;
  const recent7DayScore = Math.round((recent7DayPercent / 100) * 30);

  // 3. Streak Stability (20%)
  // Full 20 pts achieved with a 14+ day streak, linearly scaled
  const streakStabilityScore = Math.min(20, Math.round((currentStreak / 14) * 20));

  // 4. Recovery Discipline (10%)
  // Reward keeping streak with minimal skips (skipped logs <= 20% of completed logs gives full 10)
  const completedCount = logs.filter(l => l.status === 'completed').length;
  const skippedCount = logs.filter(l => l.status === 'skipped').length;
  let recoveryDisciplineScore = 10;
  if (skippedCount > 0 && completedCount > 0) {
    const skipRatio = skippedCount / completedCount;
    if (skipRatio > 0.5) recoveryDisciplineScore = 4;
    else if (skipRatio > 0.25) recoveryDisciplineScore = 7;
  }

  const totalScore = Math.min(100, Math.max(0, completionRateScore + recent7DayScore + streakStabilityScore + recoveryDisciplineScore));

  return {
    score: totalScore,
    completionRateScore,
    recent7DayScore,
    streakStabilityScore,
    recoveryDisciplineScore,
    completionRatePercent,
    recent7DayPercent,
    streakDays: currentStreak
  };
}

/**
 * Check if user can use a recovery token for a given date
 */
export function canUseRecoveryToken(
  availableTokensForWeek: number | null | undefined
): boolean {
  return availableTokensForWeek === 1 || availableTokensForWeek === undefined;
}
