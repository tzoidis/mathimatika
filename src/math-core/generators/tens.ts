// Grade 1, chapters 33-42: collections in tens and fives, tens and units, tying ten
// cubes into a rod, sums of three numbers, adding through ten and the days of the week.

import { randInt, shuffle } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio, type Rational } from '../rational.ts';
import { given, nOffByOne, teenReversal } from './number.ts';
import type { GenCtx, Generator, MisconceptionDetector } from './types.ts';

const TEN = 10;
const FIVE = 5;

const mistake = (value: number, right: number): Rational | null => (value === right || value < 1 ? null : ratio(value));

/** 37 → 73; nothing for 30 or 33, where it would be no different mistake. */
export function reversedTwoDigit(n: number): number | null {
  const tens = Math.floor(n / TEN);
  const units = n % TEN;
  return tens === 0 || units === 0 || units === tens ? null : units * TEN + tens;
}

const reversal = <P>(n: (p: P) => number, hintId?: string): MisconceptionDetector<P> => ({
  code: 'DIGIT_REVERSAL',
  hintId,
  simulate: (p) => {
    const r = reversedTwoDigit(n(p));
    return r === null ? null : ratio(r);
  },
  detect: (p, a) => {
    const r = reversedTwoDigit(n(p));
    return r !== null && given(r, a);
  },
});

/** Counted each group as one thing: three rods and four cubes as 7. */
const countedGroups = <P>(groups: (p: P) => number, right: (p: P) => number): MisconceptionDetector<P> => ({
  code: 'COUNTED_GROUPS',
  hintId: 'tens-worth',
  simulate: (p) => mistake(groups(p), right(p)),
  detect: (p, a) => groups(p) !== right(p) && given(groups(p), a),
});

// ---------- a collection in tens and fives (ch. 33) ----------

export interface GroupsParams {
  /** each group in the order shown: 10, 5 or 1 */
  groups: number[];
}

const total = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

export function groupsGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<GroupsParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const n = randInt(lo, hi, rng);
      const units = n % TEN;
      // from level 2 a five is its own group, as on the book's abacus
      const fives = level >= 2 && units >= FIVE ? 1 : 0;
      const groups = [...Array<number>(Math.floor(n / TEN)).fill(TEN), ...Array<number>(fives).fill(FIVE), ...Array<number>(units - fives * FIVE).fill(1)];
      return { groups: level === 3 ? shuffle(groups, rng) : groups };
    },
    constraints: [(p) => total(p.groups) >= lo && total(p.groups) <= hi, (p) => p.groups.every((g) => g === TEN || g === FIVE || g === 1)],
    key: (p) => [id, total(p.groups), p.groups.includes(FIVE) ? 'five' : ''].join(':'),
    build: (p) => ({
      answer: ratio(total(p.groups)),
      scene: { kind: 'groups', groups: p.groups },
      say: [{ instruction: 'count-how-many' }],
    }),
    detectors: [reversal((p) => total(p.groups), 'digit-reversal'), countedGroups((p) => p.groups.length, (p) => total(p.groups)), nOffByOne((p) => total(p.groups), 'count-again')],
  };
}

// ---------- reading rods and cubes (ch. 34) ----------

export interface TensParams {
  tens: number;
  units: number;
  /** the cubes drawn before the rods, so reading left to right is no help */
  cubesFirst: boolean;
}

const tensValue = (p: { tens: number; units: number }) => p.tens * TEN + p.units;

function tensParams(lo: number, hi: number) {
  return ({ rng, level }: GenCtx): TensParams => {
    const n = randInt(lo, hi, rng);
    return { tens: Math.floor(n / TEN), units: n % TEN, cubesFirst: level === 3 };
  };
}

export function readTensGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<TensParams> {
  return {
    id,
    skill,
    params: tensParams(lo, hi),
    constraints: [(p) => tensValue(p) >= lo && tensValue(p) <= hi, (p) => p.tens >= 1 && p.units < TEN],
    key: (p) => [id, tensValue(p)].join(':'),
    build: (p) => ({
      answer: ratio(tensValue(p)),
      scene: { kind: 'rods', tens: p.tens, units: p.units, cubesFirst: p.cubesFirst },
      say: [{ instruction: 'count-how-many' }],
    }),
    detectors: [reversal(tensValue, 'digit-reversal'), countedGroups((p) => p.tens + p.units, tensValue), nOffByOne(tensValue, 'count-again')],
  };
}

export function buildTensGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<TensParams> {
  return {
    id,
    skill,
    params: tensParams(lo, hi),
    constraints: [(p) => tensValue(p) >= lo && tensValue(p) <= hi, (p) => p.tens >= 1 && p.units < TEN],
    key: (p) => [id, tensValue(p)].join(':'),
    build: (p) => ({
      answer: ratio(tensValue(p)),
      scene: { kind: 'build', n: tensValue(p) },
      say: [{ instruction: 'tens-units' }, { number: tensValue(p) }],
      answerMode: 'rods',
    }),
    detectors: [reversal(tensValue, 'digit-reversal'), nOffByOne(tensValue, 'tens-worth')],
  };
}

// ---------- tying ten cubes into a rod (ch. 39) ----------

export interface RegroupParams {
  tens: number;
  /** loose cubes, ten or more */
  units: number;
}

/** What the table says when the cubes were never tied: a rod and 14 cubes, «114». */
export const untied = (p: RegroupParams) => p.tens * 100 + p.units;

export function regroupGenerator(id: string, skill: SkillId, max: number): Generator<RegroupParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      // two rods' worth of loose cubes only at level 3
      const units = level === 3 ? randInt(TEN + 1, 2 * TEN + 9, rng) : randInt(TEN, TEN + 9, rng);
      return { tens: randInt(1, level === 1 ? 1 : 3, rng), units };
    },
    constraints: [(p) => p.tens >= 1, (p) => p.units >= TEN, (p) => tensValue(p) <= max],
    key: (p) => [id, p.tens, p.units].join(':'),
    build: (p) => ({
      answer: ratio(tensValue(p)),
      scene: { kind: 'regroup', tens: p.tens, units: p.units },
      say: [{ instruction: 'exchange' }],
      answerMode: 'regroup',
    }),
    detectors: [
      {
        code: 'NOT_REGROUPED',
        hintId: 'bundle-ten',
        simulate: (p) => ratio(untied(p)),
        // anything still showing ten loose cubes or more
        detect: (p, a) => a.d === 1n && a.n >= 100n && a.n !== BigInt(tensValue(p)),
      },
    ],
  };
}

// ---------- three numbers (ch. 35) ----------

export interface ManyParams {
  terms: number[];
  dots: boolean;
}

export function manyTermsGenerator(id: string, skill: SkillId): Generator<ManyParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      if (level < 3) {
        const a = randInt(1, 6, rng);
        const b = randInt(1, 8 - a, rng);
        return { terms: [a, b, randInt(1, TEN - a - b, rng)], dots: level === 1 };
      }
      // two of them make ten, as in the book's «target number» game
      const x = randInt(1, 9, rng);
      const pair = shuffle([x, TEN - x, randInt(1, 9, rng)], rng);
      return { terms: pair, dots: false };
    },
    constraints: [(p) => p.terms.length === 3, (p) => p.terms.every((n) => n >= 1), (p) => total(p.terms) <= (p.dots ? TEN : 19)],
    key: (p) => [id, ...p.terms].join(':'),
    build: (p) => ({
      answer: ratio(total(p.terms)),
      scene: { kind: 'addMany', terms: p.terms, dots: p.dots },
      say: [{ number: p.terms[0]! }, { instruction: 'and' }, { number: p.terms[1]! }, { instruction: 'and' }, { number: p.terms[2]! }, { instruction: 'add' }],
    }),
    detectors: [
      {
        code: 'TERM_MISSED',
        hintId: 'add-all',
        simulate: (p) => ratio(p.terms[0]! + p.terms[1]!),
        detect: (p, a) => [0, 1, 2].some((skip) => given(total(p.terms) - p.terms[skip]!, a)),
      },
      nOffByOne((p) => total(p.terms)),
    ],
  };
}

// ---------- adding through ten (ch. 42) ----------

export interface BridgeParams {
  a: number;
  b: number;
  frames: boolean;
}

export function bridgeGenerator(id: string, skill: SkillId): Generator<BridgeParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const a = randInt(level === 1 ? 8 : 6, 9, rng);
      return { a, b: randInt(TEN + 1 - a, 9, rng), frames: level < 3 };
    },
    constraints: [(p) => p.a + p.b > TEN, (p) => p.a + p.b <= 18, (p) => p.b >= 2],
    key: (p) => [id, p.a, p.b].join(':'),
    build: (p) => ({
      answer: ratio(p.a + p.b),
      scene: { kind: 'bridge', a: p.a, b: p.b, frames: p.frames },
      say: [{ number: p.a }, { instruction: 'and' }, { number: p.b }, { instruction: 'add' }],
      ...(p.frames ? { praise: 'made-ten' } : {}),
    }),
    detectors: [
      { code: 'CARRY_FORGOTTEN', hintId: 'make-ten', simulate: (p) => mistake(p.a + p.b - TEN, p.a + p.b), detect: (p, a) => given(p.a + p.b - TEN, a) },
      teenReversal((p) => p.a + p.b),
      { code: 'OPERATION_SWAP', hintId: 'putting-together', simulate: (p) => mistake(p.a - p.b, p.a + p.b), detect: (p, a) => p.a > p.b && given(p.a - p.b, a) },
      nOffByOne((p) => p.a + p.b, 'make-ten'),
    ],
  };
}

// ---------- the days of the week (ch. 41) ----------

export interface DaysParams {
  /** 1 Monday … 7 Sunday, as the week starts in Greece */
  today: number;
  /** −2 the day before yesterday … +2 the day after tomorrow */
  offset: -2 | -1 | 1 | 2;
  /** today's card is marked */
  marked: boolean;
}

export const DAYS = 7;
export const dayAfter = (day: number, offset: number) => ((((day - 1 + offset) % DAYS) + DAYS) % DAYS) + 1;
const ASK: Record<DaysParams['offset'], string> = { [-2]: 'ask-day-before', [-1]: 'ask-yesterday', 1: 'ask-tomorrow', 2: 'ask-day-after' };

export function daysGenerator(id: string, skill: SkillId): Generator<DaysParams> {
  const answerOf = (p: DaysParams) => dayAfter(p.today, p.offset);
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const offset = (level === 3 ? [-2, -1, 1, 2] : [-1, 1])[randInt(0, level === 3 ? 3 : 1, rng)] as DaysParams['offset'];
      return { today: randInt(1, DAYS, rng), offset, marked: level === 1 };
    },
    // the week only goes round the corner once the child knows it by heart
    constraints: [(p) => p.today >= 1 && p.today <= DAYS, (p) => !p.marked || (p.today + p.offset >= 1 && p.today + p.offset <= DAYS)],
    key: (p) => [id, p.today, p.offset].join(':'),
    build: (p) => ({
      answer: ratio(answerOf(p)),
      scene: { kind: 'week', today: p.today, offset: p.offset, marked: p.marked },
      say: [{ instruction: 'today-is' }, { instruction: `day-${p.today}` }, { instruction: ASK[p.offset] }],
      answerMode: 'week',
    }),
    detectors: [
      {
        code: 'WRONG_DIRECTION',
        hintId: 'days-order',
        simulate: (p) => ratio(dayAfter(p.today, -p.offset)),
        detect: (p, a) => given(dayAfter(p.today, -p.offset), a),
      },
      {
        code: 'OFF_BY_ONE',
        hintId: 'days-order',
        simulate: (p) => ratio(p.today),
        detect: (p, a) => given(p.today, a) || given(dayAfter(p.today, p.offset + Math.sign(p.offset)), a) || (Math.abs(p.offset) === 2 && given(dayAfter(p.today, Math.sign(p.offset)), a)),
      },
    ],
  };
}
