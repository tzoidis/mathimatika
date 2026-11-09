// Shared records. AnswerLog has the same shape as Glossa's (PRD §9).

export type Grade = 1 | 2 | 3 | 4 | 5 | 6;
export type Level = 1 | 2 | 3;

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
}
