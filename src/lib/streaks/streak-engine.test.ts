import { describe, it, expect } from 'vitest';
import {
  calculateCurrentStreak,
  calculateBestStreak,
  calculateSevenDayStatus,
  calculateCompletionRate,
  calculateConsistencyScore,
  evaluateCompletionStatus,
  getWeekStartMonday,
  canUseRecoveryToken,
} from './streak-engine';
import { HabitLog } from '@/types/habit';

describe('Streak Engine', () => {
  const dummyHabitId = 'habit-1';
  const dummyUserId = 'user-1';

  const makeLog = (date: string, status: 'completed' | 'partial' | 'missed' | 'skipped', actual = 10): HabitLog => ({
    id: `log-${date}`,
    habit_id: dummyHabitId,
    user_id: dummyUserId,
    log_date: date,
    actual_value: actual,
    status,
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  describe('evaluateCompletionStatus', () => {
    it('marks completed when actual >= target', () => {
      expect(evaluateCompletionStatus(10, 10)).toBe('completed');
      expect(evaluateCompletionStatus(15, 10)).toBe('completed');
    });

    it('marks partial when 0 < actual < target', () => {
      expect(evaluateCompletionStatus(7, 10)).toBe('partial');
    });

    it('marks missed when actual is 0', () => {
      expect(evaluateCompletionStatus(0, 10)).toBe('missed');
    });
  });

  describe('calculateCurrentStreak', () => {
    it('calculates 5 days with recovery day preserving streak', () => {
      // Mon: completed, Tue: completed, Wed: completed, Thu: skipped, Fri: completed (today = Fri)
      const logs: HabitLog[] = [
        makeLog('2026-10-05', 'completed'), // Mon
        makeLog('2026-10-06', 'completed'), // Tue
        makeLog('2026-10-07', 'completed'), // Wed
        makeLog('2026-10-08', 'skipped'),   // Thu (recovery)
        makeLog('2026-10-09', 'completed'), // Fri (today)
      ];
      expect(calculateCurrentStreak(logs, '2026-10-09')).toBe(5);
    });

    it('resets streak on missed day without recovery', () => {
      // Mon: completed, Tue: completed, Wed: completed, Thu: missed, Fri: completed
      const logs: HabitLog[] = [
        makeLog('2026-10-05', 'completed'),
        makeLog('2026-10-06', 'completed'),
        makeLog('2026-10-07', 'completed'),
        makeLog('2026-10-08', 'missed'),
        makeLog('2026-10-09', 'completed'),
      ];
      expect(calculateCurrentStreak(logs, '2026-10-09')).toBe(1);
    });

    it('preserves yesterday streak if today has not been logged yet', () => {
      // Wed: completed, Thu: completed, Fri: not logged yet (today = Fri)
      const logs: HabitLog[] = [
        makeLog('2026-10-07', 'completed'),
        makeLog('2026-10-08', 'completed'),
      ];
      expect(calculateCurrentStreak(logs, '2026-10-09')).toBe(2);
    });

    it('reports 0 streak if yesterday was missed and today is not logged', () => {
      const logs: HabitLog[] = [
        makeLog('2026-10-07', 'completed'),
        makeLog('2026-10-08', 'missed'),
      ];
      expect(calculateCurrentStreak(logs, '2026-10-09')).toBe(0);
    });
  });

  describe('calculateBestStreak', () => {
    it('finds maximum historical run across gaps and resets', () => {
      const logs: HabitLog[] = [
        makeLog('2026-10-01', 'completed'),
        makeLog('2026-10-02', 'completed'),
        makeLog('2026-10-03', 'completed'), // Run of 3
        makeLog('2026-10-04', 'missed'),
        makeLog('2026-10-05', 'completed'),
        makeLog('2026-10-06', 'skipped'),
        makeLog('2026-10-07', 'completed'),
        makeLog('2026-10-08', 'completed'),
        makeLog('2026-10-09', 'completed'), // Run of 5
      ];
      expect(calculateBestStreak(logs)).toBe(5);
    });
  });

  describe('calculateSevenDayStatus', () => {
    it('returns exactly 7 days ending on today with accurate status', () => {
      const logs: HabitLog[] = [
        makeLog('2026-10-07', 'completed', 12),
        makeLog('2026-10-08', 'skipped', 0),
      ];
      const today = '2026-10-09';
      const days = calculateSevenDayStatus(logs, today);
      expect(days).toHaveLength(7);
      expect(days[6].date).toBe('2026-10-09');
      expect(days[6].isToday).toBe(true);
      expect(days[6].status).toBe('pending'); // unlogged today
      expect(days[5].status).toBe('skipped');
      expect(days[4].status).toBe('completed');
      expect(days[3].status).toBe('missed'); // older unlogged days are marked missed
    });
  });

  describe('calculateConsistencyScore', () => {
    it('calculates reproducible score between 0 and 100', () => {
      const logs: HabitLog[] = [
        makeLog('2026-10-03', 'completed'),
        makeLog('2026-10-04', 'completed'),
        makeLog('2026-10-05', 'completed'),
        makeLog('2026-10-06', 'completed'),
        makeLog('2026-10-07', 'completed'),
        makeLog('2026-10-08', 'completed'),
        makeLog('2026-10-09', 'completed'),
      ];
      const result = calculateConsistencyScore(logs, '2026-10-09', 7);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.completionRateScore).toBe(40); // 100% completion
      expect(result.recent7DayScore).toBe(30);
    });
  });

  describe('Weekly Recovery Tokens', () => {
    it('identifies calendar week Monday correctly', () => {
      // 2026-10-09 is a Friday -> Monday is 2026-10-05
      expect(getWeekStartMonday('2026-10-09')).toBe('2026-10-05');
      // 2026-10-11 is a Sunday -> Monday is 2026-10-05
      expect(getWeekStartMonday('2026-10-11')).toBe('2026-10-05');
      // 2026-10-12 is Monday -> Monday is 2026-10-12
      expect(getWeekStartMonday('2026-10-12')).toBe('2026-10-12');
    });

    it('allows recovery when token available == 1 or undefined', () => {
      expect(canUseRecoveryToken(1)).toBe(true);
      expect(canUseRecoveryToken(undefined)).toBe(true);
      expect(canUseRecoveryToken(0)).toBe(false);
    });
  });
});
