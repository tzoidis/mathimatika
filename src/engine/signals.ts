// Observations worth talking over with the teacher (PRD §8). No diagnosis: they are
// shown only to the parent, only once they have lasted at least three weeks and twenty
// attempts, and in words that never name a condition. Derived from the answers, never
// stored. Only first attempts count, never speed.

import type { AnswerLog } from './types.ts';

export type SignalKind = 'subitize' | 'compare' | 'line';

export interface Signal {
  kind: SignalKind;
  attempts: number;
  /** first attempts right, in this window */
  right: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const MIN_ATTEMPTS = 20;
export const MIN_DAYS = 21;
/** below this share right, a skill is an observation (PRD §8: «ακρίβεια < 80%») */
const RIGHT_BELOW = 0.8;
/** a tap this far from the number on the 0-20 line is a big miss */
const FAR = 3;

/** The 1st of January of the school year an answer belongs to: four months after it starts in September. */
function fourthMonth(ts: number): number {
  const d = new Date(ts);
  const year = d.getMonth() >= 8 ? d.getFullYear() + 1 : d.getFullYear();
  return new Date(year, 0, 1).getTime();
}

interface Rule {
  kind: SignalKind;
  /** the answers the rule looks at */
  pick(a: AnswerLog): boolean;
  /** whether a first attempt counts as a miss for this rule */
  miss(a: AnswerLog): boolean;
}

const RULES: Rule[] = [
  {
    // seeing 1-4 at a glance, from the fourth month of grade 1
    kind: 'subitize',
    pick: (a) => a.exerciseId === 'subitize.to5' && Number(a.target) <= 4 && a.ts >= fourthMonth(a.ts),
    miss: (a) => !a.correct,
  },
  {
    // comparing one-digit numbers and quantities
    kind: 'compare',
    pick: (a) => ['cmp.sign.to10', 'qty.to5', 'qty.to10'].includes(a.exerciseId),
    miss: (a) => !a.correct,
  },
  {
    // far from the place on the 0-20 line
    kind: 'line',
    pick: (a) => a.exerciseId === 'line.place.to20',
    miss: (a) => !a.correct && (a.given === '' || Math.abs(Number(a.given) - Number(a.target)) >= FAR),
  },
];

/**
 * The observations that hold: enough attempts over enough days, and the share right is
 * low both in the earlier and in the later half, so it has not been getting better.
 */
export function teacherSignals(answers: readonly AnswerLog[]): Signal[] {
  const signals: Signal[] = [];
  for (const rule of RULES) {
    const firsts = answers.filter((a) => a.attempt === 1 && !a.askedHelp && rule.pick(a)).sort((x, y) => x.ts - y.ts);
    if (firsts.length < MIN_ATTEMPTS) continue;
    if (firsts[firsts.length - 1]!.ts - firsts[0]!.ts < MIN_DAYS * DAY_MS) continue;
    const half = Math.floor(firsts.length / 2);
    const rightShare = (part: AnswerLog[]) => part.filter((a) => !rule.miss(a)).length / part.length;
    if (rightShare(firsts.slice(0, half)) >= RIGHT_BELOW || rightShare(firsts.slice(half)) >= RIGHT_BELOW) continue;
    signals.push({ kind: rule.kind, attempts: firsts.length, right: firsts.filter((a) => !rule.miss(a)).length });
  }
  return signals;
}
