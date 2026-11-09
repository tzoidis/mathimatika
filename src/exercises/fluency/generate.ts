// A fluency round: five facts. Once subtraction is open, a family comes together, so
// that 3 + 4 is seen next to 4 + 3, 7 − 3 and 7 − 4 (PRD §6).

import { pick, shuffle } from '../../engine/rng.ts';
import { QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import type { Round } from '../../engine/types.ts';
import { factAnswer, factId, type Fact } from '../../math-core/facts.ts';
import type { GenerateContext } from '../types.ts';

export const FLUENCY_ID = 'fluency';

export function planFacts(facts: readonly Fact[], rng: () => number): Fact[] {
  const hasSubtraction = facts.some((f) => f.op === '-');
  const chosen: Fact[] = [];

  if (hasSubtraction) {
    const seed = pick(facts.filter((f) => f.op === '+' && f.a !== f.b), rng);
    const whole = factAnswer(seed);
    chosen.push(seed, { op: '+', a: seed.b, b: seed.a }, { op: '-', a: whole, b: seed.a }, { op: '-', a: whole, b: seed.b });
  }

  const ids = new Set(chosen.map(factId));
  for (const fact of shuffle(facts, rng)) {
    if (chosen.length >= QUESTIONS_PER_ROUND) break;
    if (!ids.has(factId(fact))) chosen.push(fact);
  }
  return chosen;
}

export function generate(ctx: GenerateContext): Round {
  return { id: FLUENCY_ID, exerciseId: FLUENCY_ID, seed: 0, level: ctx.level, items: planFacts(ctx.facts ?? [], ctx.rng) };
}
