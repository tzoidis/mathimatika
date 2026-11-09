// A generator makes endless different problems for one skill (PRD §9). Everything
// here is data; what a Scene looks like is decided in exercises/.

import type { Level, SkillId } from '../../engine/types.ts';
import { check, type AcceptPolicy, type MisconceptionCode, type Verdict } from '../check.ts';
import { parseNumber } from '../format.ts';
import type { Rational } from '../rational.ts';

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
  | { kind: 'compare'; a: number; b: number; dots: boolean };

export type AnswerMode = 'keypad' | 'tenFrame' | 'numberLine' | 'choice';

/** One of the tiles of a choice question; the answer is `value`, the child sees `label`. */
export interface Choice {
  label: string;
  value: number;
}

/** What is read aloud, in order. Every problem in grades 1-2 is (PRD §7). */
export type Say = { instruction: string } | { number: number };

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
  /** only for answerMode 'choice' */
  choices?: Choice[];
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
  build(p: P, ctx: GenCtx): Pick<Problem, 'answer' | 'scene' | 'say'> & Partial<Pick<Problem, 'answerMode' | 'choices'>>;
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
      return { generatorId: g.id, skill: g.skill, key: g.key(last), params: last, policy: { equality: 'value' }, readingLoad: 'none', answerMode: 'keypad', ...g.build(last, ctx) };
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
