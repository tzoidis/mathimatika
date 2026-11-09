// The garden of facts (PRD §6): seed, sprout or flower. It shows mastery, never speed,
// so latency plays no part here and nothing ever wilts.

import type { AnswerLog } from './types.ts';

export type FactStage = 'seed' | 'sprout' | 'flower';

/** Right first time on this many different days makes a flower. */
export const FLOWER_DAYS = 3;

/** Stages by fact id; a fact with no answers yet is simply absent, that is, a seed. */
export function factStages(answers: readonly AnswerLog[], dateOf: (ts: number) => string): Map<string, FactStage> {
  const days = new Map<string, Set<string>>();
  for (const a of answers) {
    if (!a.correct || a.attempt !== 1) continue;
    days.set(a.itemId, (days.get(a.itemId) ?? new Set()).add(dateOf(a.ts)));
  }
  const stages = new Map<string, FactStage>();
  for (const [id, seen] of days) stages.set(id, seen.size >= FLOWER_DAYS ? 'flower' : 'sprout');
  return stages;
}
