// Grade 1, chapters 46-49: a two-digit and a one-digit number with and without a new
// ten, addition and subtraction as inverses, subtracting through ten, back to five,
// big doubles and halves.

import { randInt } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio, type Rational } from '../rational.ts';
import { given, nOffByOne, teenReversal } from './number.ts';
import type { GenCtx, Generator, MisconceptionDetector } from './types.ts';

const TEN = 10;
const FIVE = 5;

const mistake = (value: number, right: number): Rational | null => (value === right || value < 1 ? null : ratio(value));
const sign = (op: 1 | -1) => (op === 1 ? 'add' : 'subtract');
const resultOf = (p: { a: number; b: number; op: 1 | -1 }) => p.a + p.op * p.b;

/** A wrong answer of `wrong(p)`, when that is a different number from the right one. */
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

// ---------- two digits and one (ch. 46 and 49) ----------

export interface TwoDigitParams {
  a: number;
  b: number;
  op: 1 | -1;
  /** rods and cubes under the sum, at levels 1-2 */
  picture: boolean;
}

const crosses = (p: TwoDigitParams) => (p.op === 1 ? (p.a % TEN) + p.b >= TEN : p.b > p.a % TEN);

/** `bridge` decides the book's two chapters: the units stay within ten, or they do not. */
export function twoDigitGenerator(id: string, skill: SkillId, bridge: boolean, max: number): Generator<TwoDigitParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const top = level < 3 ? Math.min(29, max) : max;
      const op = randInt(0, 1, rng) === 1 ? 1 : -1;
      return { a: randInt(11, top, rng), b: randInt(2, 9, rng), op, picture: level < 3 };
    },
    constraints: [(p) => crosses(p) === bridge, (p) => resultOf(p) >= 11 && resultOf(p) <= max, (p) => p.b >= 2 && p.b <= 9, (p) => p.a <= (p.picture ? 29 : max)],
    key: (p) => [id, p.a, p.op, p.b].join(':'),
    build: (p) => ({
      answer: ratio(resultOf(p)),
      scene: { kind: 'calc', a: p.a, b: p.b, op: p.op, picture: p.picture },
      say: [{ number: p.a }, { instruction: p.op === 1 ? 'and' : 'minus' }, { number: p.b }, { instruction: sign(p.op) }],
      ...(bridge && p.picture ? { praise: 'made-ten' } : {}),
    }),
    detectors: bridge
      ? [
          // 17 + 5 = 12, 23 − 5 = 28: the ten that changes was left as it was
          detector('CARRY_FORGOTTEN', 'make-ten', (p) => resultOf(p) - p.op * TEN, resultOf),
          // 23 − 5 = 22: five take away three
          detector('SUB_SMALLER_FROM_LARGER', 'take-to-ten', (p) => (p.op === -1 ? p.a - (p.a % TEN) + (p.b - (p.a % TEN)) : null), resultOf),
          detector('OPERATION_SWAP', undefined, (p) => p.a - p.op * p.b, resultOf),
          nOffByOne(resultOf, 'make-ten'),
        ]
      : [
          // 14 + 3 = 44: the three went on the tens
          detector('PLACE_VALUE', 'add-to-units', (p) => p.a + p.op * p.b * TEN, resultOf),
          detector('OPERATION_SWAP', undefined, (p) => p.a - p.op * p.b, resultOf),
          nOffByOne(resultOf, 'add-to-units'),
        ],
  };
}

// ---------- the inverse (ch. 47) ----------

export interface InverseParams {
  a: number;
  b: number;
  /** which part is taken back off: the second (15 − 6) or the first (15 − 9) */
  takeFirst: boolean;
}

const inverseRight = (p: InverseParams) => (p.takeFirst ? p.b : p.a);

export function inverseGenerator(id: string, skill: SkillId): Generator<InverseParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const a = randInt(3, 9, rng);
      return { a, b: randInt(TEN + 1 - a, 9, rng), takeFirst: level === 3 && randInt(0, 1, rng) === 1 };
    },
    constraints: [(p) => p.a + p.b > TEN && p.a + p.b <= 18, (p) => p.a !== p.b, (p) => p.b >= 2],
    key: (p) => [id, p.a, p.b, p.takeFirst ? 1 : 0].join(':'),
    build: (p) => {
      const whole = p.a + p.b;
      const taken = p.takeFirst ? p.a : p.b;
      return {
        answer: ratio(inverseRight(p)),
        scene: { kind: 'inverse', a: p.a, b: p.b, taken },
        say: [{ number: whole }, { instruction: 'minus' }, { number: taken }, { instruction: 'subtract' }],
      };
    },
    detectors: [
      detector('OPERATION_SWAP', 'look-at-addition', (p) => p.a + p.b + (p.takeFirst ? p.a : p.b), inverseRight),
      detector('PART_IS_WHOLE', 'look-at-addition', (p) => p.a + p.b, inverseRight),
      nOffByOne(inverseRight, 'look-at-addition'),
    ],
  };
}

// ---------- subtracting through ten (ch. 47) ----------

export interface SubBridgeParams {
  a: number;
  b: number;
  /** frames at levels 1-2; at level 3 the book's «counting up»: b + □ = a */
  style: 'frames' | 'plain' | 'up';
}

const subRight = (p: SubBridgeParams) => p.a - p.b;

export function subBridgeGenerator(id: string, skill: SkillId): Generator<SubBridgeParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const a = randInt(11, 18, rng);
      const style = level === 1 ? 'frames' : level === 2 ? 'plain' : randInt(0, 1, rng) === 1 ? 'up' : 'plain';
      return { a, b: randInt((a % TEN) + 1, 9, rng), style };
    },
    constraints: [(p) => p.a > TEN && p.a <= 18, (p) => p.b > p.a % TEN && p.b <= 9, (p) => p.a - p.b < TEN],
    key: (p) => [id, p.a, p.b, p.style === 'up' ? 'up' : ''].join(':'),
    build: (p) => ({
      answer: ratio(subRight(p)),
      scene: p.style === 'up' ? { kind: 'missing', a: p.b, total: p.a, dots: false } : { kind: 'subBridge', a: p.a, b: p.b, frames: p.style === 'frames' },
      say: p.style === 'up' ? [{ number: p.b }, { instruction: 'and' }, { instruction: 'missing-addend' }] : [{ number: p.a }, { instruction: 'minus' }, { number: p.b }, { instruction: 'subtract' }],
      ...(p.style === 'frames' ? { praise: 'went-through-ten' } : {}),
    }),
    detectors: [
      // 15 − 6 = 11: six take away five, and the ten kept
      detector('SUB_SMALLER_FROM_LARGER', 'take-to-ten', (p) => TEN + p.b - (p.a % TEN), subRight),
      detector('OPERATION_SWAP', 'taking-away', (p) => p.a + p.b, subRight),
      nOffByOne(subRight, 'take-to-ten'),
    ],
  };
}

// ---------- back to five (ch. 48) ----------

export interface FivesParams {
  a: number;
  b: number;
  picture: boolean;
}

const fivesRight = (p: FivesParams) => p.a + p.b;

export function fivesGenerator(id: string, skill: SkillId): Generator<FivesParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ a: randInt(6, 9, rng), b: level === 1 ? FIVE : randInt(6, 9, rng), picture: level < 3 }),
    constraints: [(p) => p.a >= 6 && p.a <= 9, (p) => p.b >= FIVE && p.b <= 9],
    key: (p) => [id, p.a, p.b].join(':'),
    build: (p) => ({
      answer: ratio(fivesRight(p)),
      scene: { kind: 'fives', a: p.a, b: p.b, picture: p.picture },
      say: [{ number: p.a }, { instruction: 'and' }, { number: p.b }, { instruction: 'add' }],
      ...(p.picture ? { praise: 'two-fives' } : {}),
    }),
    detectors: [
      // 7 + 8 = 5: two and three, the fives left out
      detector('CARRY_FORGOTTEN', 'five-and-five', (p) => fivesRight(p) - TEN, fivesRight),
      teenReversal(fivesRight),
      nOffByOne(fivesRight, 'five-and-five'),
    ],
  };
}

// ---------- big doubles, near doubles and halves (ch. 48-49) ----------

export interface DoublesParams {
  kind: 'double' | 'near' | 'half';
  a: number;
  /** near doubles: the bigger one first or second */
  biggerFirst: boolean;
  dots: boolean;
}

const doublesRight = (p: DoublesParams) => (p.kind === 'double' ? 2 * p.a : p.kind === 'near' ? 2 * p.a + 1 : p.a);

export function bigDoublesGenerator(id: string, skill: SkillId): Generator<DoublesParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const kind = level === 1 ? 'double' : level === 2 ? 'near' : (['double', 'near', 'half'] as const)[randInt(0, 2, rng)]!;
      return { kind, a: randInt(FIVE, kind === 'near' ? 8 : 9, rng), biggerFirst: randInt(0, 1, rng) === 1, dots: level === 1 };
    },
    constraints: [(p) => p.a >= FIVE && p.a <= 9, (p) => p.kind !== 'near' || p.a <= 8],
    key: (p) => [id, p.kind, p.a, p.biggerFirst ? 1 : 0].join(':'),
    build: (p) => {
      const praise = p.kind === 'double' ? 'doubles' : p.kind === 'near' ? 'near-doubles' : undefined;
      if (p.kind === 'half') {
        return {
          answer: ratio(p.a),
          scene: { kind: 'sub', a: 2 * p.a, b: p.a, dots: false },
          say: [{ number: 2 * p.a }, { instruction: 'minus' }, { number: p.a }, { instruction: 'subtract' }],
        };
      }
      const [x, y] = p.kind === 'double' ? [p.a, p.a] : p.biggerFirst ? [p.a + 1, p.a] : [p.a, p.a + 1];
      return {
        answer: ratio(doublesRight(p)),
        scene: { kind: 'add', a: x, b: y, dots: p.dots },
        say: [{ number: x }, { instruction: 'and' }, { number: y }, { instruction: 'add' }],
        ...(praise ? { praise } : {}),
      };
    },
    detectors: [
      // 7 + 8 = 14: the double, without the one more
      detector('OFF_BY_ONE', 'use-doubles', (p) => (p.kind === 'near' ? 2 * p.a : null), doublesRight),
      detector('OPERATION_SWAP', 'taking-away', (p) => (p.kind === 'half' ? 3 * p.a : null), doublesRight),
      detector('PART_IS_WHOLE', 'use-doubles', (p) => (p.kind === 'half' ? 2 * p.a : null), doublesRight),
      teenReversal((p) => (p.kind === 'half' ? 0 : doublesRight(p))),
      nOffByOne(doublesRight, 'use-doubles'),
    ],
  };
}
