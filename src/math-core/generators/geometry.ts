// Grade 1, the year's shapes and patterns and a few early gaps: which shape it is
// (turned, stretched, any size), taller and shorter, what comes next in a pattern,
// 3 + 5 = 5 + 3, which sum a picture shows, and one-to-one matching.

import { pick, randInt, shuffle } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio, type Rational } from '../rational.ts';
import { given, nOffByOne } from './number.ts';
import type { Choice, GenCtx, Generator, MisconceptionDetector } from './types.ts';

const mistake = (value: number, right: number): Rational | null => (value === right || value < 1 ? null : ratio(value));

/** A wrong tile: any tile but the right one. */
const wrongTile = <P>(code: MisconceptionDetector<P>['code'], hintId: string, right: (p: P) => number, tiles: (p: P) => number): MisconceptionDetector<P> => ({
  code,
  hintId,
  simulate: (p) => ratio(right(p) === 1 ? 2 : 1),
  detect: (p, a) => a.d === 1n && a.n >= 1n && a.n <= BigInt(tiles(p)) && !given(right(p), a),
});

// ---------- shapes (ch. 2) ----------

export type ShapeKind = 'triangle' | 'square' | 'circle' | 'rectangle';
export const SHAPE_KINDS: ShapeKind[] = ['triangle', 'square', 'circle', 'rectangle'];

export interface Shape {
  kind: ShapeKind;
  /** degrees */
  rotate: number;
  /** percent of the tile, 65-100 */
  size: number;
  /** triangles: 0 even, 1 right-angled, 2 long and thin · rectangles: how long */
  variant: number;
}

export interface WhichShapeParams {
  target: ShapeKind;
  tiles: Shape[];
}

function shapeOf(kind: ShapeKind, odd: boolean, rng: () => number): Shape {
  // level 1 shapes sit the way they are usually drawn; odd ones are turned, stretched and smaller
  if (!odd) return { kind, rotate: 0, size: 90, variant: kind === 'rectangle' ? 1 : 0 };
  return { kind, rotate: pick([15, 30, 45, 60, 90, 135, 180], rng), size: pick([65, 80, 100], rng), variant: randInt(0, 2, rng) };
}

const targetIndex = (p: WhichShapeParams) => p.tiles.findIndex((s) => s.kind === p.target) + 1;

export function whichShapeGenerator(id: string, skill: SkillId): Generator<WhichShapeParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const target = pick(SHAPE_KINDS, rng);
      // a square beside a rectangle is the hard pair, so it comes from level 2
      const pairedWith = (k: ShapeKind): ShapeKind | null => (k === 'square' ? 'rectangle' : k === 'rectangle' ? 'square' : null);
      const avoid = level > 1 ? null : (pairedWith(target) ?? 'rectangle');
      const others = shuffle(SHAPE_KINDS.filter((k) => k !== target && k !== avoid), rng).slice(0, 2);
      return { target, tiles: shuffle([target, ...others], rng).map((k) => shapeOf(k, level > 1, rng)) };
    },
    constraints: [(p) => p.tiles.filter((s) => s.kind === p.target).length === 1, (p) => p.tiles.length === 3],
    key: (p) => [id, p.target, ...p.tiles.map((s) => s.kind)].join(':'),
    build: (p) => ({
      answer: ratio(targetIndex(p)),
      scene: { kind: 'whichShape', target: p.target, tiles: p.tiles },
      say: [{ instruction: `which-${p.target}` }],
      answerMode: 'pictures',
      choices: p.tiles.map((s, i): Choice => ({ label: s.kind, value: i + 1 })),
    }),
    detectors: [wrongTile('SHAPE_CONFUSED', 'shape-sides', targetIndex, (p) => p.tiles.length)],
  };
}

export interface CountShapesParams {
  shapes: Shape[];
}

const trianglesIn = (p: CountShapesParams) => p.shapes.filter((s) => s.kind === 'triangle').length;

export function countShapesGenerator(id: string, skill: SkillId): Generator<CountShapesParams> {
  return {
    id,
    skill,
    params: ({ rng }: GenCtx) => {
      const n = randInt(2, 5, rng);
      const others = Array.from({ length: randInt(2, 4, rng) }, () => pick(SHAPE_KINDS.filter((k) => k !== 'triangle'), rng));
      // some stand the usual way, some are turned
      return { shapes: shuffle([...Array<ShapeKind>(n).fill('triangle'), ...others], rng).map((k) => shapeOf(k, randInt(0, 1, rng) === 1, rng)) };
    },
    constraints: [(p) => trianglesIn(p) >= 2, (p) => p.shapes.length <= 9],
    key: (p) => [id, ...p.shapes.map((s) => s.kind)].join(':'),
    build: (p) => ({
      answer: ratio(trianglesIn(p)),
      scene: { kind: 'countShapes', shapes: p.shapes },
      say: [{ instruction: 'count-triangles' }],
    }),
    detectors: [
      // counted every shape
      { code: 'PART_IS_WHOLE', hintId: 'shape-sides', simulate: (p) => mistake(p.shapes.length, trianglesIn(p)), detect: (p, a) => p.shapes.length !== trianglesIn(p) && given(p.shapes.length, a) },
      // left out the turned ones: those not standing on a side
      {
        code: 'SHAPE_CONFUSED',
        hintId: 'turned-shape',
        simulate: (p) => mistake(p.shapes.filter((s) => s.kind === 'triangle' && s.rotate % 120 === 0).length, trianglesIn(p)),
        detect: (p, a) => {
          const upright = p.shapes.filter((s) => s.kind === 'triangle' && s.rotate % 120 === 0).length;
          return upright !== trianglesIn(p) && upright >= 1 && given(upright, a);
        },
      },
      nOffByOne(trianglesIn, 'count-again'),
    ],
  };
}

// ---------- taller, shorter, longer (ch. 9) ----------

export interface LengthsParams {
  ask: 'taller' | 'shorter';
  /** heights in steps of the drawing, left and right */
  left: number;
  right: number;
  /** level 3: the shorter one stands on a box, so its top is higher */
  raised: 'left' | 'right' | null;
}

const LEFT = -1;
const RIGHT = 1;
const lengthsAnswer = (p: LengthsParams) => ((p.ask === 'taller') === p.left > p.right ? LEFT : RIGHT);

export function lengthsGenerator(id: string, skill: SkillId): Generator<LengthsParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const left = randInt(2, 8, rng);
      const right = randInt(2, 8, rng);
      const shorter = left < right ? 'left' : 'right';
      return { ask: pick(['taller', 'shorter'] as const, rng), left, right, raised: level === 3 ? shorter : null };
    },
    constraints: [(p) => p.left !== p.right, (p) => Math.abs(p.left - p.right) >= (p.raised === null ? 2 : 1)],
    key: (p) => [id, p.ask, p.left, p.right, p.raised ?? ''].join(':'),
    build: (p) => ({
      answer: ratio(lengthsAnswer(p)),
      scene: { kind: 'lengths', ask: p.ask, left: p.left, right: p.right, raised: p.raised },
      say: [{ instruction: p.ask }],
      answerMode: 'pictures',
      choices: [
        { label: 'left', value: LEFT },
        { label: 'right', value: RIGHT },
      ],
    }),
    detectors: [
      {
        code: 'POSITION_NOT_LENGTH',
        hintId: 'from-the-ground',
        simulate: (p) => (p.raised === null ? null : ratio(-lengthsAnswer(p))),
        detect: (p, a) => p.raised !== null && given(-lengthsAnswer(p), a),
      },
      {
        code: 'WRONG_DIRECTION',
        hintId: 'from-the-ground',
        simulate: (p) => (p.raised === null ? ratio(-lengthsAnswer(p)) : null),
        detect: (p, a) => p.raised === null && given(-lengthsAnswer(p), a),
      },
    ],
  };
}

// ---------- patterns (ch. 27) ----------

/** one of the pattern's things: a shape in a colour, 0-5 */
export const PATTERN_ITEMS = 6;
const UNITS: number[][] = [
  [0, 1],
  [0, 0, 1],
  [0, 1, 1],
  [0, 1, 2],
];

export interface PatternParams {
  /** the repeating unit, as indexes into `items` */
  unit: number[];
  /** the things used, by PATTERN_ITEMS index */
  items: number[];
  /** how many are shown */
  length: number;
  /** which one is missing */
  blank: number;
  /** the three things to choose from, by PATTERN_ITEMS index */
  options: number[];
}

const itemAt = (p: PatternParams, i: number) => p.items[p.unit[i % p.unit.length]!]!;
const patternAnswer = (p: PatternParams) => p.options.indexOf(itemAt(p, p.blank)) + 1;

export function patternGenerator(id: string, skill: SkillId): Generator<PatternParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const unit = level === 1 ? UNITS[0]! : pick(UNITS, rng);
      const kinds = new Set(unit).size;
      const items = shuffle(Array.from({ length: PATTERN_ITEMS }, (_, i) => i), rng).slice(0, kinds);
      const length = unit.length * 3;
      // the end at levels 1-2; anywhere in the second half at level 3
      const blank = level < 3 ? length - 1 : randInt(unit.length, length - 2, rng);
      // the right one, the others of the pattern, and one that is not in it
      const outsider = Array.from({ length: PATTERN_ITEMS }, (_, i) => i).find((i) => !items.includes(i))!;
      const options = shuffle([...items, outsider].slice(0, 3), rng);
      return { unit, items, length, blank, options };
    },
    constraints: [(p) => p.options.includes(itemAt(p, p.blank)), (p) => new Set(p.options).size === 3, (p) => p.blank >= 0 && p.blank < p.length],
    key: (p) => [id, p.unit.join(''), p.blank, ...p.items].join(':'),
    build: (p) => ({
      answer: ratio(patternAnswer(p)),
      scene: { kind: 'pattern', sequence: Array.from({ length: p.length }, (_, i) => (i === p.blank ? -1 : itemAt(p, i))), options: p.options },
      say: [{ instruction: p.blank === p.length - 1 ? 'pattern-next' : 'pattern-missing' }],
      answerMode: 'pictures',
      choices: p.options.map((o, i): Choice => ({ label: String(o), value: i + 1 })),
    }),
    detectors: [
      // repeated the one just before the gap
      {
        code: 'PATTERN_BROKEN',
        hintId: 'pattern-say',
        simulate: (p) => {
          const before = p.options.indexOf(itemAt(p, p.blank - 1)) + 1;
          return before === 0 || before === patternAnswer(p) ? null : ratio(before);
        },
        detect: (p, a) => a.d === 1n && a.n >= 1n && a.n <= 3n && !given(patternAnswer(p), a),
      },
    ],
  };
}

// ---------- the order does not change the sum (ch. 18) ----------

export interface CommuteParams {
  a: number;
  b: number;
}

export function commuteGenerator(id: string, skill: SkillId): Generator<CommuteParams> {
  return {
    id,
    skill,
    params: ({ rng }: GenCtx) => {
      const a = randInt(1, 8, rng);
      return { a, b: randInt(1, 9 - a, rng) };
    },
    constraints: [(p) => p.a !== p.b, (p) => p.a + p.b <= 10, (p) => p.a >= 1 && p.b >= 1],
    key: (p) => [id, p.a, p.b].join(':'),
    build: (p) => ({
      answer: ratio(p.a),
      scene: { kind: 'commute', a: p.a, b: p.b },
      say: [{ instruction: 'missing-number' }],
    }),
    detectors: [
      { code: 'PART_IS_WHOLE', hintId: 'same-numbers', simulate: (p) => ratio(p.a + p.b), detect: (p, a) => given(p.a + p.b, a) },
      // copied the number beside the gap
      { code: 'ADDED_PARTS', hintId: 'same-numbers', simulate: (p) => ratio(p.b), detect: (p, a) => given(p.b, a) },
    ],
  };
}

// ---------- which sum the picture shows (ch. 14) ----------

export interface SentenceParams {
  a: number;
  b: number;
  /** the three sentences, as [first, second, sum]; the right one among them */
  options: [number, number, number][];
}

const sentenceRight = (p: SentenceParams) => p.options.findIndex(([x, y, s]) => x === p.a && y === p.b && s === p.a + p.b) + 1;

export function sentenceGenerator(id: string, skill: SkillId): Generator<SentenceParams> {
  return {
    id,
    skill,
    params: ({ rng }: GenCtx) => {
      const a = randInt(1, 4, rng);
      const b = randInt(1, 5 - a, rng);
      // a sum one off, and one whose second number is wrong
      const options = shuffle<[number, number, number]>([[a, b, a + b], [a, b, a + b + 1], [a, b + 1, a + b + 1]], rng);
      return { a, b, options };
    },
    constraints: [(p) => p.a + p.b <= 5, (p) => p.options.filter(([x, y, s]) => x + y === s && x === p.a && y === p.b).length === 1],
    key: (p) => [id, p.a, p.b].join(':'),
    build: (p) => ({
      answer: ratio(sentenceRight(p)),
      scene: { kind: 'sentence', a: p.a, b: p.b, options: p.options },
      say: [{ instruction: 'which-sum' }],
      answerMode: 'pictures',
      choices: p.options.map(([x, y, s], i): Choice => ({ label: [x, y, s].join(' '), value: i + 1 })),
    }),
    detectors: [wrongTile('OFF_BY_ONE', 'count-again', sentenceRight, () => 3)],
  };
}

// ---------- one to one (ch. 3) ----------

export interface MatchParams {
  /** the kittens */
  have: number;
  /** the cookies, always fewer */
  give: number;
  /** level 2: the cookies spread wider, so their row looks longer */
  spread: boolean;
}

const matchRight = (p: MatchParams) => p.have - p.give;

export function matchGenerator(id: string, skill: SkillId): Generator<MatchParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const have = randInt(3, 6, rng);
      return { have, give: randInt(1, have - 1, rng), spread: level > 1 };
    },
    constraints: [(p) => p.give >= 1 && p.give < p.have, (p) => p.have <= 6],
    key: (p) => [id, p.have, p.give, p.spread ? 1 : 0].join(':'),
    build: (p) => ({
      answer: ratio(matchRight(p)),
      scene: { kind: 'match', have: p.have, give: p.give, spread: p.spread },
      say: [{ instruction: 'match-missing' }],
    }),
    detectors: [
      { code: 'PART_IS_WHOLE', hintId: 'line-up', simulate: (p) => mistake(p.give, matchRight(p)), detect: (p, a) => p.give !== matchRight(p) && given(p.give, a) },
      nOffByOne(matchRight, 'line-up'),
    ],
  };
}
