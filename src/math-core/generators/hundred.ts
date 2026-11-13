// Grade 1, chapters 58-60: counting in tens to 100, money to 100 euro, sharing out
// equally, and which is heavier on the scale.

import { pick, randInt } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio, type Rational } from '../rational.ts';
import { given, nOffByOne } from './number.ts';
import type { Choice, GenCtx, Generator, MisconceptionDetector } from './types.ts';

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

// ---------- ten more, ten less (ch. 58) ----------

export interface TenStepParams {
  n: number;
  direction: 1 | -1;
}

const tenStep = (p: TenStepParams) => p.n + p.direction * TEN;

export function tenStepGenerator(id: string, skill: SkillId, max: number): Generator<TenStepParams> {
  return {
    id,
    skill,
    // level 1 from whole tens, as the book counts 10, 20, 30; then from any number
    params: ({ rng, level }: GenCtx) => ({ n: level === 1 ? randInt(1, max / TEN - 1, rng) * TEN : randInt(11, max - 1, rng), direction: randInt(0, 1, rng) === 1 ? 1 : -1 }),
    constraints: [(p) => tenStep(p) >= TEN && tenStep(p) <= max, (p) => p.n >= TEN],
    key: (p) => [id, p.n, p.direction].join(':'),
    build: (p) => ({
      answer: ratio(tenStep(p)),
      scene: { kind: 'tenStep', n: p.n, direction: p.direction },
      say: [{ number: p.n }, { instruction: p.direction === 1 ? 'ten-after' : 'ten-before' }],
    }),
    detectors: [
      // 47 → 48: one step instead of ten
      detector('PLACE_VALUE', 'tens-worth', (p) => p.n + p.direction, tenStep),
      detector('WRONG_DIRECTION', 'line-direction', (p) => p.n - p.direction * TEN, tenStep),
    ],
  };
}

// ---------- money to 100 euro (ch. 58) ----------

export interface WalletParams {
  /** banknotes, biggest first */
  notes: number[];
  /** euro coins */
  coins: number[];
}

const NOTES = [5, 10, 20, 50];
const EURO_COINS = [1, 2];
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
const walletTotal = (p: WalletParams) => sum(p.notes) + sum(p.coins);

export function walletGenerator(id: string, skill: SkillId, max: number): Generator<WalletParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      // level 1: tens only · level 2: any notes · level 3: notes and coins
      const pool = level === 1 ? [10, 20] : NOTES;
      const notes = Array.from({ length: randInt(2, level === 1 ? 4 : 3, rng) }, () => pick(pool, rng)).sort((a, b) => b - a);
      const coins = level === 3 ? Array.from({ length: randInt(1, 3, rng) }, () => pick(EURO_COINS, rng)).sort((a, b) => b - a) : [];
      return { notes, coins };
    },
    constraints: [(p) => walletTotal(p) <= max, (p) => p.notes.length >= 2],
    key: (p) => [id, ...p.notes, '|', ...p.coins].join(':'),
    build: (p) => ({
      answer: ratio(walletTotal(p)),
      scene: { kind: 'wallet', notes: p.notes, coins: p.coins },
      say: [{ instruction: 'money-total' }],
    }),
    detectors: [
      detector('COUNTED_COINS', 'coin-value', (p) => p.notes.length + p.coins.length, walletTotal),
      // added the notes and forgot the coins
      detector('TERM_MISSED', 'add-all', (p) => (p.coins.length > 0 ? sum(p.notes) : null), walletTotal),
      nOffByOne(walletTotal),
    ],
  };
}

// ---------- sharing out (ch. 59) ----------

export interface ShareParams {
  /** how many plates */
  k: number;
  /** how many on each, the answer */
  each: number;
  /** level 3: the things lie anywhere, not in rows */
  scattered: boolean;
}

const shareTotal = (p: ShareParams) => p.k * p.each;

export function shareGenerator(id: string, skill: SkillId): Generator<ShareParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ k: randInt(2, level === 1 ? 2 : 4, rng), each: randInt(2, level === 1 ? 4 : 5, rng), scattered: level === 3 }),
    constraints: [(p) => p.k >= 2 && p.k <= 4, (p) => p.each >= 2 && p.each <= 5, (p) => shareTotal(p) <= 20],
    key: (p) => [id, p.k, p.each].join(':'),
    build: (p) => ({
      answer: ratio(p.each),
      scene: { kind: 'share', total: shareTotal(p), plates: p.k, scattered: p.scattered },
      say: [{ instruction: 'share' }],
    }),
    detectors: [
      detector('PART_IS_WHOLE', 'share-fair', shareTotal, (p) => p.each),
      detector('COUNTED_GROUPS', 'share-fair', (p) => p.k, (p) => p.each),
      detector('OPERATION_SWAP', 'share-fair', (p) => shareTotal(p) - p.k, (p) => p.each),
    ],
  };
}

// ---------- heavier (ch. 60) ----------

export interface HeavierParams {
  /** the objects on the left and right pans */
  left: string;
  right: string;
  /** which pan is down */
  heavy: 'left' | 'right';
  /** from level 2 the lighter thing is drawn bigger, so size cannot give the answer */
  bigSide: 'left' | 'right' | null;
}

/** closed packages: what they look like says nothing about their weight */
export const SCALE_OBJECTS = ['parcel', 'sack'];
const LEFT = -1;
const RIGHT = 1;
const heavierAnswer = (p: HeavierParams) => (p.heavy === 'left' ? LEFT : RIGHT);

export function heavierGenerator(id: string, skill: SkillId): Generator<HeavierParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const left = pick(SCALE_OBJECTS, rng);
      const heavy = randInt(0, 1, rng) === 1 ? 'left' : 'right';
      return { left, right: pick(SCALE_OBJECTS.filter((o) => o !== left), rng), heavy, bigSide: level === 1 ? null : heavy === 'left' ? 'right' : 'left' };
    },
    constraints: [(p) => p.left !== p.right],
    key: (p) => [id, p.left, p.right, p.heavy].join(':'),
    build: (p) => {
      const choices: Choice[] = [
        { label: p.left, value: LEFT },
        { label: p.right, value: RIGHT },
      ];
      return {
        answer: ratio(heavierAnswer(p)),
        scene: { kind: 'heavier', left: p.left, right: p.right, heavy: p.heavy, bigSide: p.bigSide },
        say: [{ instruction: 'heavier' }],
        answerMode: 'heavier',
        choices,
      };
    },
    detectors: [
      {
        code: 'SIZE_NOT_WEIGHT',
        hintId: 'heavy-down',
        simulate: (p) => (p.bigSide === null ? null : ratio(-heavierAnswer(p))),
        detect: (p, a) => p.bigSide !== null && given(-heavierAnswer(p), a),
      },
      {
        code: 'WRONG_DIRECTION',
        hintId: 'heavy-down',
        simulate: (p) => (p.bigSide === null ? ratio(-heavierAnswer(p)) : null),
        detect: (p, a) => p.bigSide === null && given(-heavierAnswer(p), a),
      },
    ],
  };
}
