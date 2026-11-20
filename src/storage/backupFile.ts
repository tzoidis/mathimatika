// The parent's backup file: all data as JSON.

import type { Dexie } from 'dexie';
import { exportTables, importTables, saveMigrationBackup, type Snapshot } from './backup.ts';
import { defaultSettings, type Settings } from './schema.ts';

export const BACKUP_APP = 'mathimatika';

export interface BackupFile {
  app: typeof BACKUP_APP;
  schemaVersion: number;
  exportedAt: number;
  tables: Snapshot;
}

/**
 * All data as a backup file. The file already records itself as the latest backup; the
 * device records it only once the file is saved (see the parent's backup section).
 */
export async function exportBackup(db: Dexie, now = Date.now()): Promise<BackupFile> {
  const tables = await exportTables(db);
  tables.settings = (tables.settings ?? []).map((s) => ({ ...(s as Settings), lastBackupAt: now }));
  return { app: BACKUP_APP, schemaVersion: db.verno, exportedAt: now, tables };
}

export class InvalidBackup extends Error {}

/**
 * Validates and restores a backup. The file is the whole state: a table it does not have
 * (one added since it was made) is emptied, so stars and Workshop items stay in step.
 * What was on the device is kept first, like before a migration.
 */
export async function importBackup(db: Dexie, file: unknown, now = Date.now(), backupsName?: string): Promise<void> {
  const f = file as Partial<BackupFile> | null;
  if (!f || f.app !== BACKUP_APP || typeof f.schemaVersion !== 'number' || typeof f.tables !== 'object' || f.tables === null) {
    throw new InvalidBackup('not a backup of this app');
  }
  if (f.schemaVersion > db.verno) throw new InvalidBackup('backup from a newer version of the app');
  const known = new Set(db.tables.map((t) => t.name));
  const tables: Snapshot = {};
  for (const [name, rows] of Object.entries(f.tables)) {
    if (!known.has(name)) continue;
    if (!Array.isArray(rows)) throw new InvalidBackup(`table ${name} is not a list`);
    if (!rows.every((r) => typeof r === 'object' && r !== null && !Array.isArray(r))) throw new InvalidBackup(`table ${name} has rows that are not records`);
    tables[name] = rows;
  }
  for (const name of known) tables[name] ??= [];
  await saveMigrationBackup({ dbName: db.name, fromVersion: db.verno, toVersion: db.verno, createdAt: now, data: await exportTables(db) }, backupsName);
  await importTables(db, tables);
  // A backup from an older version has no value for settings added since.
  await db.table('settings').toCollection().modify((s: Settings) => {
    Object.assign(s, { ...defaultSettings(s.childId), ...s });
  });
}

export function backupFileName(now = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `mathimatika-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

const MONTH_MS = 30 * 24 * 3600 * 1000;

/** Suggest a backup if there is something to lose and the last one is over a month old. */
export function backupDue(lastBackupAt: number | null, hasProgress: boolean, now = Date.now()): boolean {
  return hasProgress && (lastBackupAt === null || now - lastBackupAt > MONTH_MS);
}
