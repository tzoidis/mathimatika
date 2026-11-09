// What a session writes: answers and stars.

import type { AnswerLog } from '../engine/types.ts';
import type { MathDb } from './db.ts';
import type { Child } from './schema.ts';

export async function recordAnswer(db: MathDb, answer: AnswerLog): Promise<void> {
  await db.answers.add(answer);
}

/** A star for finishing the round, whatever the accuracy. */
export async function completeRound(db: MathDb, childId: string): Promise<Child | undefined> {
  return db.transaction('rw', db.children, async () => {
    const child = await db.children.get(childId);
    if (!child) return undefined;
    const updated: Child = { ...child, stars: child.stars + 1, roundsPlayed: child.roundsPlayed + 1 };
    await db.children.put(updated);
    return updated;
  });
}
