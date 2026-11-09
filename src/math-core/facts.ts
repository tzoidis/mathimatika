// The number facts of the fluency round and the garden (PRD §6). Which exist depends on
// what the class has reached; a child is never drilled on something not yet taught.

import { check, type Verdict } from './check.ts';
import { parseNumber } from './format.ts';
import { given, nOffByOne } from './generators/number.ts';
import type { MisconceptionDetector } from './generators/types.ts';
import { ratio, type Rational } from './rational.ts';

export interface Fact {
  op: '+' | '-';
  a: number;
  b: number;
}

/** Fewer than this and a fluency round would just repeat itself. */
export const MIN_FLUENCY_FACTS = 5;

export const factAnswer = (f: Fact): number => (f.op === '+' ? f.a + f.b : f.a - f.b);
export const factId = (f: Fact): string => ['fact:', f.a, f.op, f.b].join('');

function additions(maxSum: number): Fact[] {
  const facts: Fact[] = [];
  for (let a = 1; a < maxSum; a++) for (let b = 1; a + b <= maxSum; b++) facts.push({ op: '+', a, b });
  return facts;
}

function subtractions(maxWhole: number): Fact[] {
  const facts: Fact[] = [];
  for (let a = 2; a <= maxWhole; a++) for (let b = 1; b < a; b++) facts.push({ op: '-', a, b });
  return facts;
}

/** The facts open to a class that has reached these generators. */
export function availableFacts(generatorIds: readonly string[]): Fact[] {
  const has = (id: string) => generatorIds.includes(id);
  const adds = has('add.to10') ? additions(10) : has('add.to5') ? additions(5) : [];
  const subs = has('sub.large') ? subtractions(10) : [];
  return [...adds, ...subs];
}

export const FACT_DETECTORS: MisconceptionDetector<Fact>[] = [
  {
    code: 'OFF_BY_ONE',
    hintId: 'count-from-next',
    simulate: (f) => (f.op === '+' && factAnswer(f) > 1 ? ratio(factAnswer(f) - 1) : null),
    detect: (f, a) => f.op === '+' && given(factAnswer(f) - 1, a),
  },
  {
    code: 'OPERATION_SWAP',
    hintId: 'putting-together',
    simulate: (f) => (f.op === '+' && f.a !== f.b ? ratio(Math.abs(f.a - f.b)) : null),
    detect: (f, a) => f.op === '+' && f.a !== f.b && given(Math.abs(f.a - f.b), a),
  },
  {
    code: 'OPERATION_SWAP',
    hintId: 'taking-away',
    simulate: (f) => (f.op === '-' ? ratio(f.a + f.b) : null),
    detect: (f, a) => f.op === '-' && given(f.a + f.b, a),
  },
  { ...nOffByOne<Fact>(factAnswer, 'count-again'), simulate: (f) => (f.op === '-' ? ratio(factAnswer(f) + 1) : null), detect: (f, a) => f.op === '-' && (given(factAnswer(f) + 1, a) || given(factAnswer(f) - 1, a)) },
];

export function gradeFact(fact: Fact, input: string): Verdict {
  const answer: Rational = ratio(factAnswer(fact));
  const verdict = check(input, answer, { equality: 'value' });
  const value = parseNumber(input);
  if (verdict.ok || !value) return verdict;
  const found = FACT_DETECTORS.find((d) => d.detect(fact, value));
  return found ? { ok: false, code: found.code, hintId: found.hintId } : verdict;
}
