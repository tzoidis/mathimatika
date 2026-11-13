import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import workshop from '../content/workshop.json';
import { ITEM_ART, ITEM_PLACES } from '../screens/workshop/art.tsx';
import { ROOM_ART, ROOM_PLACES, ROOM_SCENES } from '../screens/workshop/rooms.tsx';
import { ensureChild, openDb, type MathDb } from './db.ts';
import { buyItem, ownedItems } from './progress.ts';
import { DEFAULT_CHILD_ID } from './schema.ts';
import { currentRoom, justMoved, nextChoices, openRooms, roomChoices } from './workshop.ts';

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
  const art = { ...ITEM_ART, ...ROOM_ART };
  const places = { ...ITEM_PLACES, ...ROOM_PLACES };

  it('has rooms of 10-15 items, each item with a drawing and a place, each room with its scene', () => {
    for (const room of workshop.rooms) {
      const items = workshop.items.filter((i) => i.room === room.id);
      expect(items.length, room.id).toBeGreaterThanOrEqual(10);
      expect(items.length, room.id).toBeLessThanOrEqual(15);
      expect(ROOM_SCENES[room.id], room.id).toBeDefined();
    }
    for (const { id, room } of workshop.items) {
      expect(art[id], id).toBeDefined();
      expect(places[id], id).toBeDefined();
      expect(workshop.rooms.some((r) => r.id === room), id).toBe(true);
    }
    expect(new Set(workshop.items.map((i) => i.id)).size).toBe(workshop.items.length);
  });

  it('lasts a school year: about four sessions a week, three stars a session', () => {
    const stars = workshop.rooms.reduce((sum, r) => sum + r.price * workshop.items.filter((i) => i.room === r.id).length, 0);
    const sessions = stars / 3;
    expect(sessions).toBeGreaterThanOrEqual(90);
  });
});

describe('rooms', () => {
  const rooms = [
    { id: 'one', price: 3 },
    { id: 'two', price: 6 },
  ];
  const items = [
    { id: 'a', room: 'one' },
    { id: 'b', room: 'one' },
    { id: 'c', room: 'two' },
  ];

  it('fills the first room, then moves to the next at its price', () => {
    expect(roomChoices(rooms, items, [], 3)).toEqual({ room: rooms[0], choices: ['a', 'b'] });
    expect(roomChoices(rooms, items, ['a', 'b'], 5).choices).toEqual([]);
    expect(roomChoices(rooms, items, ['a', 'b'], 6)).toEqual({ room: rooms[1], choices: ['c'] });
  });

  it('never offers two rooms at once', () => {
    expect(roomChoices(rooms, items, ['a'], 9).choices).toEqual(['b']);
  });

  it('opens the rooms up to the current one, and knows the move', () => {
    expect(openRooms(rooms, items, ['a']).map((r) => r.id)).toEqual(['one']);
    expect(openRooms(rooms, items, ['a', 'b']).map((r) => r.id)).toEqual(['one', 'two']);
    expect(justMoved(rooms, items, ['a', 'b'])).toBe(true);
    expect(justMoved(rooms, items, ['a', 'b', 'c'])).toBe(false);
    expect(currentRoom(rooms, items, ['a', 'b', 'c']).id).toBe('two');
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
