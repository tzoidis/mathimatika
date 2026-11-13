// Schema versions, oldest first. Never edit a released entry: append a new one.
// Before any upgrade, openDb() stores a snapshot of the old database.

import type { Transaction } from 'dexie';

export interface Migration {
  version: number;
  /** Dexie store definitions; only tables or indexes that change are needed */
  stores: Record<string, string | null>;
  upgrade?: (tx: Transaction) => void | PromiseLike<unknown>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    stores: {
      children: 'id',
      settings: 'childId',
      answers: 'id, childId, [childId+ts], [childId+exerciseId]',
      dailyTime: 'id, childId',
    },
  },
  {
    version: 2,
    stores: {},
    upgrade: (tx) => tx.table('settings').toCollection().modify((s: { upToPosition?: number }) => {
      s.upToPosition ??= 0;
    }),
  },
  {
    version: 3,
    stores: {},
    upgrade: (tx) => tx.table('settings').toCollection().modify((s: { seenDemos?: string[] }) => {
      s.seenDemos ??= [];
    }),
  },
  {
    version: 4,
    stores: { world: 'id, childId' },
  },
  {
    version: 5,
    stores: {},
    upgrade: (tx) => tx.table('settings').toCollection().modify((s: { focusSkill?: string | null }) => {
      s.focusSkill ??= null;
    }),
  },
  {
    version: 6,
    stores: {},
    upgrade: (tx) => tx.table('settings').toCollection().modify((s: { homeDone?: string[] }) => {
      s.homeDone ??= [];
    }),
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]!.version;
