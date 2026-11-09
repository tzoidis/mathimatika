// Number sense: put so many, how many at a glance, the number line, comparing (PRD §5, §7).

import { randInt } from '../../engine/rng.ts';
import type { Level, SkillId } from '../../engine/types.ts';
import { ratio } from '../rational.ts';
import { given, nOffByOne, teenReversal } from './number.ts';
import type { Choice, GenCtx, Generator, LineLabels } from './types.ts';

const FRAME_SIZE = 10;

// ---------- put so many on the ten frame ----------

export interface PutParams {
  n: number;
  frames: number;
}

export function putGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<PutParams> {
  return {
    id,
    skill,
    params({ rng }: GenCtx) {
      return { n: randInt(lo, hi, rng), frames: Math.ceil(hi / FRAME_SIZE) };
    },
    constraints: [(p) => p.n >= lo && p.n <= hi, (p) => p.n <= p.frames * FRAME_SIZE],
    key: (p) => [id, p.n].join(':'),
    build: (p) => ({
      answer: ratio(p.n),
      scene: { kind: 'put', n: p.n, frames: p.frames },
      say: [{ number: p.n }, { instruction: 'count-put' }],
      answerMode: 'tenFrame',
    }),
    detectors: [nOffByOne((p) => p.n, 'count-again')],
  };
}

// ---------- how many at a glance ----------

export interface SubitizeParams {
  n: number;
  arrangement: 'frames' | 'rows';
}

export function subitizeGenerator(id: string, skill: SkillId, lo: number, hi: number): Generator<SubitizeParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ n: randInt(lo, hi, rng), arrangement: level === 3 ? 'rows' : 'frames' }),
    constraints: [(p) => p.n >= lo && p.n <= hi],
    key: (p) => [id, p.n].join(':'),
    build: (p) => ({
      answer: ratio(p.n),
      scene: { kind: 'subitize', n: p.n, arrangement: p.arrangement },
      say: [{ instruction: 'subitize' }],
    }),
    detectors: [teenReversal((p) => p.n), nOffByOne((p) => p.n)],
  };
}

// ---------- the number line ----------

const labelsFor = (level: Level): LineLabels => (level === 1 ? 'all' : level === 2 ? 'fives' : 'ends');

export interface LineStepParams {
  max: number;
  at: number;
  direction: 1 | -1;
  labels: LineLabels;
}

export function lineStepGenerator(id: string, skill: SkillId, max: number): Generator<LineStepParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const direction = randInt(0, 1, rng) === 1 ? 1 : -1;
      return { max, direction, at: direction === 1 ? randInt(0, max - 1, rng) : randInt(1, max, rng), labels: labelsFor(level) };
    },
    constraints: [(p) => p.at + p.direction >= 0 && p.at + p.direction <= p.max],
    key: (p) => [id, p.at, p.direction].join(':'),
    build: (p) => ({
      answer: ratio(p.at + p.direction),
      scene: { kind: 'line', max: p.max, labels: p.labels, mark: p.at, target: p.at + p.direction },
      say: [{ number: p.at }, { instruction: p.direction === 1 ? 'line-next' : 'line-previous' }],
    }),
    detectors: [
      {
        code: 'WRONG_DIRECTION',
        hintId: 'line-direction',
        simulate: (p) => (p.at - p.direction < 0 ? null : ratio(p.at - p.direction)),
        detect: (p, a) => given(p.at - p.direction, a),
      },
    ],
  };
}

export interface LinePlaceParams {
  max: number;
  target: number;
  labels: LineLabels;
}

/** How far off still counts: with no numbers to go by, nobody can hit a tick exactly. */
const tolerance = (p: LinePlaceParams) => (p.labels === 'all' ? 0 : 1);

export function linePlaceGenerator(id: string, skill: SkillId, max: number): Generator<LinePlaceParams> {
  const isClose = (p: LinePlaceParams, value: bigint) => {
    const off = value - BigInt(p.target);
    return (off < 0n ? -off : off) <= BigInt(tolerance(p));
  };
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ max, target: randInt(1, max - 1, rng), labels: labelsFor(level) }),
    constraints: [(p) => p.target > 0 && p.target < p.max],
    key: (p) => [id, p.target].join(':'),
    build: (p) => ({
      answer: ratio(p.target),
      scene: { kind: 'line', max: p.max, labels: p.labels, mark: null, target: p.target },
      say: [{ number: p.target }, { instruction: 'line-place' }],
      answerMode: 'numberLine',
    }),
    accept: (p, a) => a.d === 1n && isClose(p, a.n),
    detectors: [
      {
        code: 'LINE_POSITION',
        hintId: 'line-from-zero',
        simulate: (p) => {
          const step = tolerance(p) + 1;
          return ratio(p.target + step <= p.max ? p.target + step : p.target - step);
        },
        detect: (p, a) => a.d === 1n && !isClose(p, a.n),
      },
    ],
  };
}

// ---------- comparing with signs ----------

export interface CompareParams {
  a: number;
  b: number;
  minGap: number;
  dots: boolean;
}

const SIGNS: Choice[] = [
  { label: '<', value: -1 },
  { label: '=', value: 0 },
  { label: '>', value: 1 },
];

const signOf = (p: CompareParams) => Math.sign(p.a - p.b);

/** The numbers get closer as the level rises (PRD §5). */
const gapFor = (level: Level) => (level === 1 ? 3 : level === 2 ? 2 : 1);

export function compareGenerator(id: string, skill: SkillId, lo: number, hi: number, withDots: boolean): Generator<CompareParams> {
  return {
    id,
    skill,
    params({ rng, level }: GenCtx) {
      const minGap = gapFor(level);
      const a = randInt(lo, hi, rng);
      const equal = randInt(0, 4, rng) === 0;
      return { a, b: equal ? a : randInt(lo, hi, rng), minGap, dots: withDots && level === 1 };
    },
    constraints: [(p) => p.a === p.b || Math.abs(p.a - p.b) >= p.minGap],
    key: (p) => [id, p.a, p.b].join(':'),
    build: (p) => ({
      answer: ratio(signOf(p)),
      scene: { kind: 'compare', a: p.a, b: p.b, dots: p.dots },
      say: [{ number: p.a }, { number: p.b }, { instruction: 'compare-sign' }],
      answerMode: 'choice',
      choices: SIGNS,
    }),
    detectors: [
      {
        code: 'SIGN_REVERSED',
        hintId: 'whale-mouth',
        simulate: (p) => (signOf(p) === 0 ? null : ratio(-signOf(p))),
        detect: (p, a) => signOf(p) !== 0 && given(-signOf(p), a),
      },
    ],
  };
}
