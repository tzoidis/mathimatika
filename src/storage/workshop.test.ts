import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import workshop from '../content/workshop.json';
import { ITEM_ART, ITEM_PLACES } from '../screens/workshop/art.tsx';
import { ensureChild, openDb, type MathDb } from './db.ts';
import { buyItem, ownedItems } from './progress.ts';
import { DEFAULT_CHILD_ID } from './schema.ts';
import { nextChoices } from './workshop.ts';

let n = 0;
const dbs: MathDb[] = [];
afterEach(() => dbs.splice(0).forEach((d) => d.close()));

async function withStars(stars: number) {
  const db = await openDb({ name: `ws-${++n}`, backupsName: `ws-backups-${n}` });
  dbs.push(db);
  await ensureChild(db);
  await db.children.update(DEFAULT_CHILD_ID, { stars });
  return db;
}

describe('the catalogue', () => {
  it('has between 10 and 15 items, each with a drawing and a place', () => {
    expect(workshop.items.length).toBeGreaterThanOrEqual(10);
    expect(workshop.items.length).toBeLessThanOrEqual(15);
    for (const { id } of workshop.items) {
      expect(ITEM_ART[id], id).toBeDefined();
      expect(ITEM_PLACES[id], id).toBeDefined();
    }
  });
});

describe('what is offered', () => {
  const all = ['a', 'b', 'c'];

  it('offers nothing until the stars are there', () => {
    expect(nextChoices(all, [], 2, 3)).toEqual([]);
  });

  it('offers two, in order, skipping what is owned', () => {
    expect(nextChoices(all, [], 3, 3)).toEqual(['a', 'b']);
    expect(nextChoices(all, ['a'], 9, 3)).toEqual(['b', 'c']);
  });

  it('offers what is left at the end, then nothing', () => {
    expect(nextChoices(all, ['a', 'b'], 3, 3)).toEqual(['c']);
    expect(nextChoices(all, ['a', 'b', 'c'], 30, 3)).toEqual([]);
  });
});

describe('buying', () => {
  it('spends the stars and keeps the item', async () => {
    const db = await withStars(5);
    expect(await buyItem(db, DEFAULT_CHILD_ID, 'lamp', 3, 1000)).toBe(true);
    expect((await db.children.get(DEFAULT_CHILD_ID))?.stars).toBe(2);
    expect(await ownedItems(db, DEFAULT_CHILD_ID)).toEqual(['lamp']);
  });

  it('refuses without enough stars, and takes nothing', async () => {
    const db = await withStars(2);
    expect(await buyItem(db, DEFAULT_CHILD_ID, 'lamp', 3)).toBe(false);
    expect((await db.children.get(DEFAULT_CHILD_ID))?.stars).toBe(2);
    expect(await ownedItems(db, DEFAULT_CHILD_ID)).toEqual([]);
  });

  it('never charges twice for the same item', async () => {
    const db = await withStars(9);
    await buyItem(db, DEFAULT_CHILD_ID, 'lamp', 3);
    expect(await buyItem(db, DEFAULT_CHILD_ID, 'lamp', 3)).toBe(false);
    expect((await db.children.get(DEFAULT_CHILD_ID))?.stars).toBe(6);
  });

  it('lists items in the order they were chosen', async () => {
    const db = await withStars(9);
    await buyItem(db, DEFAULT_CHILD_ID, 'mill', 3, 2000);
    await buyItem(db, DEFAULT_CHILD_ID, 'bench', 3, 3000);
    expect(await ownedItems(db, DEFAULT_CHILD_ID)).toEqual(['mill', 'bench']);
  });
});
