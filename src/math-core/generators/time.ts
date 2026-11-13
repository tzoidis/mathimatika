// Grade 1, ch. 41 «Ο χρόνος»: pictures of an everyday story put in order, the dates of
// yesterday and tomorrow on the calendar cards, the seasons, and which day of the week
// a date of the month falls on. Everything is data; the drawings are in exercises/question.

import { pick, randInt, shuffle } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio } from '../rational.ts';
import { given } from './number.ts';
import { DAYS, dayAfter } from './tens.ts';
import type { Choice, GenCtx, Generator } from './types.ts';

// ---------- what happened first (photos in time order) ----------

/** Stories of three pictures, each drawn in exercises/question/time.tsx. */
export const STORIES = ['seed', 'egg', 'snowman', 'glass', 'apple', 'candle'] as const;
export type Story = (typeof STORIES)[number];
export type OrderAsk = 'first' | 'middle' | 'last';

export interface OrderParams {
  story: Story;
  /** the pictures as they are shown, by their place in the story (1-3) */
  shown: number[];
  ask: OrderAsk;
}

const STAGE: Record<OrderAsk, number> = { first: 1, middle: 2, last: 3 };

export function orderGenerator(id: string, skill: SkillId): Generator<OrderParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({
      story: pick(STORIES, rng),
      shown: shuffle([1, 2, 3], rng),
      ask: level === 1 ? 'first' : level === 2 ? pick(['first', 'last'] as const, rng) : pick(['first', 'middle', 'last'] as const, rng),
    }),
    // never already in order: the child has to look
    constraints: [(p) => p.shown.length === 3 && new Set(p.shown).size === 3, (p) => p.shown.join() !== '1,2,3'],
    key: (p) => [id, p.story, p.shown.join(''), p.ask].join(':'),
    build: (p) => ({
      answer: ratio(STAGE[p.ask]),
      scene: { kind: 'order', story: p.story, shown: p.shown, ask: p.ask },
      say: [{ instruction: `order-${p.ask}` }],
      answerMode: 'pictures',
      choices: p.shown.map((stage): Choice => ({ label: String(stage), value: stage })),
    }),
    detectors: [
      {
        // the end of the story for its beginning, or the other way round
        code: 'WRONG_DIRECTION',
        hintId: 'order-think',
        simulate: (p) => (p.ask === 'middle' ? null : ratio(4 - STAGE[p.ask])),
        detect: (p, a) => p.ask !== 'middle' && given(4 - STAGE[p.ask], a),
      },
    ],
  };
}

// ---------- yesterday, today, tomorrow on the calendar cards ----------

export interface DatesParams {
  /** today's date of the month */
  today: number;
  offset: -2 | -1 | 1 | 2;
}

/** The first and last date of the month a question may start from, so it never turns the month. */
const FIRST_TODAY = 3;
const LAST_TODAY = 28;
const DATE_ASK: Record<DatesParams['offset'], string> = { [-2]: 'date-ask-before', [-1]: 'date-ask-yesterday', 1: 'date-ask-tomorrow', 2: 'date-ask-after' };

export function datesGenerator(id: string, skill: SkillId): Generator<DatesParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({
      today: level === 1 ? randInt(FIRST_TODAY, 9, rng) : randInt(FIRST_TODAY, LAST_TODAY, rng),
      offset: level === 3 ? pick([-2, -1, 1, 2] as const, rng) : pick([-1, 1] as const, rng),
    }),
    constraints: [(p) => p.today >= FIRST_TODAY && p.today <= LAST_TODAY],
    key: (p) => [id, p.today, p.offset].join(':'),
    build: (p) => ({
      answer: ratio(p.today + p.offset),
      scene: { kind: 'dates', today: p.today, offset: p.offset },
      say: [{ instruction: 'today-is' }, { number: p.today, gender: 'f' }, { instruction: DATE_ASK[p.offset] }],
    }),
    detectors: [
      {
        code: 'WRONG_DIRECTION',
        hintId: 'dates-order',
        simulate: (p) => ratio(p.today - p.offset),
        detect: (p, a) => given(p.today - p.offset, a),
      },
      {
        // today's own date, or one card too far or too near
        code: 'OFF_BY_ONE',
        hintId: 'dates-order',
        simulate: (p) => ratio(p.today),
        detect: (p, a) => given(p.today, a) || given(p.today + p.offset + Math.sign(p.offset), a) || (Math.abs(p.offset) === 2 && given(p.today + Math.sign(p.offset), a)),
      },
    ],
  };
}

// ---------- the seasons ----------

/** 1 spring, 2 summer, 3 autumn, 4 winter, as the book lists them */
export const SEASONS = 4;

/** What happens when; the first four are seen in nature, the rest are days of the year. */
export const SEASON_EVENTS: Record<string, number> = {
  flowers: 1,
  sea: 2,
  leaves: 3,
  snow: 4,
  easter: 1,
  mayday: 1,
  'school-closes': 2,
  'school-opens': 3,
  christmas: 4,
};
const NATURE = ['flowers', 'sea', 'leaves', 'snow'];
const DAYS_OF_YEAR = Object.keys(SEASON_EVENTS).filter((e) => !NATURE.includes(e));

export interface SeasonParams {
  event: string;
}

export const seasonAfter = (season: number) => (season % SEASONS) + 1;

export function seasonGenerator(id: string, skill: SkillId): Generator<SeasonParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ event: pick(level === 1 ? NATURE : level === 2 ? DAYS_OF_YEAR : Object.keys(SEASON_EVENTS), rng) }),
    constraints: [(p) => p.event in SEASON_EVENTS],
    key: (p) => [id, p.event].join(':'),
    build: (p) => ({
      answer: ratio(SEASON_EVENTS[p.event]!),
      scene: { kind: 'season', event: p.event },
      say: [{ instruction: `season-${p.event}` }],
      answerMode: 'pictures',
      choices: [1, 2, 3, 4].map((s): Choice => ({ label: String(s), value: s })),
    }),
    detectors: [
      {
        // the season just before or after
        code: 'OFF_BY_ONE',
        hintId: 'seasons-order',
        simulate: (p) => ratio(seasonAfter(SEASON_EVENTS[p.event]!)),
        detect: (p, a) => {
          const s = SEASON_EVENTS[p.event]!;
          return given(seasonAfter(s), a) || given(seasonAfter(seasonAfter(seasonAfter(s))), a);
        },
      },
    ],
  };
}

// ---------- which day a date falls on ----------

export interface MonthParams {
  /** the day of the week of the 1st, 1 Monday … 7 Sunday */
  first: number;
  /** how many days the month has */
  length: 30 | 31;
  date: number;
}

export const weekdayOf = (p: Pick<MonthParams, 'first' | 'date'>) => dayAfter(p.first, p.date - 1);

export function monthGenerator(id: string, skill: SkillId): Generator<MonthParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const length = pick([30, 31] as const, rng);
      return { first: randInt(1, DAYS, rng), length, date: randInt(1, level === 1 ? DAYS : level === 2 ? 21 : length, rng) };
    },
    // the month fits in six rows of the calendar
    constraints: [(p) => p.date >= 1 && p.date <= p.length, (p) => p.first - 1 + p.length <= 6 * DAYS],
    key: (p) => [id, p.first, p.length, p.date].join(':'),
    build: (p) => ({
      answer: ratio(weekdayOf(p)),
      scene: { kind: 'month', first: p.first, length: p.length, date: p.date },
      say: [{ instruction: 'month-on' }, { number: p.date, gender: 'f' }, { instruction: 'month-ask' }],
      answerMode: 'week',
    }),
    detectors: [
      {
        // a column to the side
        code: 'OFF_BY_ONE',
        hintId: 'month-column',
        simulate: (p) => ratio(dayAfter(weekdayOf(p), 1)),
        detect: (p, a) => given(dayAfter(weekdayOf(p), 1), a) || given(dayAfter(weekdayOf(p), -1), a),
      },
    ],
  };
}
