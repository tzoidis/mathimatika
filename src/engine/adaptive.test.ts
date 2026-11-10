import { describe, expect, it } from 'vitest';
import { addDays, dayNumber, isDue, isNew, progressBySkill, reasonFor, skillProgress } from './adaptive.ts';
import type { AnswerLog, SkillId } from './types.ts';

const SKILL = '1.add.within5' as SkillId;
const DAY = 86_400_000;
/** day 0 is 2026-01-01 */
const dateOf = (ts: number) => addDays('2026-01-01', Math.floor(ts / DAY));

let n = 0;
const a = (day: number, correct: boolean, more: Partial<AnswerLog> = {}): AnswerLog => ({
  id: String(++n),
  childId: 'c',
  ts: day * DAY + n,
  exerciseId: 'add.to5',
  itemId: 'add.to5:2:3',
  target: '5',
  given: correct ? '5' : '4',
  correct,
  attempt: 1,
  soundsRight: false,
  usedListen: false,
  latencyMs: 1000,
  position: 0,
  ...more,
});
const day = (d: number, results: boolean[]) => results.map((r) => a(d, r));
const progress = (answers: AnswerLog[]) => skillProgress(SKILL, answers, dateOf);

describe('days', () => {
  it('counts across months and years', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(dayNumber('2027-01-02') - dayNumber('2026-12-30')).toBe(3);
  });
});

describe('stages', () => {
  it('starts concrete', () => {
    expect(progress([]).stage).toBe(1);
    expect(progress([]).state).toBe('notStarted');
  });

  it('rises after 4 of 5 right on two different days, not on one', () => {
    const good = [true, true, false, true, true];
    expect(progress([...day(0, good), ...day(0, good)]).stage).toBe(1);
    expect(progress([...day(0, good), ...day(1, good)]).stage).toBe(2);
    expect(progress([...day(0, good), ...day(1, good), ...day(2, good), ...day(3, good)]).stage).toBe(3);
  });

  it('falls after two misses in a row, and not after one', () => {
    const up = [...day(0, [true, true, true, true, true]), ...day(1, [true, true, true, true, true])];
    expect(progress([...up, ...day(2, [false, true, false])]).stage).toBe(2);
    expect(progress([...up, ...day(2, [false, false])]).stage).toBe(1);
  });

  it('ignores second attempts', () => {
    const secondTries = day(0, [false, false, false]).map((x) => ({ ...x, attempt: 2 as const }));
    expect(progress(secondTries).attempts).toBe(0);
  });

  it('does not care how fast', () => {
    const slow = [...day(0, Array(5).fill(true)), ...day(1, Array(5).fill(true))].map((x) => ({ ...x, latencyMs: 90_000 }));
    expect(progress(slow).stage).toBe(2);
  });
});

describe('the review queue', () => {
  it('is due a day after the first practice', () => {
    const p = progress(day(0, [true]));
    expect(p.dueDay).toBe('2026-01-02');
    expect(isDue(p, '2026-01-01')).toBe(false);
    expect(isDue(p, '2026-01-02')).toBe(true);
  });

  it('spaces out 1, 3, 7, 14, 30 with clean days', () => {
    const due = (days: number[]) => progress(days.flatMap((d) => day(d, [true]))).dueDay;
    expect(due([0])).toBe(addDays('2026-01-01', 1));
    expect(due([0, 1])).toBe(addDays('2026-01-01', 1 + 3));
    expect(due([0, 1, 4])).toBe(addDays('2026-01-01', 4 + 7));
    expect(due([0, 1, 4, 11, 25, 55])).toBe(addDays('2026-01-01', 55 + 30));
  });

  it('starts again from one day after a miss', () => {
    expect(progress([...day(0, [true]), ...day(1, [true]), ...day(4, [true, false])]).dueDay).toBe(addDays('2026-01-01', 5));
  });
});

describe('the four states', () => {
  const toSymbolic = [0, 1, 2, 3].flatMap((d) => day(d, Array(5).fill(true)));

  it('says practising, then stabilising at the symbolic stage', () => {
    expect(progress(day(0, [true])).state).toBe('practising');
    expect(progress(toSymbolic).state).toBe('stabilising');
  });

  it('says mastered only after three symbolic days with a week between two of them', () => {
    expect(progress([...toSymbolic, ...day(4, [true]), ...day(5, [true]), ...day(6, [true])]).state).toBe('stabilising');
    expect(progress([...toSymbolic, ...day(4, [true]), ...day(5, [true]), ...day(13, [true])]).state).toBe('mastered');
  });
});

describe('what the parent sees', () => {
  it('counts help as a miss on the first try', () => {
    const p = progress(day(0, [true, false, true, false]));
    expect([p.attempts, p.helped, p.days]).toEqual([4, 2, 1]);
  });

  it('names the usual mistake with its latest example, once it has happened twice', () => {
    const once = progress([a(0, false, { code: 'DIGIT_REVERSAL', given: '31', target: '13' })]);
    expect(once.dominant).toBeNull();
    const twice = progress([a(0, false, { code: 'DIGIT_REVERSAL', given: '41', target: '14' }), a(0, false, { code: 'OFF_BY_ONE' }), a(1, false, { code: 'DIGIT_REVERSAL', given: '31', target: '13' })]);
    expect(twice.dominant).toEqual({ code: 'DIGIT_REVERSAL', given: '31', target: '13' });
  });

  it('keeps skills apart and leaves out unknown exercises', () => {
    const answers = [a(0, true), a(0, true, { exerciseId: 'count.to5' }), a(0, true, { exerciseId: 'fluency' })];
    const map = progressBySkill(answers, (id) => ({ 'add.to5': SKILL, 'count.to5': '1.num.count.to5' as SkillId })[id], dateOf);
    expect([...map.keys()].sort()).toEqual(['1.add.within5', '1.num.count.to5']);
  });

  it('gives a reason for what comes next', () => {
    const today = '2026-01-10';
    const fresh = progress(day(8, [true]));
    const old = progress([...day(0, [true]), ...day(1, [true]), ...day(2, [true])]);
    expect(reasonFor(old, { focus: true, current: false, today })).toEqual({ kind: 'focus' });
    expect(reasonFor(undefined, { focus: false, current: true, today })).toEqual({ kind: 'notStarted' });
    expect(reasonFor(fresh, { focus: false, current: true, today })).toEqual({ kind: 'new' });
    expect(reasonFor(old, { focus: false, current: false, today })).toEqual({ kind: 'due', days: 7 });
    expect(isNew(old)).toBe(false);
  });
});
