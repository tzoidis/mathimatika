// Fills a round from what the class has reached and how the child is doing (PRD §6):
// each skill is played at its stage, the warm-up takes what is due for review, a new
// skill is practised on its own, and after two hard questions comes an easy one.

import { praiseKeys } from '../../audio/recordings.ts';
import { isDue, isNew, type SkillProgress } from '../../engine/adaptive.ts';
import { pick, shuffle } from '../../engine/rng.ts';
import { QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import type { Level, Round, RoundKind, SkillId } from '../../engine/types.ts';
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

export interface Adapt {
  progress: ReadonlyMap<SkillId, SkillProgress>;
  /** local date, YYYY-MM-DD */
  today: string;
  /** the parent's «practise this»: it fills the workshop round */
  focus: SkillId | null;
}

export const NO_HISTORY: Adapt = { progress: new Map(), today: '2000-01-01', focus: null };

/** Two hard questions in a row, and the next one is easy (PRD §6). */
const HARD_IN_A_ROW = 2;

/** Which generator and how hard, for each of the five questions. */
export function planRound(kind: RoundKind, generators: readonly PlayableGenerator[], fresh: readonly PlayableGenerator[], rng: () => number, adapt: Adapt = NO_HISTORY): Slot[] {
  const older = generators.filter((g) => !fresh.includes(g));
  const old = older.length > 0 ? older : fresh;
  const progressOf = (g: PlayableGenerator) => adapt.progress.get(g.skill);
  const stageOf = (g: PlayableGenerator): Level => progressOf(g)?.stage ?? 1;
  let chosen: PlayableGenerator[];

  switch (kind) {
    case 'warmup': {
      // what is due comes first, the longest overdue first; the rest from older work
      const due = shuffle(old.filter((g) => isDue(progressOf(g), adapt.today)), rng).sort((a, b) => progressOf(a)!.dueDay!.localeCompare(progressOf(b)!.dueDay!));
      chosen = due.slice(0, QUESTIONS_PER_ROUND);
      while (chosen.length < QUESTIONS_PER_ROUND) chosen.push(pick(old, rng));
      break;
    }
    case 'workshop': {
      const focus = generators.filter((g) => g.skill === adapt.focus);
      const brandNew = fresh.filter((g) => isNew(progressOf(g)));
      if (focus.length > 0) chosen = Array.from({ length: QUESTIONS_PER_ROUND }, () => pick(focus, rng));
      // a new skill on its own for its first days, then mixed half and half with older ones
      else if (brandNew.length > 0) chosen = Array.from({ length: QUESTIONS_PER_ROUND }, () => pick(brandNew, rng));
      else chosen = shuffle([pick(fresh, rng), pick(fresh, rng), pick(fresh, rng), pick(old, rng), pick(old, rng)], rng);
      break;
    }
    case 'mix':
      chosen = Array.from({ length: QUESTIONS_PER_ROUND - 1 }, (_, i) => pick(i % 2 === 0 ? fresh : old, rng));
      break;
  }

  // PRD §7: in grade 1 every round has at least one number-sense question; with a new or
  // chosen skill it takes one place of five, so that skill still has the round to itself
  if (!chosen.some(isNumberSense) && kind !== 'mix') {
    const sense = (kind === 'warmup' ? old : fresh).filter(isNumberSense);
    const anySense = generators.filter(isNumberSense);
    const replacement = sense[sense.length - 1] ?? anySense[anySense.length - 1];
    if (replacement) chosen[0] = replacement;
  }

  let slots: Slot[] = chosen.map((generator) => ({ generator, level: stageOf(generator) }));
  // the warm-up starts from the easiest
  if (kind === 'warmup') slots = [...slots].sort((a, b) => a.level - b.level);
  // the mix ends with an easy question, and keeps one of number sense
  if (kind === 'mix') {
    const sense = generators.filter(isNumberSense);
    slots.push({ generator: sense[0] ?? generators[0]!, level: 1 });
  }

  let hard = 0;
  return slots.map((slot) => {
    if (hard >= HARD_IN_A_ROW) {
      hard = 0;
      return { ...slot, level: 1 as Level };
    }
    hard = slot.level === 3 ? hard + 1 : 0;
    return slot;
  });
}

export function generate(ctx: GenerateContext): Round {
  const keys = praiseKeys();
  const used = new Set<string>();
  const items: QuestionItem[] = [];
  for (const { generator, level } of planRound(ctx.roundKind, ctx.generators, ctx.fresh, ctx.rng, ctx.adapt)) {
    const problem = generator.produce({ rng: ctx.rng, level }, used);
    used.add(problem.key);
    const last = items[items.length - 1]?.praiseKey;
    items.push({ problem, generator, praiseKey: pick(keys.filter((k) => k !== last), ctx.rng) });
  }
  return { id: [QUESTION_ID, ctx.roundKind].join('-'), exerciseId: QUESTION_ID, seed: 0, level: ctx.level, items };
}
