// The first three generators: how many, addition, number houses (PRD §5).

import { randInt, shuffle } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { equals, ratio, type Rational } from '../rational.ts';
import type { GenCtx, Generator, MisconceptionDetector } from './types.ts';

const given = (value: number, answer: Rational) => equals(ratio(value), answer);

/** A wrong answer of `value`, unless that is no mistake at all here. */
const mistake = (value: number, right: number): Rational | null => (value === right || value < 1 ? null : ratio(value));

const nOffByOne = <P>(right: (p: P) => number, hintId?: string): MisconceptionDetector<P> => ({
  code: 'OFF_BY_ONE',
  hintId,
  simulate: (p) => mistake(right(p) + 1, right(p)),
  detect: (p, a) => given(right(p) + 1, a) || given(right(p) - 1, a),
});

// ---------- how many ----------

export interface CountParams {
  n: number;
  arrangement: 'frames' | 'rows' | 'scattered';
  /** where each dot sits, when scattered */
  cells: number[];
}

/** Cells in a scattered picture: 6 × 4, so 20 dots still leave gaps. */
const SCATTER_CELLS = 24;

/** The digits of a teen number the other way round: 13 → 31. */
function reversedTeen(n: number): number | null {
  const units = n % 10;
  return n > 10 && n < 20 && units !== 1 ? units * 10 + 1 : null;
}

export function countGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<CountParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const n = randInt(lo, hi, rng);
      const arrangement = level === 1 ? 'frames' : level === 2 ? 'rows' : 'scattered';
      const everyCell = Array.from({ length: SCATTER_CELLS }, (_, i) => i);
      return { n, arrangement, cells: arrangement === 'scattered' ? shuffle(everyCell, rng).slice(0, n).sort((a, b) => a - b) : [] };
    },
    constraints: [(p) => p.n >= lo && p.n <= hi, (p) => p.arrangement !== 'scattered' || new Set(p.cells).size === p.n],
    key: (p) => [id, p.n].join(':'),
    build: (p) => ({
      answer: ratio(p.n),
      scene: { kind: 'count', n: p.n, arrangement: p.arrangement, cells: p.cells },
      say: [{ instruction: 'count-how-many' }],
    }),
    detectors: [
      {
        code: 'DIGIT_REVERSAL',
        hintId: 'teen-digits',
        simulate: (p) => {
          const reversed = reversedTeen(p.n);
          return reversed === null ? null : ratio(reversed);
        },
        detect: (p, a) => {
          const reversed = reversedTeen(p.n);
          return reversed !== null && given(reversed, a);
        },
      },
      nOffByOne((p) => p.n, 'count-again'),
    ],
  };
}

// ---------- addition ----------

export interface AddParams {
  a: number;
  b: number;
  dots: boolean;
}

export function addGenerator(id: string, skill: SkillId, minSum: number, maxSum: number): Generator<AddParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      // +0 is left out: trivial, and not what the skill is about (PRD §9)
      const sum = randInt(minSum, maxSum, rng);
      const a = randInt(1, sum - 1, rng);
      return { a, b: sum - a, dots: level < 3 };
    },
    constraints: [(p) => p.a >= 1 && p.b >= 1, (p) => p.a + p.b >= minSum && p.a + p.b <= maxSum],
    key: (p) => [id, p.a, p.b].join(':'),
    build: (p) => ({
      answer: ratio(p.a + p.b),
      scene: { kind: 'add', a: p.a, b: p.b, dots: p.dots },
      say: [{ number: p.a }, { instruction: 'and' }, { number: p.b }, { instruction: 'add' }],
    }),
    detectors: [
      {
        // 5 + 3 = 7: said «five» while touching the first of the three
        code: 'OFF_BY_ONE',
        hintId: 'count-from-next',
        simulate: (p) => mistake(p.a + p.b - 1, p.a + p.b),
        detect: (p, a) => given(p.a + p.b - 1, a),
      },
      {
        code: 'OPERATION_SWAP',
        hintId: 'putting-together',
        simulate: (p) => mistake(Math.abs(p.a - p.b), p.a + p.b),
        detect: (p, a) => p.a !== p.b && given(Math.abs(p.a - p.b), a),
      },
    ],
  };
}

// ---------- number houses ----------

export interface HouseParams {
  whole: number;
  known: number;
  missingOnRight: boolean;
  dots: boolean;
}

export function houseGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<HouseParams> {
  const missing = (p: HouseParams) => p.whole - p.known;
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const whole = randInt(lo, hi, rng);
      return { whole, known: randInt(1, whole - 1, rng), missingOnRight: randInt(0, 1, rng) === 1, dots: level === 1 };
    },
    constraints: [(p) => p.whole >= lo && p.whole <= hi, (p) => p.known >= 1 && p.known < p.whole],
    key: (p) => [id, p.whole, p.known].join(':'),
    build: (p) => ({
      answer: ratio(missing(p)),
      scene: { kind: 'house', whole: p.whole, known: p.known, missingOnRight: p.missingOnRight, dots: p.dots },
      say: [{ instruction: 'number-house' }],
    }),
    detectors: [
      {
        code: 'PART_IS_WHOLE',
        hintId: 'house-parts',
        simulate: (p) => ratio(p.whole),
        detect: (p, a) => given(p.whole, a),
      },
      {
        code: 'ADDED_PARTS',
        hintId: 'house-parts',
        simulate: (p) => ratio(p.whole + p.known),
        detect: (p, a) => given(p.whole + p.known, a),
      },
      nOffByOne(missing),
    ],
  };
}
