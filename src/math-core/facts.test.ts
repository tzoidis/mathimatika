import { describe, expect, it } from 'vitest';
import { availableFacts, FACT_DETECTORS, factAnswer, factId, gradeFact, type Fact } from './facts.ts';
import { formatNumber } from './format.ts';
import { equals, ratio } from './rational.ts';

const ALL = availableFacts(['add.to5', 'add.to10', 'sub.small', 'sub.large']);

describe('which facts are open', () => {
  it('has none before addition is taught', () => {
    expect(availableFacts(['count.to5'])).toEqual([]);
  });

  it('opens sums to 5, then to 10, and subtraction last', () => {
    expect(availableFacts(['add.to5'])).toHaveLength(10);
    expect(availableFacts(['add.to5', 'add.to10'])).toHaveLength(45);
    expect(availableFacts(['add.to5', 'add.to10', 'sub.small'])).toHaveLength(45);
    expect(ALL).toHaveLength(45 + 45);
  });

  it('never has a zero, a negative answer or a sum past ten', () => {
    for (const f of ALL) {
      expect(f.a).toBeGreaterThan(0);
      expect(f.b).toBeGreaterThan(0);
      expect(factAnswer(f)).toBeGreaterThan(0);
      expect(factAnswer(f)).toBeLessThanOrEqual(10);
    }
  });

  it('gives every fact its own id', () => {
    expect(new Set(ALL.map(factId)).size).toBe(ALL.length);
    expect(factId({ op: '+', a: 3, b: 4 })).toBe('fact:3+4');
  });
});

describe.each(ALL.map((f) => [factId(f), f] as [string, Fact]))('%s', (_id, fact) => {
  it('accepts the right answer, and no detector fires on it', () => {
    expect(gradeFact(fact, formatNumber(factAnswer(fact)))).toEqual({ ok: true });
    for (const d of FACT_DETECTORS) expect(d.detect(fact, ratio(factAnswer(fact)))).toBe(false);
  });

  it('catches what its simulators make', () => {
    for (const d of FACT_DETECTORS) {
      const wrong = d.simulate(fact);
      if (!wrong) continue;
      expect(equals(wrong, ratio(factAnswer(fact)))).toBe(false);
      expect(d.detect(fact, wrong)).toBe(true);
      expect(gradeFact(fact, formatNumber(wrong)).ok).toBe(false);
    }
  });
});

describe('naming the mistake', () => {
  const add: Fact = { op: '+', a: 5, b: 3 };
  const sub: Fact = { op: '-', a: 7, b: 2 };

  it('knows these', () => {
    expect(gradeFact(add, '7')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'count-from-next' });
    expect(gradeFact(add, '2')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'putting-together' });
    expect(gradeFact(sub, '9')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'taking-away' });
    expect(gradeFact(sub, '4')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'count-again' });
  });

  it('has no diagnosis for anything else', () => {
    expect(gradeFact(add, '1')).toEqual({ ok: false });
    expect(gradeFact(add, '')).toEqual({ ok: false });
  });
});
