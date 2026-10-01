import assert from 'node:assert';
import test, { describe, it } from 'node:test';

// Format YYYY-MM-DD
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(dateStr, days) {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function getWeekStartMonday(dateStr) {
  const d = parseDate(dateStr);
  const dayOfWeek = d.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

function evaluateCompletionStatus(actualValue, targetValue) {
  if (actualValue >= targetValue) return 'completed';
  if (actualValue > 0) return 'partial';
  return 'missed';
}

function calculateCurrentStreak(logs, todayStr) {
  if (!logs || logs.length === 0) return 0;
  const logMap = new Map();
  for (const log of logs) {
    logMap.set(log.log_date, log);
  }

  let streak = 0;
  const todayLog = logMap.get(todayStr);
  let checkDate = todayStr;

  if (todayLog && (todayLog.status === 'completed' || todayLog.status === 'skipped')) {
    streak = 1;
    checkDate = addDays(todayStr, -1);
  } else {
    checkDate = addDays(todayStr, -1);
  }

  while (true) {
    const log = logMap.get(checkDate);
    if (!log) break;
    if (log.status === 'completed' || log.status === 'skipped') {
      streak += 1;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateBestStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  const uniqueDateMap = new Map();
  for (const l of logs) {
    uniqueDateMap.set(l.log_date, l);
  }
  const sortedDates = Array.from(uniqueDateMap.keys()).sort();
  if (sortedDates.length === 0) return 0;

  let bestStreak = 0;
  let currentRun = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const log = uniqueDateMap.get(dateStr);
    const isSuccess = log.status === 'completed' || log.status === 'skipped';
    if (isSuccess) {
      if (prevDate === null) {
        currentRun = 1;
      } else {
        const expectedNext = addDays(prevDate, 1);
        if (expectedNext === dateStr) {
          currentRun += 1;
        } else {
          currentRun = 1;
        }
      }
      prevDate = dateStr;
      if (currentRun > bestStreak) bestStreak = currentRun;
    } else {
      currentRun = 0;
      prevDate = null;
    }
  }
  return bestStreak;
}

function calculateSevenDayStatus(logs, todayStr) {
  const logMap = new Map();
  for (const l of logs) logMap.set(l.log_date, l);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const dateStr = addDays(todayStr, -i);
    const dateObj = parseDate(dateStr);
    const dayLabel = dayLabels[dateObj.getUTCDay()];
    const isToday = dateStr === todayStr;
    const log = logMap.get(dateStr);
    let status = 'missed';

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
      isToday,
    });
  }
  return result;
}

function calculateCompletionRate(logs) {
  if (!logs || logs.length === 0) return 0;
  const completedCount = logs.filter((l) => l.status === 'completed').length;
  return Math.round((completedCount / logs.length) * 100);
}

function calculateConsistencyScore(logs, todayStr, currentStreak) {
  if (!logs || logs.length === 0) {
    return {
      score: 0,
      completionRateScore: 0,
      recent7DayScore: 0,
      streakStabilityScore: 0,
      recoveryDisciplineScore: 0,
    };
  }

  const completionRatePercent = calculateCompletionRate(logs);
  const completionRateScore = Math.round((completionRatePercent / 100) * 40);

  const last7 = calculateSevenDayStatus(logs, todayStr);
  const successful7Days = last7.filter((d) => d.status === 'completed' || d.status === 'skipped').length;
  const evaluated7Days = last7.filter((d) => d.status !== 'pending').length;
  const recent7DayPercent = evaluated7Days > 0 ? Math.round((successful7Days / evaluated7Days) * 100) : 100;
  const recent7DayScore = Math.round((recent7DayPercent / 100) * 30);

  const streakStabilityScore = Math.min(20, Math.round((currentStreak / 14) * 20));

  const completedCount = logs.filter((l) => l.status === 'completed').length;
  const skippedCount = logs.filter((l) => l.status === 'skipped').length;
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
  };
}

describe('HabitOS Business Logic Tests', () => {
  const makeLog = (date, status, actual = 10) => ({
    id: `log-${date}`,
    habit_id: 'habit-1',
    user_id: 'user-1',
    log_date: date,
    actual_value: actual,
    status,
    source: 'manual',
  });

  it('1. Completion Status logic', () => {
    assert.strictEqual(evaluateCompletionStatus(10, 10), 'completed');
    assert.strictEqual(evaluateCompletionStatus(12, 10), 'completed');
    assert.strictEqual(evaluateCompletionStatus(7, 10), 'partial');
    assert.strictEqual(evaluateCompletionStatus(0, 10), 'missed');
  });

  it('2. Streak preserved with recovery token (5 days)', () => {
    const logs = [
      makeLog('2026-10-05', 'completed'),
      makeLog('2026-10-06', 'completed'),
      makeLog('2026-10-07', 'completed'),
      makeLog('2026-10-08', 'skipped'), // recovery used
      makeLog('2026-10-09', 'completed'),
    ];
    assert.strictEqual(calculateCurrentStreak(logs, '2026-10-09'), 5);
  });

  it('3. Streak reset on missed day without recovery (drops to 1)', () => {
    const logs = [
      makeLog('2026-10-05', 'completed'),
      makeLog('2026-10-06', 'completed'),
      makeLog('2026-10-07', 'completed'),
      makeLog('2026-10-08', 'missed'),
      makeLog('2026-10-09', 'completed'),
    ];
    assert.strictEqual(calculateCurrentStreak(logs, '2026-10-09'), 1);
  });

  it('4. Streak preserves yesterday if today pending', () => {
    const logs = [
      makeLog('2026-10-07', 'completed'),
      makeLog('2026-10-08', 'completed'),
    ];
    assert.strictEqual(calculateCurrentStreak(logs, '2026-10-09'), 2);
  });

  it('5. Best streak calculation', () => {
    const logs = [
      makeLog('2026-10-01', 'completed'),
      makeLog('2026-10-02', 'completed'),
      makeLog('2026-10-03', 'missed'),
      makeLog('2026-10-04', 'completed'),
      makeLog('2026-10-05', 'completed'),
      makeLog('2026-10-06', 'completed'),
      makeLog('2026-10-07', 'completed'),
    ];
    assert.strictEqual(calculateBestStreak(logs), 4);
  });

  it('6. Seven-day status returns 7 days ending today', () => {
    const logs = [
      makeLog('2026-10-07', 'completed'),
      makeLog('2026-10-08', 'skipped'),
    ];
    const days = calculateSevenDayStatus(logs, '2026-10-09');
    assert.strictEqual(days.length, 7);
    assert.strictEqual(days[6].date, '2026-10-09');
    assert.strictEqual(days[6].isToday, true);
    assert.strictEqual(days[6].status, 'pending');
    assert.strictEqual(days[5].status, 'skipped');
    assert.strictEqual(days[4].status, 'completed');
    assert.strictEqual(days[3].status, 'missed');
  });

  it('7. Consistency score formula (0-100)', () => {
    const logs = [
      makeLog('2026-10-03', 'completed'),
      makeLog('2026-10-04', 'completed'),
      makeLog('2026-10-05', 'completed'),
      makeLog('2026-10-06', 'completed'),
      makeLog('2026-10-07', 'completed'),
      makeLog('2026-10-08', 'completed'),
      makeLog('2026-10-09', 'completed'),
    ];
    const score = calculateConsistencyScore(logs, '2026-10-09', 7);
    assert(score.score >= 0 && score.score <= 100);
    assert.strictEqual(score.completionRateScore, 40);
    assert.strictEqual(score.recent7DayScore, 30);
  });

  it('8. Week start Monday calendar calculation', () => {
    assert.strictEqual(getWeekStartMonday('2026-10-09'), '2026-10-05');
    assert.strictEqual(getWeekStartMonday('2026-10-11'), '2026-10-05');
    assert.strictEqual(getWeekStartMonday('2026-10-12'), '2026-10-12');
  });
});
