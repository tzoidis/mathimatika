// Word problems as a generator: it picks one of the golden problems of its skill. They
// are read aloud from a clip recorded whole, and shown as text only where the child can
// read every word (PRD §7, §9).

import golden from '../../content/word-problems.golden.json' with { type: 'json' };
import { randInt } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio } from '../rational.ts';
import type { WordProblem } from '../wordProblems.ts';
import { given, nOffByOne } from './number.ts';
import type { GenCtx, Generator } from './types.ts';

export const GOLDEN_PROBLEMS = golden.problems as WordProblem[];

export interface StoryParams {
  problem: WordProblem;
  pictures: boolean;
}

const swapped = (p: WordProblem) => (p.operation === 'add' ? Math.abs(p.a - p.b) : p.a + p.b);
const shownNumber = (p: WordProblem) => (p.operation === 'missing' ? p.b : p.a);

export function storyGenerator(id: string, skill: SkillId): Generator<StoryParams> {
  const pool = GOLDEN_PROBLEMS.filter((p) => p.skill === skill);
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ problem: pool[randInt(0, pool.length - 1, rng)]!, pictures: level < 3 }),
    constraints: [(p) => pool.includes(p.problem)],
    key: (p) => [id, p.problem.id].join(':'),
    build: (p) => ({
      answer: ratio(p.problem.answer),
      scene: { kind: 'story', problemId: p.problem.id, text: p.problem.text, operation: p.problem.operation, a: p.problem.a, b: p.problem.b, objects: p.problem.objects, pictures: p.pictures },
      say: [{ clip: p.problem.id }],
    }),
    detectors: [
      {
        code: 'OPERATION_SWAP',
        hintId: p0(pool) === 'add' ? 'putting-together' : 'taking-away',
        simulate: (p) => (swapped(p.problem) === p.problem.answer || swapped(p.problem) < 1 ? null : ratio(swapped(p.problem))),
        detect: (p, a) => swapped(p.problem) !== p.problem.answer && given(swapped(p.problem), a),
      },
      {
        // wrote a number that is already in the problem
        code: 'PART_IS_WHOLE',
        simulate: (p) => (shownNumber(p.problem) === p.problem.answer || shownNumber(p.problem) === swapped(p.problem) ? null : ratio(shownNumber(p.problem))),
        detect: (p, a) => shownNumber(p.problem) !== p.problem.answer && shownNumber(p.problem) !== swapped(p.problem) && given(shownNumber(p.problem), a),
      },
      nOffByOne((p) => p.problem.answer, 'count-again'),
    ],
  };
}

/** The operation of a skill's problems: they share one per skill but for «addsub». */
function p0(pool: readonly WordProblem[]): string {
  return pool.every((p) => p.operation === 'add') ? 'add' : 'other';
}
