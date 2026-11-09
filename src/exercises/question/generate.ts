// Fills a round from what the class has reached (PRD §6). The adaptive engine replaces
// this plan in ΜΘ6; until then the latest chapter with exercises is «the current unit».

import { praiseKeys } from '../../audio/recordings.ts';
import { pick, shuffle } from '../../engine/rng.ts';
import { QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import type { Level, Round, RoundKind } from '../../engine/types.ts';
import type { PlayableGenerator, Problem } from '../../math-core/generators/types.ts';
import type { GenerateContext } from '../types.ts';

export const QUESTION_ID = 'question';

export interface QuestionItem {
  problem: Problem;
  generator: PlayableGenerator;
  praiseKey: string;
}

export interface Slot {
  generator: PlayableGenerator;
  level: Level;
}

export const isNumberSense = (g: { id: string }) => /^(count|subitize|put|line|cmp|qty|jar)\./.test(g.id);

/** Which generator and how hard, for each of the five questions. */
export function planRound(kind: RoundKind, generators: readonly PlayableGenerator[], fresh: readonly PlayableGenerator[], rng: () => number): Slot[] {
  const older = generators.filter((g) => !fresh.includes(g));
  const old = older.length > 0 ? older : fresh;
  let slots: Slot[];

  switch (kind) {
    case 'warmup':
      // all old, starting from the easiest
      slots = ([1, 1, 1, 2, 2] as Level[]).map((level) => ({ generator: pick(old, rng), level }));
      break;
    case 'workshop':
      // about 80% new
      slots = shuffle([pick(old, rng), pick(fresh, rng), pick(fresh, rng), pick(fresh, rng), pick(fresh, rng)], rng).map((generator, i) => ({
        generator,
        level: ([1, 1, 2, 2, 2] as Level[])[i]!,
      }));
      break;
    case 'mix':
      // ends with an easy question
      slots = ([2, 3, 2, 3] as Level[]).map((level, i) => ({ generator: pick(i % 2 === 0 ? fresh : old, rng), level }));
      slots.push({ generator: generators[0]!, level: 1 });
      break;
  }

  // PRD §7: in grade 1 every round has at least one number-sense question
  if (!slots.some((s) => isNumberSense(s.generator))) {
    const sense = (kind === 'warmup' ? old : fresh).filter(isNumberSense);
    const anySense = generators.filter(isNumberSense);
    const chosen = sense[sense.length - 1] ?? anySense[anySense.length - 1];
    if (chosen) slots[0] = { ...slots[0]!, generator: chosen };
  }
  return slots.slice(0, QUESTIONS_PER_ROUND);
}

export function generate(ctx: GenerateContext): Round {
  const keys = praiseKeys();
  const used = new Set<string>();
  const items: QuestionItem[] = [];
  for (const { generator, level } of planRound(ctx.roundKind, ctx.generators, ctx.fresh, ctx.rng)) {
    const problem = generator.produce({ rng: ctx.rng, level }, used);
    used.add(problem.key);
    const last = items[items.length - 1]?.praiseKey;
    items.push({ problem, generator, praiseKey: pick(keys.filter((k) => k !== last), ctx.rng) });
  }
  return { id: [QUESTION_ID, ctx.roundKind].join('-'), exerciseId: QUESTION_ID, seed: 0, level: ctx.level, items };
}
