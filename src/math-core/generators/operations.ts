// Part two of grade 1 up to chapter 32: quantities, the jar, the balance, subtraction,
// counting to 50, ordinals and money.

import { pick, randInt, shuffle } from '../../engine/rng.ts';
import type { Level, SkillId } from '../../engine/types.ts';
import { formatNumber } from '../format.ts';
import { ratio, type Rational } from '../rational.ts';
import { given, nOffByOne } from './number.ts';
import type { Choice, GenCtx, Generator } from './types.ts';

const mistake = (value: number, right: number): Rational | null => (value === right || value < 1 ? null : ratio(value));

// ---------- which has more ----------

export interface QuantityParams {
  left: number;
  right: number;
  ask: 'more' | 'less';
  /** PRD §7: the side with fewer gets the big dots, so size cannot give the answer */
  bigSide: 'left' | 'right' | null;
  minGap: number;
}

const LEFT = -1;
const RIGHT = 1;
const quantityAnswer = (p: QuantityParams) => (p.ask === 'more' === p.left > p.right ? LEFT : RIGHT);
const gapFor = (level: Level) => (level === 1 ? 3 : level === 2 ? 2 : 1);

export function quantityGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<QuantityParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const left = randInt(lo, hi, rng);
      const right = randInt(lo, hi, rng);
      return { left, right, ask: pick(['more', 'less'] as const, rng), bigSide: level === 1 ? null : left < right ? 'left' : 'right', minGap: gapFor(level) };
    },
    constraints: [(p) => p.left !== p.right, (p) => Math.abs(p.left - p.right) >= Math.min(p.minGap, hi - lo)],
    key: (p) => [id, p.left, p.right, p.ask].join(':'),
    build: (p) => {
      const choices: Choice[] = [
        { label: formatNumber(p.left), value: LEFT },
        { label: formatNumber(p.right), value: RIGHT },
      ];
      return {
        answer: ratio(quantityAnswer(p)),
        scene: { kind: 'quantity', left: p.left, right: p.right, ask: p.ask, bigSide: p.bigSide },
        say: [{ instruction: p.ask === 'more' ? 'compare-more' : 'compare-less' }],
        answerMode: 'group',
        choices,
      };
    },
    detectors: [
      {
        code: 'SIZE_NOT_COUNT',
        hintId: 'size-not-count',
        simulate: (p) => (p.bigSide === null ? null : ratio(-quantityAnswer(p))),
        detect: (p, a) => p.bigSide !== null && given(-quantityAnswer(p), a),
      },
    ],
  };
}

// ---------- the estimation jar ----------

export interface JarParams {
  n: number;
  max: number;
  /** how far off still counts as a good estimate: closeness is what gets praised (PRD §5) */
  tolerance: number;
  cells: number[];
}

const JAR_CELLS = 24;

export function jarGenerator(id: string, skill: SkillId, lo: number, hi: number, max: number, tolerance: number): Generator<JarParams> {
  const close = (p: JarParams, a: Rational) => a.d === 1n && Math.abs(Number(a.n) - p.n) <= p.tolerance;
  return {
    id,
    skill,
    params({ rng }: GenCtx) {
      const n = randInt(lo, hi, rng);
      const every = Array.from({ length: JAR_CELLS }, (_, i) => i);
      return { n, max, tolerance, cells: shuffle(every, rng).slice(0, n).sort((a, b) => a - b) };
    },
    constraints: [(p) => p.n >= lo && p.n <= hi, (p) => p.cells.length === p.n],
    key: (p) => [id, p.n].join(':'),
    build: (p) => ({
      answer: ratio(p.n),
      scene: { kind: 'jar', n: p.n, max: p.max, cells: p.cells },
      say: [{ instruction: 'estimate' }],
      answerMode: 'numberLine',
    }),
    accept: close,
    detectors: [
      {
        code: 'LINE_POSITION',
        simulate: (p) => ratio(p.n + p.tolerance + 1),
        detect: (p, a) => !close(p, a),
      },
    ],
  };
}

// ---------- the balance and the missing part ----------

export interface MissingParams {
  a: number;
  total: number;
  dots: boolean;
}

const missingOf = (p: MissingParams) => p.total - p.a;

function missingBase(id: string, skill: SkillId, lo: number, hi: number): Pick<Generator<MissingParams>, 'id' | 'skill' | 'params' | 'constraints' | 'key'> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const total = randInt(lo, hi, rng);
      return { total, a: randInt(1, total - 1, rng), dots: level < 3 };
    },
    constraints: [(p) => p.total >= lo && p.total <= hi, (p) => p.a >= 1 && p.a < p.total],
    key: (p) => [id, p.a, p.total].join(':'),
  };
}

export function balanceGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<MissingParams> {
  return {
    ...missingBase(id, skill, lo, hi),
    build: (p) => ({
      answer: ratio(missingOf(p)),
      scene: { kind: 'balance', a: p.a, total: p.total },
      say: [{ instruction: 'balance' }],
      answerMode: 'balance',
    }),
    detectors: [
      { code: 'PART_IS_WHOLE', hintId: 'equals-balance', simulate: (p) => ratio(p.total), detect: (p, a) => given(p.total, a) },
      nOffByOne(missingOf, 'equals-balance'),
    ],
  };
}

export function missingGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<MissingParams> {
  return {
    ...missingBase(id, skill, lo, hi),
    build: (p) => ({
      answer: ratio(missingOf(p)),
      scene: { kind: 'missing', a: p.a, total: p.total, dots: p.dots },
      say: [{ number: p.a }, { instruction: 'and' }, { instruction: 'missing-addend' }],
    }),
    detectors: [
      { code: 'PART_IS_WHOLE', hintId: 'equals-balance', simulate: (p) => ratio(p.total), detect: (p, a) => given(p.total, a) },
      { code: 'ADDED_PARTS', hintId: 'equals-balance', simulate: (p) => ratio(p.total + p.a), detect: (p, a) => given(p.total + p.a, a) },
      nOffByOne(missingOf),
    ],
  };
}

// ---------- subtraction ----------

export interface SubParams {
  a: number;
  b: number;
  dots: boolean;
}

/** `pickB` is what tells the book's two chapters apart: taking away a little or a lot. */
export function subGenerator(id: string, skill: SkillId, lo: number, hi: number, pickB: (a: number, rng: () => number) => number, isRightSize: (p: SubParams) => boolean): Generator<SubParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const a = randInt(lo, hi, rng);
      return { a, b: pickB(a, rng), dots: level < 3 };
    },
    constraints: [(p) => p.a >= lo && p.a <= hi, (p) => p.b >= 1 && p.b < p.a, isRightSize],
    key: (p) => [id, p.a, p.b].join(':'),
    build: (p) => ({
      answer: ratio(p.a - p.b),
      scene: { kind: 'sub', a: p.a, b: p.b, dots: p.dots },
      say: [{ number: p.a }, { instruction: 'minus' }, { number: p.b }, { instruction: 'subtract' }],
    }),
    detectors: [
      { code: 'OPERATION_SWAP', hintId: 'taking-away', simulate: (p) => mistake(p.a + p.b, p.a - p.b), detect: (p, a) => given(p.a + p.b, a) },
      { code: 'PART_IS_WHOLE', hintId: 'taking-away', simulate: (p) => mistake(p.a, p.a - p.b), detect: (p, a) => given(p.a, a) },
      nOffByOne((p) => p.a - p.b, 'count-again'),
    ],
  };
}

// ---------- plus or minus ----------

export interface SignParams {
  a: number;
  b: number;
  operation: 1 | -1;
}

const SIGNS: Choice[] = [
  { label: '+', value: 1 },
  { label: '−', value: -1 },
];

export function signChoiceGenerator(id: string, skill: SkillId, max: number): Generator<SignParams> {
  const result = (p: SignParams) => p.a + p.operation * p.b;
  return {
    id,
    skill,
    params({ rng }: GenCtx) {
      const a = randInt(2, max - 1, rng);
      return { a, b: randInt(1, Math.min(a - 1, max - a), rng), operation: randInt(0, 1, rng) === 1 ? 1 : -1 };
    },
    constraints: [(p) => p.b >= 1 && p.b < p.a, (p) => p.a + p.b <= max],
    key: (p) => [id, p.a, p.b, p.operation].join(':'),
    build: (p) => ({
      answer: ratio(p.operation),
      scene: { kind: 'whichSign', a: p.a, b: p.b, result: result(p) },
      say: [{ instruction: 'compare-sign' }],
      answerMode: 'choice',
      choices: SIGNS,
    }),
    detectors: [
      {
        code: 'OPERATION_SWAP',
        hintId: 'taking-away',
        simulate: (p) => ratio(-p.operation),
        detect: (p, a) => given(-p.operation, a),
      },
    ],
  };
}

// ---------- counting to 50 ----------

export interface CountTensParams {
  n: number;
}

function reversedTwoDigit(n: number): number | null {
  const tens = Math.floor(n / 10);
  const units = n % 10;
  return units === 0 || units === tens ? null : units * 10 + tens;
}

export function countTensGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<CountTensParams> {
  return {
    id,
    skill,
    params: ({ rng }: GenCtx) => ({ n: randInt(lo, hi, rng) }),
    constraints: [(p) => p.n >= lo && p.n <= hi],
    key: (p) => [id, p.n].join(':'),
    build: (p) => ({
      answer: ratio(p.n),
      scene: { kind: 'count', n: p.n, arrangement: 'frames', cells: [] },
      say: [{ instruction: 'count-how-many' }],
    }),
    detectors: [
      {
        // no hint yet: the book only names tens and units at chapter 34
        code: 'DIGIT_REVERSAL',
        simulate: (p) => {
          const reversed = reversedTwoDigit(p.n);
          return reversed === null ? null : ratio(reversed);
        },
        detect: (p, a) => {
          const reversed = reversedTwoDigit(p.n);
          return reversed !== null && given(reversed, a);
        },
      },
      nOffByOne((p) => p.n, 'count-again'),
    ],
  };
}

// ---------- which floor ----------

export interface FloorParams {
  floor: number;
  floors: number;
}

export function floorGenerator(id: string, skill: SkillId, floors: number): Generator<FloorParams> {
  return {
    id,
    skill,
    params: ({ rng }: GenCtx) => ({ floor: randInt(1, floors, rng), floors }),
    constraints: [(p) => p.floor >= 1 && p.floor <= p.floors],
    key: (p) => [id, p.floor].join(':'),
    build: (p) => ({
      answer: ratio(p.floor),
      scene: { kind: 'floor', floor: p.floor, floors: p.floors },
      say: [{ instruction: 'floor-which' }],
    }),
    detectors: [
      {
        code: 'COUNTED_FROM_TOP',
        hintId: 'floors-up',
        simulate: (p) => mistake(p.floors + 1 - p.floor, p.floor),
        detect: (p, a) => p.floors + 1 - p.floor !== p.floor && given(p.floors + 1 - p.floor, a),
      },
      nOffByOne((p) => p.floor, 'floors-up'),
    ],
  };
}

// ---------- money ----------

export type CoinUnit = 'euro' | 'cent';

export interface CoinsParams {
  coins: number[];
  unit: CoinUnit;
}

const COINS = [1, 2, 5];
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const unitOf = (rng: () => number): CoinUnit => (randInt(0, 1, rng) === 0 ? 'euro' : 'cent');

export function coinsGenerator(id: string, skill: SkillId, max: number): Generator<CoinsParams> {
  return {
    id,
    skill,
    params({ rng }: GenCtx) {
      const count = randInt(2, 4, rng);
      return { coins: Array.from({ length: count }, () => pick(COINS, rng)).sort((a, b) => b - a), unit: unitOf(rng) };
    },
    constraints: [(p) => sum(p.coins) <= max, (p) => p.coins.some((c) => c > 1)],
    key: (p) => [id, p.unit, ...p.coins].join(':'),
    build: (p) => ({
      answer: ratio(sum(p.coins)),
      scene: { kind: 'coins', coins: p.coins, unit: p.unit },
      say: [{ instruction: 'add' }],
    }),
    detectors: [
      {
        code: 'COUNTED_COINS',
        hintId: 'coin-value',
        simulate: (p) => mistake(p.coins.length, sum(p.coins)),
        detect: (p, a) => given(p.coins.length, a),
      },
      nOffByOne((p) => sum(p.coins)),
    ],
  };
}

export interface ExchangeParams {
  coin: number;
  unit: CoinUnit;
}

export function exchangeGenerator(id: string, skill: SkillId): Generator<ExchangeParams> {
  return {
    id,
    skill,
    params: ({ rng }: GenCtx) => ({ coin: pick([2, 5, 10], rng), unit: unitOf(rng) }),
    constraints: [(p) => p.coin > 1],
    key: (p) => [id, p.unit, p.coin].join(':'),
    build: (p) => ({
      answer: ratio(p.coin),
      scene: { kind: 'exchange', coin: p.coin, unit: p.unit },
      say: [{ instruction: 'money-exchange' }],
    }),
    detectors: [
      {
        code: 'COUNTED_COINS',
        hintId: 'coin-value',
        simulate: () => ratio(1),
        detect: (_p, a) => given(1, a),
      },
    ],
  };
}
