// Progress per skill (PRD §6, §8), worked out from the answers alone: nothing is stored
// beside them, so it can never drift from what the child actually did, and clearing the
// answers resets it. Only first attempts count. Latency plays no part.

import type { MisconceptionCode } from '../math-core/check.ts';
import type { AnswerLog, Level, SkillId } from './types.ts';

export type SkillState = 'notStarted' | 'practising' | 'stabilising' | 'mastered';

/** PRD §6: review after 1, 3, 7, 14 and 30 days; a miss starts again from the first. */
export const REVIEW_DAYS = [1, 3, 7, 14, 30];
/** A skill is new, and practised on its own, on its first this many days. */
export const NEW_DAYS = 3;
const WINDOW = 5;
const WINDOW_RIGHT = 4;
const GOOD_DAYS_TO_RISE = 2;
const MISSES_TO_FALL = 2;
const MASTERY_DAYS = 3;
const MASTERY_GAP_DAYS = 7;
/** A mistake is «the usual one» only once it has happened this often. */
const DOMINANT_MIN = 2;

export interface SkillProgress {
  skill: SkillId;
  /** 1 concrete, 2 pictorial, 3 symbolic: the level its generators are played at */
  stage: Level;
  state: SkillState;
  /** questions answered (first attempts) */
  attempts: number;
  /** of those, how many needed a second try or the answer shown */
  helped: number;
  /** different days it was practised */
  days: number;
  lastDay: string | null;
  /** the day its review falls due; null before the first practice */
  dueDay: string | null;
  dominant: { code: MisconceptionCode; given: string; target: string } | null;
}

/** 'YYYY-MM-DD' to a day count, for differences between days. */
export function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.round(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

export function addDays(day: string, n: number): string {
  const date = new Date((dayNumber(day) + n) * 86_400_000);
  const pad = (v: number) => String(v).padStart(2, '0');
  return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join('-');
}

export const isNew = (p: SkillProgress | undefined): boolean => !p || p.days < NEW_DAYS;
export const isDue = (p: SkillProgress | undefined, today: string): boolean => !!p?.dueDay && dayNumber(p.dueDay) <= dayNumber(today);

export function skillProgress(skill: SkillId, answers: readonly AnswerLog[], dateOf: (ts: number) => string): SkillProgress {
  const firsts = answers.filter((a) => a.attempt === 1).sort((a, b) => a.ts - b.ts);

  let stage: Level = 1;
  let misses = 0;
  let goodDays = new Set<string>();
  let todayAtStage = new Map<string, boolean[]>();
  const symbolicDays: string[] = [];
  const byDay = new Map<string, boolean>();
  const codes = new Map<MisconceptionCode, AnswerLog[]>();

  for (const a of firsts) {
    const day = dateOf(a.ts);
    if (a.correct && stage === 3 && !symbolicDays.includes(day)) symbolicDays.push(day);
    byDay.set(day, (byDay.get(day) ?? true) && a.correct);
    if (!a.correct && a.code) codes.set(a.code, [...(codes.get(a.code) ?? []), a]);

    const results = [...(todayAtStage.get(day) ?? []), a.correct];
    todayAtStage.set(day, results);
    misses = a.correct ? 0 : misses + 1;

    if (misses >= MISSES_TO_FALL) {
      stage = Math.max(1, stage - 1) as Level;
      misses = 0;
      goodDays = new Set();
      todayAtStage = new Map();
      continue;
    }
    const recent = results.slice(-WINDOW);
    if (recent.length === WINDOW && recent.filter(Boolean).length >= WINDOW_RIGHT) goodDays.add(day);
    if (goodDays.size >= GOOD_DAYS_TO_RISE && stage < 3) {
      stage = (stage + 1) as Level;
      goodDays = new Set();
      todayAtStage = new Map();
    }
  }

  // review box: a clean day moves it on, any miss sends it back to the start
  let box = -1;
  for (const clean of byDay.values()) box = clean ? Math.min(box + 1, REVIEW_DAYS.length - 1) : 0;
  const days = [...byDay.keys()];
  const lastDay = days[days.length - 1] ?? null;

  const gaps = symbolicDays.slice(1).map((d, i) => dayNumber(d) - dayNumber(symbolicDays[i]!));
  const mastered = symbolicDays.length >= MASTERY_DAYS && gaps.some((g) => g >= MASTERY_GAP_DAYS);

  let dominant: SkillProgress['dominant'] = null;
  for (const [code, list] of codes) {
    if (list.length >= DOMINANT_MIN && (!dominant || list.length > codes.get(dominant.code)!.length)) {
      const latest = list[list.length - 1]!;
      dominant = { code, given: latest.given, target: latest.target };
    }
  }

  return {
    skill,
    stage,
    state: firsts.length === 0 ? 'notStarted' : mastered ? 'mastered' : stage === 3 ? 'stabilising' : 'practising',
    attempts: firsts.length,
    helped: firsts.filter((a) => !a.correct).length,
    days: days.length,
    lastDay,
    dueDay: lastDay === null ? null : addDays(lastDay, REVIEW_DAYS[Math.max(box, 0)]!),
    dominant,
  };
}

/** Progress of every skill that has answers; `skillOf` maps an exercise id to its skill. */
export function progressBySkill(answers: readonly AnswerLog[], skillOf: (exerciseId: string) => SkillId | undefined, dateOf: (ts: number) => string): Map<SkillId, SkillProgress> {
  const bySkill = new Map<SkillId, AnswerLog[]>();
  for (const a of answers) {
    const skill = skillOf(a.exerciseId);
    if (skill) bySkill.set(skill, [...(bySkill.get(skill) ?? []), a]);
  }
  return new Map([...bySkill].map(([skill, list]) => [skill, skillProgress(skill, list, dateOf)]));
}

/** Why a skill comes up next, for the parent (PRD §8). */
export type Reason = { kind: 'focus' } | { kind: 'new' } | { kind: 'due'; days: number } | { kind: 'current' } | { kind: 'later'; days: number } | { kind: 'notStarted' };

export function reasonFor(p: SkillProgress | undefined, opts: { focus: boolean; current: boolean; today: string }): Reason {
  if (opts.focus) return { kind: 'focus' };
  if (!p || p.attempts === 0) return { kind: 'notStarted' };
  if (opts.current && isNew(p)) return { kind: 'new' };
  if (isDue(p, opts.today)) return { kind: 'due', days: dayNumber(opts.today) - dayNumber(p.lastDay!) };
  if (opts.current) return { kind: 'current' };
  return { kind: 'later', days: dayNumber(p.dueDay!) - dayNumber(opts.today) };
}
