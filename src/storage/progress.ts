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

/** Spends the stars on an item. False if they are not enough, or it is already there. */
export async function buyItem(db: MathDb, childId: string, itemId: string, price: number, now = Date.now()): Promise<boolean> {
  return db.transaction('rw', db.children, db.world, async () => {
    const child = await db.children.get(childId);
    const id = [childId, itemId].join(':');
    if (!child || child.stars < price || (await db.world.get(id))) return false;
    await db.children.put({ ...child, stars: child.stars - price });
    await db.world.add({ id, childId, itemId, placedAt: now });
    return true;
  });
}

/** What the child has chosen, oldest first. */
export async function ownedItems(db: MathDb, childId: string): Promise<string[]> {
  const items = await db.world.where('childId').equals(childId).toArray();
  return items.sort((a, b) => a.placedAt - b.placedAt).map((i) => i.itemId);
}
