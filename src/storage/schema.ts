// Stored records. Tables for the review queue (ΜΘ6) and the world (ΜΘ5) are added
// by a migration in those milestones, with the shapes they need.

import type { Grade } from '../engine/types.ts';

export const DEFAULT_CHILD_ID = 'child-1';
export const DEFAULT_DAILY_LIMIT_MINUTES = 15;

export interface Child {
  id: string;
  name: string | null;
  createdAt: number;
  stars: number;
  /** rounds completed ever */
  roundsPlayed: number;
}

export interface Settings {
  childId: string;
  grade: Grade;
  /** «up to which unit» of the book (PRD §8, ΜΘ2); null = not set yet */
  upToUnit: string | null;
  /** «reads up to letter…»: number of graphemes taught, along content/letters.json (grades 1-2) */
  upToPosition: number;
  dailyLimitMinutes: number;
  leftHanded: boolean;
  /** 4-digit PIN; null = multiplication gate only */
  parentPin: string | null;
  lastBackupAt: number | null;
}

export interface DailyTime {
  /** `${childId}:${date}` */
  id: string;
  childId: string;
  /** local calendar date, YYYY-MM-DD */
  date: string;
  ms: number;
}

export function defaultSettings(childId: string): Settings {
  return {
    childId,
    grade: 1,
    upToUnit: null,
    upToPosition: 0,
    dailyLimitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
    leftHanded: false,
    parentPin: null,
    lastBackupAt: null,
  };
}

/** Local calendar date, so the daily limit resets at the child's midnight, not UTC's. */
export function localDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
