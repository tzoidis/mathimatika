import { describe, expect, it } from 'vitest';
import { factStages } from './garden.ts';
import type { AnswerLog } from './types.ts';

const DAY = 86_400_000;
const dateOf = (ts: number) => String(Math.floor(ts / DAY));

const answer = (itemId: string, day: number, correct: boolean, attempt: 1 | 2 = 1, latencyMs = 1000): AnswerLog => ({
  id: [itemId, day, attempt].join('-'),
  childId: 'c',
  ts: day * DAY + 5,
  exerciseId: 'fluency',
  itemId,
  target: '7',
  given: correct ? '7' : '6',
  correct,
  attempt,
  soundsRight: false,
  usedListen: false,
  latencyMs,
  position: 0,
});

const stage = (answers: AnswerLog[]) => factStages(answers, dateOf).get('fact:3+4');

describe('the garden', () => {
  it('leaves a fact a seed until it is right first time', () => {
    expect(stage([])).toBeUndefined();
    expect(stage([answer('fact:3+4', 1, false)])).toBeUndefined();
    expect(stage([answer('fact:3+4', 1, true, 2)])).toBeUndefined();
  });

  it('sprouts on the first success', () => {
    expect(stage([answer('fact:3+4', 1, true)])).toBe('sprout');
  });

  it('flowers only across different days', () => {
    expect(stage([answer('fact:3+4', 1, true), answer('fact:3+4', 1, true), answer('fact:3+4', 1, true)])).toBe('sprout');
    expect(stage([answer('fact:3+4', 1, true), answer('fact:3+4', 2, true), answer('fact:3+4', 3, true)])).toBe('flower');
  });

  it('never wilts after a miss', () => {
    expect(stage([answer('fact:3+4', 1, true), answer('fact:3+4', 2, true), answer('fact:3+4', 3, true), answer('fact:3+4', 4, false)])).toBe('flower');
  });

  it('does not care how fast', () => {
    const slow = [1, 2, 3].map((d) => answer('fact:3+4', d, true, 1, 60_000));
    const fast = [1, 2, 3].map((d) => answer('fact:3+4', d, true, 1, 200));
    expect(stage(slow)).toBe(stage(fast));
  });

  it('keeps facts apart', () => {
    const stages = factStages([answer('fact:3+4', 1, true), answer('fact:4+3', 1, false)], dateOf);
    expect(stages.get('fact:3+4')).toBe('sprout');
    expect(stages.has('fact:4+3')).toBe(false);
  });
});
