import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { backupDue, backupFileName, exportBackup, importBackup, InvalidBackup } from './backupFile.ts';
import { listMigrationBackups } from './backup.ts';
import { ensureChild, openDb, type MathDb } from './db.ts';
import { DEFAULT_CHILD_ID } from './schema.ts';

let n = 0;
const dbs: MathDb[] = [];
afterEach(() => dbs.splice(0).forEach((d) => d.close()));
async function freshDb() {
  const db = await openDb({ name: `bf-${++n}`, backupsName: `bf-backups-${n}` });
  dbs.push(db);
  return db;
}

async function seeded() {
  const db = await freshDb();
  await ensureChild(db);
  await db.settings.update(DEFAULT_CHILD_ID, { dailyLimitMinutes: 20, leftHanded: true });
  await db.answers.add({ id: 'a1', childId: DEFAULT_CHILD_ID, ts: 1, exerciseId: 'x', itemId: 'fact:3+4', target: '7', given: '6', correct: false, attempt: 1, soundsRight: false, usedListen: false, latencyMs: 5, position: 0 });
  return db;
}

describe('backup file', () => {
  it('restores progress and settings completely, through JSON', async () => {
    const source = await seeded();
    const file = JSON.parse(JSON.stringify(await exportBackup(source, 99)));
    const target = await freshDb();
    await importBackup(target, file);

    // the file records itself as the latest backup
    expect(await target.settings.get(DEFAULT_CHILD_ID)).toEqual({ ...(await source.settings.get(DEFAULT_CHILD_ID)), lastBackupAt: 99 });
    expect(await target.answers.toArray()).toEqual(await source.answers.toArray());
  });

  it('fills in settings that did not exist when an older backup was made', async () => {
    const source = await seeded();
    const file = JSON.parse(JSON.stringify(await exportBackup(source, 99)));
    delete file.tables.settings[0].upToPosition;
    file.schemaVersion = 1;
    const target = await freshDb();
    await importBackup(target, file);

    expect(await target.settings.get(DEFAULT_CHILD_ID)).toMatchObject({ upToPosition: 0, dailyLimitMinutes: 20, leftHanded: true });
  });

  it('keeps a copy of the device first, and empties tables the file does not have', async () => {
    const source = await seeded();
    const file = JSON.parse(JSON.stringify(await exportBackup(source, 99)));
    delete file.tables.world;
    const target = await freshDb();
    await ensureChild(target);
    await target.world.add({ id: `${DEFAULT_CHILD_ID}:boat`, childId: DEFAULT_CHILD_ID, itemId: 'boat', placedAt: 1 });
    await importBackup(target, file, 5, `bf-backups-${n}`);

    expect(await target.world.count()).toBe(0);
    const [kept] = await listMigrationBackups(`bf-backups-${n}`);
    expect(kept?.data.world).toHaveLength(1);
  });

  it('rejects rows that are not records, and leaves the device as it was', async () => {
    const db = await seeded();
    const file = JSON.parse(JSON.stringify(await exportBackup(db, 99)));
    file.tables.answers = [1, 2];
    await expect(importBackup(db, file)).rejects.toBeInstanceOf(InvalidBackup);
    expect(await db.answers.count()).toBe(1);
  });

  it('rejects files that are not backups, from Glossa, or from a newer app', async () => {
    const db = await freshDb();
    await expect(importBackup(db, { hello: 1 })).rejects.toBeInstanceOf(InvalidBackup);
    await expect(importBackup(db, { app: 'glossa', schemaVersion: 1, tables: {} })).rejects.toBeInstanceOf(InvalidBackup);
    await expect(importBackup(db, { app: 'mathimatika', schemaVersion: 999, tables: {} })).rejects.toBeInstanceOf(InvalidBackup);
  });

  it('names files by date and reminds monthly', () => {
    expect(backupFileName(new Date(2026, 9, 30).getTime())).toBe('mathimatika-backup-2026-10-30.json');
    const now = 100 * 24 * 3600 * 1000;
    expect(backupDue(null, false, now)).toBe(false);
    expect(backupDue(null, true, now)).toBe(true);
    expect(backupDue(now - 10 * 24 * 3600 * 1000, true, now)).toBe(false);
    expect(backupDue(now - 40 * 24 * 3600 * 1000, true, now)).toBe(true);
  });
});
