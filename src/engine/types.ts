// Shared records. AnswerLog has the same shape as Glossa's (PRD §9), plus `code`.

import type { MisconceptionCode } from '../math-core/check.ts';

export type Grade = 1 | 2 | 3 | 4 | 5 | 6;
export type Level = 1 | 2 | 3;

export type SkillId = `${Grade}.${string}`;

export const REPRESENTATION_KINDS = ['tenFrame', 'dienes', 'numberLine', 'balance', 'jar', 'digits', 'counters', 'fractionBar', 'shapes', 'grid', 'coins', 'calendar'] as const;
export type RepresentationKind = (typeof REPRESENTATION_KINDS)[number];

/** Stable across books; which chapter teaches it lives in the book map (PRD §3). */
export interface Skill {
  id: SkillId;
  title: string;
  requires: SkillId[];
  generators: string[];
  representations: RepresentationKind[];
}

export interface SkillGraph {
  grade: Grade;
  skills: Skill[];
}

export interface Unit {
  id: string;
  order: number;
  /** heading the unit is listed under */
  section: string;
  title: string;
  skills: SkillId[];
  /** a revision or assessment chapter: it teaches nothing new, so it has no skills */
  review?: boolean;
}

export interface Curriculum {
  grade: Grade;
  book: string;
  units: Unit[];
}

/** The fixed order of a session's rounds (PRD §6). */
export type RoundKind = 'warmup' | 'workshop' | 'mix';

export interface Round {
  id: string;
  exerciseId: string;
  seed: number;
  level: Level;
  items: unknown[];
}

export interface AnswerLog {
  id: string;
  childId: string;
  ts: number;
  exerciseId: string;
  itemId: string;
  target: string;
  given: string;
  correct: boolean;
  /** only attempt 1 counts for statistics and adaptive */
  attempt: 1 | 2;
  soundsRight: boolean;
  /** child pressed "listen"; in grades 1-2 this does not count as help (PRD §7) */
  usedListen: boolean;
  /** never shown anywhere; ignored above ~20 s (PRD §6) */
  latencyMs: number;
  /** question index within the round */
  position: number;
  /** the mistake a detector named, on a wrong answer; for the parent's skill map */
  code?: MisconceptionCode;
  /** «Δεν ξέρω ακόμα»: the worked example was asked for; counts as help, never as a mistake */
  askedHelp?: true;
}
