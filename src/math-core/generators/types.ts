// A generator makes endless different problems for one skill (PRD §9). Everything
// here is data; what a Scene looks like is decided in exercises/.

import type { Level, SkillId } from '../../engine/types.ts';
import { check, type AcceptPolicy, type MisconceptionCode, type Verdict } from '../check.ts';
import { parseNumber } from '../format.ts';
import type { Rational } from '../rational.ts';
import type { Shape, ShapeKind } from './geometry.ts';
import type { Figure } from './space.ts';
import type { OrderAsk, Story } from './time.ts';

export interface GenCtx {
  rng: () => number;
  level: Level;
}

export type LineLabels = 'all' | 'fives' | 'ends';

export type Scene =
  | { kind: 'count'; n: number; arrangement: 'frames' | 'rows' | 'scattered'; cells: number[] }
  | { kind: 'add'; a: number; b: number; dots: boolean }
  | { kind: 'house'; whole: number; known: number; missingOnRight: boolean; dots: boolean }
  | { kind: 'put'; n: number; frames: number }
  | { kind: 'subitize'; n: number; arrangement: 'frames' | 'rows' }
  | { kind: 'line'; max: number; labels: LineLabels; mark: number | null; target: number }
  | { kind: 'compare'; a: number; b: number; dots: boolean }
  | { kind: 'quantity'; left: number; right: number; ask: 'more' | 'less'; bigSide: 'left' | 'right' | null }
  | { kind: 'jar'; n: number; max: number; cells: number[] }
  | { kind: 'balance'; a: number; total: number }
  | { kind: 'missing'; a: number; total: number; dots: boolean }
  | { kind: 'sub'; a: number; b: number; dots: boolean }
  | { kind: 'whichSign'; a: number; b: number; result: number }
  | { kind: 'floor'; floor: number; floors: number }
  | { kind: 'coins'; coins: number[]; unit: 'euro' | 'cent' }
  | { kind: 'exchange'; coin: number; unit: 'euro' | 'cent' }
  | { kind: 'groups'; groups: number[] }
  | { kind: 'rods'; tens: number; units: number; cubesFirst: boolean }
  | { kind: 'build'; n: number }
  | { kind: 'regroup'; tens: number; units: number }
  | { kind: 'addMany'; terms: number[]; dots: boolean }
  | { kind: 'bridge'; a: number; b: number; frames: boolean }
  | { kind: 'week'; today: number; offset: number; marked: boolean }
  | { kind: 'calc'; a: number; b: number; op: 1 | -1; picture: boolean }
  | { kind: 'inverse'; a: number; b: number; taken: number }
  | { kind: 'subBridge'; a: number; b: number; frames: boolean }
  | { kind: 'fives'; a: number; b: number; picture: boolean }
  | { kind: 'neighbour'; n: number; direction: 1 | -1 }
  | { kind: 'times'; n: number; k: number; show: 1 | 2 | 3 }
  | { kind: 'measure'; length: number; extra: number; other: number | null; object: number }
  | { kind: 'tensCalc'; a: number; b: number; op: 1 | -1; notes: boolean }
  | { kind: 'tenStep'; n: number; direction: 1 | -1 }
  | { kind: 'wallet'; notes: number[]; coins: number[] }
  | { kind: 'share'; total: number; plates: number; scattered: boolean }
  | { kind: 'heavier'; left: string; right: string; heavy: 'left' | 'right'; bigSide: 'left' | 'right' | null }
  | { kind: 'whichShape'; target: ShapeKind; tiles: Shape[] }
  | { kind: 'countShapes'; shapes: Shape[] }
  | { kind: 'lengths'; ask: 'taller' | 'shorter'; left: number; right: number; raised: 'left' | 'right' | null }
  | { kind: 'pattern'; sequence: number[]; options: number[] }
  | { kind: 'commute'; a: number; b: number }
  | { kind: 'sentence'; a: number; b: number; options: [number, number, number][] }
  | { kind: 'match'; have: number; give: number; spread: boolean }
  | { kind: 'arrow'; cols: number; rows: number; at: number; star: number }
  | { kind: 'route'; cols: number; rows: number; start: number; target: number; obstacles: number[]; ask: 'go' | 'steps' }
  | { kind: 'compose'; picture: string; ask: ShapeKind }
  | { kind: 'pieces'; figure: Figure; lines: boolean }
  | { kind: 'mirror'; half: number; rows: number; filled: number[] }
  | { kind: 'order'; story: Story; shown: number[]; ask: OrderAsk }
  | { kind: 'dates'; today: number; offset: number }
  | { kind: 'season'; event: string }
  | { kind: 'month'; first: number; length: number; date: number }
  | { kind: 'story'; problemId: string; text: string; operation: 'add' | 'subtract' | 'missing' | 'twoStep' | 'multiply' | 'divide'; a: number; b: number; c?: number; objects: string[]; pictures: boolean };

export type AnswerMode = 'keypad' | 'tenFrame' | 'numberLine' | 'balance' | 'choice' | 'group' | 'rods' | 'regroup' | 'week' | 'heavier' | 'pictures' | 'route' | 'mirror';

/** One of the tiles of a choice question; the answer is `value`, the child sees `label`. */
export interface Choice {
  label: string;
  value: number;
}

/** What is read aloud, in order. Every problem in grades 1-2 is (PRD §7). */
export type Say = { instruction: string } | { number: number; gender?: 'n' | 'f' | 'm' } | { clip: string };

export interface Problem {
  generatorId: string;
  skill: SkillId;
  /** canonical form, to avoid the same problem twice */
  key: string;
  params: unknown;
  answer: Rational;
  policy: AcceptPolicy;
  scene: Scene;
  say: Say[];
  readingLoad: 'none' | 'low' | 'high';
  answerMode: AnswerMode;
  /** only for answerMode 'choice' and 'group' */
  choices?: Choice[];
  /** a strategy praise the picture invites, instead of a general one */
  praise?: string;
}

export interface MisconceptionDetector<P> {
  code: MisconceptionCode;
  /** clip played for this mistake; without one, the general «hmm» */
  hintId?: string;
  /** the wrong answer a child with this idea gives; null if it would not be a distinct mistake here */
  simulate(p: P): Rational | null;
  detect(p: P, given: Rational): boolean;
}

export interface Generator<P> {
  id: string;
  skill: SkillId;
  /** deterministic for the same rng */
  params(ctx: GenCtx): P;
  constraints: ((p: P) => boolean)[];
  build(p: P, ctx: GenCtx): Pick<Problem, 'answer' | 'scene' | 'say'> & Partial<Pick<Problem, 'answerMode' | 'choices' | 'praise'>>;
  key(p: P): string;
  detectors: MisconceptionDetector<P>[];
  /** for answers that are right without being equal: a tap near enough on the number line */
  accept?(p: P, given: Rational): boolean;
}

/** A generator with its parameter type hidden, so different ones can share a list. */
export interface PlayableGenerator {
  id: string;
  skill: SkillId;
  /** a new problem, different from those in `avoid` when that is possible */
  produce(ctx: GenCtx, avoid: ReadonlySet<string>): Problem;
  grade(problem: Problem, input: string): Verdict;
}

const MAX_TRIES = 50;

export function playable<P>(g: Generator<P>): PlayableGenerator {
  return {
    id: g.id,
    skill: g.skill,
    produce(ctx, avoid) {
      let last: P | undefined;
      for (let i = 0; i < MAX_TRIES; i++) {
        const p = g.params(ctx);
        if (!g.constraints.every((c) => c(p))) continue;
        last = p;
        if (!avoid.has(g.key(p))) break;
      }
      if (last === undefined) throw new Error(`${g.id}: no valid problem in ${MAX_TRIES} tries`);
      const built = g.build(last, ctx);
      const readingLoad = built.scene.kind === 'story' ? 'high' : 'none';
      return { generatorId: g.id, skill: g.skill, key: g.key(last), params: last, policy: { equality: 'value' }, readingLoad, answerMode: 'keypad', ...built };
    },
    grade(problem, input) {
      const given = parseNumber(input);
      const verdict: Verdict = g.accept ? { ok: given !== null && g.accept(problem.params as P, given) } : check(input, problem.answer, problem.policy);
      if (verdict.ok || !given) return verdict;
      const found = g.detectors.find((d) => d.detect(problem.params as P, given));
      return found ? { ok: false, code: found.code, hintId: found.hintId } : verdict;
    },
  };
}
