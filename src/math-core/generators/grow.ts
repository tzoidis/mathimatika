// Grade 1, chapters 52-55: the numbers before and after, equal groups (the first
// multiplication, as «three times five»), measuring with paper clips, and adding and
// taking away whole tens.

import { randInt } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio, type Rational } from '../rational.ts';
import { given, nOffByOne } from './number.ts';
import type { GenCtx, Generator, MisconceptionDetector } from './types.ts';

const TEN = 10;

const mistake = (value: number, right: number): Rational | null => (value === right || value < 1 ? null : ratio(value));

const detector = <P>(code: MisconceptionDetector<P>['code'], hintId: string | undefined, wrong: (p: P) => number | null, right: (p: P) => number): MisconceptionDetector<P> => ({
  code,
  hintId,
  simulate: (p) => {
    const w = wrong(p);
    return w === null ? null : mistake(w, right(p));
  },
  detect: (p, a) => {
    const w = wrong(p);
    return w !== null && w !== right(p) && given(w, a);
  },
});

// ---------- before and after (ch. 52, the odometer) ----------

export interface NeighbourParams {
  n: number;
  direction: 1 | -1;
}

const neighbour = (p: NeighbourParams) => p.n + p.direction;

export function neighbourGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<NeighbourParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      // from level 2 the tens change more often: 59 → 60, 60 → 59
      const edge = level >= 2 && randInt(0, 1, rng) === 1;
      const direction = randInt(0, 1, rng) === 1 ? 1 : -1;
      const tens = randInt(Math.floor(lo / TEN), Math.floor(hi / TEN), rng) * TEN;
      return { n: edge ? (direction === 1 ? tens - 1 : tens) : randInt(lo, hi, rng), direction };
    },
    constraints: [(p) => p.n >= lo && p.n <= hi, (p) => neighbour(p) >= lo - 1 && neighbour(p) <= hi + 1],
    key: (p) => [id, p.n, p.direction].join(':'),
    build: (p) => ({
      answer: ratio(neighbour(p)),
      scene: { kind: 'neighbour', n: p.n, direction: p.direction },
      say: [{ number: p.n }, { instruction: p.direction === 1 ? 'line-next' : 'line-previous' }],
    }),
    detectors: [
      detector('WRONG_DIRECTION', 'line-direction', (p) => p.n - p.direction, neighbour),
      // 59 → 50: the units start again but the ten stays; 60 → 69
      detector('CARRY_FORGOTTEN', 'next-ten', (p) => (p.direction === 1 && p.n % TEN === 9 ? p.n - 9 : p.direction === -1 && p.n % TEN === 0 ? p.n + 9 : null), neighbour),
    ],
  };
}

// ---------- equal groups (ch. 53) ----------

export interface TimesParams {
  /** how many groups */
  n: number;
  /** how many in each */
  k: number;
  /** 1: groups and the sum · 2: groups only · 3: the sum only */
  show: 1 | 2 | 3;
}

const timesRight = (p: TimesParams) => p.n * p.k;

export function timesGenerator(id: string, skill: SkillId, sizes: readonly number[], maxGroups: number, maxTotal: number): Generator<TimesParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ n: randInt(2, maxGroups, rng), k: sizes[randInt(0, sizes.length - 1, rng)]!, show: level as 1 | 2 | 3 }),
    constraints: [(p) => sizes.includes(p.k), (p) => p.n >= 2 && p.n <= maxGroups, (p) => timesRight(p) <= maxTotal],
    key: (p) => [id, p.n, p.k].join(':'),
    build: (p) => ({
      answer: ratio(timesRight(p)),
      scene: { kind: 'times', n: p.n, k: p.k, show: p.show },
      // «τρεις φορές το πέντε»: φορές is feminine
      say: [{ number: p.n, gender: 'f' }, { instruction: 'times' }, { number: p.k }, { instruction: 'add' }],
    }),
    detectors: [
      detector('MULT_AS_ADD', 'equal-groups', (p) => p.n + p.k, timesRight),
      detector('COUNTED_GROUPS', 'equal-groups', (p) => p.n, timesRight),
      // a group too many or too few
      {
        code: 'OFF_BY_ONE',
        hintId: 'equal-groups',
        simulate: (p) => ratio(timesRight(p) + p.k),
        detect: (p, a) => given(timesRight(p) + p.k, a) || given(timesRight(p) - p.k, a),
      },
    ],
  };
}

// ---------- measuring with paper clips (ch. 54) ----------

export interface MeasureParams {
  /** the object, in clips */
  length: number;
  /** clips past its end (level 2): count only up to the end */
  extra: number;
  /** a second, shorter object (level 3): how many clips longer is the first? */
  other: number | null;
  /** 0 pencil, 1 ribbon, 2 snake */
  object: number;
}

const measureRight = (p: MeasureParams) => (p.other === null ? p.length : p.length - p.other);

export function measureGenerator(id: string, skill: SkillId): Generator<MeasureParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const length = randInt(3, 9, rng);
      return { length, extra: level === 2 ? randInt(1, 3, rng) : 0, other: level === 3 ? randInt(2, length - 1, rng) : null, object: randInt(0, 2, rng) };
    },
    constraints: [(p) => p.length >= 3 && p.length <= 9, (p) => p.length + p.extra <= 11, (p) => p.other === null || (p.other >= 2 && p.other < p.length)],
    key: (p) => [id, p.length, p.extra, p.other ?? ''].join(':'),
    build: (p) => ({
      answer: ratio(measureRight(p)),
      scene: { kind: 'measure', length: p.length, extra: p.extra, other: p.other, object: p.object },
      say: [{ instruction: p.other === null ? 'measure' : 'measure-longer' }],
    }),
    detectors: [
      detector('MEASURED_PAST_END', 'measure-to-end', (p) => (p.extra > 0 ? p.length + p.extra : null), measureRight),
      detector('PART_IS_WHOLE', 'how-much-longer', (p) => (p.other === null ? null : p.length), measureRight),
      detector('ADDED_PARTS', 'how-much-longer', (p) => (p.other === null ? null : p.length + p.other), measureRight),
      nOffByOne(measureRight, 'count-again'),
    ],
  };
}

// ---------- whole tens (ch. 55) ----------

export interface TensCalcParams {
  a: number;
  /** always whole tens */
  b: number;
  op: 1 | -1;
  /** €10 notes under the sum, at level 1 */
  notes: boolean;
}

const tensRight = (p: TensCalcParams) => p.a + p.op * p.b;

export function tensCalcGenerator(id: string, skill: SkillId, max: number): Generator<TensCalcParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      // levels 1-2: tens and tens; level 3: 34 + 20
      const a = level < 3 ? randInt(1, max / TEN - 1, rng) * TEN : randInt(11, max - TEN, rng);
      return { a, b: randInt(1, 5, rng) * TEN, op: randInt(0, 1, rng) === 1 ? 1 : -1, notes: level === 1 };
    },
    constraints: [(p) => p.b % TEN === 0 && p.b >= TEN, (p) => tensRight(p) >= TEN && tensRight(p) <= max, (p) => !p.notes || p.a % TEN === 0],
    key: (p) => [id, p.a, p.op, p.b].join(':'),
    build: (p) => ({
      answer: ratio(tensRight(p)),
      scene: { kind: 'tensCalc', a: p.a, b: p.b, op: p.op, notes: p.notes },
      say: [{ number: p.a }, { instruction: p.op === 1 ? 'and' : 'minus' }, { number: p.b }, { instruction: p.op === 1 ? 'add' : 'subtract' }],
    }),
    detectors: [
      // 20 + 30 = 5: the tens counted as ones
      detector('PLACE_VALUE', 'tens-worth', (p) => (tensRight(p) % TEN === 0 ? tensRight(p) / TEN : null), tensRight),
      // 34 + 20 = 36: the two went on the units
      detector('PLACE_VALUE', 'tens-worth', (p) => (p.a % TEN === 0 ? null : p.a + (p.op * p.b) / TEN), tensRight),
      detector('OPERATION_SWAP', undefined, (p) => p.a - p.op * p.b, tensRight),
    ],
  };
}
