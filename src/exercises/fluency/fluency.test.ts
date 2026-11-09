import { describe, expect, it } from 'vitest';
import { noteAt } from '../../audio/melody.ts';
import { mulberry32 } from '../../engine/rng.ts';
import { isFluencySession, QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import { availableFacts, factAnswer, factId, MIN_FLUENCY_FACTS } from '../../math-core/facts.ts';
import { GENERATORS } from '../../math-core/generators/index.ts';
import { exerciseForRound } from '../registry.ts';
import { planFacts } from './generate.ts';

const SEEDS = 500;
const onlyAdd = availableFacts(['add.to5']);
const withSub = availableFacts(['add.to5', 'add.to10', 'sub.small', 'sub.large']);

describe('planning a fluency round', () => {
  it('has five different facts, all of them open', () => {
    for (const facts of [onlyAdd, withSub]) {
      const open = new Set(facts.map(factId));
      for (let seed = 0; seed < SEEDS; seed++) {
        const plan = planFacts(facts, mulberry32(seed)).map(factId);
        expect(plan).toHaveLength(QUESTIONS_PER_ROUND);
        expect(new Set(plan).size).toBe(QUESTIONS_PER_ROUND);
        for (const id of plan) expect(open.has(id), id).toBe(true);
      }
    }
  });

  it('has no subtraction before it is open', () => {
    for (let seed = 0; seed < SEEDS; seed++) expect(planFacts(onlyAdd, mulberry32(seed)).every((f) => f.op === '+')).toBe(true);
  });

  it('shows a fact next to its relations once subtraction is open', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const [first, second, third, fourth] = planFacts(withSub, mulberry32(seed));
      expect(second).toEqual({ op: '+', a: first!.b, b: first!.a });
      const whole = factAnswer(first!);
      expect(third).toEqual({ op: '-', a: whole, b: first!.a });
      expect(fourth).toEqual({ op: '-', a: whole, b: first!.b });
    }
  });

  it('is the same for the same seed', () => {
    expect(planFacts(withSub, mulberry32(9))).toEqual(planFacts(withSub, mulberry32(9)));
  });
});

describe('when it plays', () => {
  const generators = GENERATORS.filter((g) => g.id === 'add.to5');

  it('takes only the third round, and only when asked', () => {
    expect(exerciseForRound('mix', generators, true).module.id).toBe('fluency');
    expect(exerciseForRound('warmup', generators, true).module.id).toBe('question');
    expect(exerciseForRound('workshop', generators, true).module.id).toBe('question');
    expect(exerciseForRound('mix', generators, false).module.id).toBe('question');
  });

  it('never replaces the placeholder with nothing to practise', () => {
    expect(exerciseForRound('mix', [], false).module.id).toBe('placeholder');
  });

  it('comes every other session', () => {
    // the third round of a session starts with 2 rounds of that session already played
    expect(isFluencySession(2)).toBe(true);
    expect(isFluencySession(5)).toBe(false);
    expect(isFluencySession(8)).toBe(true);
  });

  it('needs enough facts to be worth playing', () => {
    expect(onlyAdd.length).toBeGreaterThanOrEqual(MIN_FLUENCY_FACTS);
  });
});

describe('the tune', () => {
  it('has a note for any number of right answers', () => {
    for (let i = 0; i < 40; i++) expect(noteAt(i)).toBeGreaterThan(0);
  });
});
