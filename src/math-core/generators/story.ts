// Word problems as a generator: it picks one of the golden problems of its skill. They
// are read aloud from a clip recorded whole, and shown as text only where the child can
// read every word (PRD §7, §9).

import golden from '../../content/word-problems.golden.json' with { type: 'json' };
import { randInt } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio } from '../rational.ts';
import type { WordProblem } from '../wordProblems.ts';
import { given, nOffByOne } from './number.ts';
import type { GenCtx, Generator, MisconceptionDetector } from './types.ts';

export const GOLDEN_PROBLEMS = golden.problems as WordProblem[];

export interface StoryParams {
  problem: WordProblem;
  pictures: boolean;
}

/** the other operation: for two steps, adding all three */
function swapped(p: WordProblem): number {
  switch (p.operation) {
    case 'add':
      return Math.abs(p.a - p.b);
    case 'twoStep':
      return p.a + p.b + (p.c ?? 0);
    // the groups added instead of multiplied, the share taken away instead of divided
    case 'multiply':
      return p.a + p.b;
    case 'divide':
      return p.a - p.b;
    default:
      return p.a + p.b;
  }
}
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
      scene: { kind: 'story', problemId: p.problem.id, text: p.problem.text, operation: p.problem.operation, a: p.problem.a, b: p.problem.b, ...(p.problem.c === undefined ? {} : { c: p.problem.c }), objects: p.problem.objects, pictures: p.pictures },
      say: [{ clip: p.problem.id }],
    }),
    detectors: [
      // the other operation, with the hint for the kind of problem it is
      ...SWAP_HINTS.map(([kind, hintId]) => swapDetector(kind, hintId)),
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

/** Which hint a swapped operation gets, by what happens in the story. */
const SWAP_HINTS: [(p: WordProblem) => boolean, string][] = [
  // «είχε στην αρχή»: some were given away, so there were more before
  [(p) => p.operation === 'add' && p.template === 'before', 'had-more-before'],
  [(p) => p.operation === 'add' && p.template !== 'before', 'putting-together'],
  [(p) => p.operation === 'subtract', 'taking-away'],
  // «χρειάζεται ακόμα»: from what there is up to what is wanted
  [(p) => p.operation === 'missing', 'how-many-more'],
  [(p) => p.operation === 'twoStep', 'one-step-at-a-time'],
  [(p) => p.operation === 'multiply', 'equal-groups'],
  [(p) => p.operation === 'divide', 'share-fair'],
];

function swapDetector(kind: (p: WordProblem) => boolean, hintId: string): MisconceptionDetector<StoryParams> {
  const applies = (p: StoryParams) => kind(p.problem) && swapped(p.problem) !== p.problem.answer;
  return {
    code: 'OPERATION_SWAP',
    hintId,
    simulate: (p) => (!applies(p) || swapped(p.problem) < 1 ? null : ratio(swapped(p.problem))),
    detect: (p, a) => applies(p) && given(swapped(p.problem), a),
  };
}
