// PRD §9-10: every generator × level × 1.000 seeds.

import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../engine/rng.ts';
import type { Level } from '../../engine/types.ts';
import { formatNumber } from '../format.ts';
import { equals, ratio } from '../rational.ts';
import { ALL_GENERATORS, GENERATORS } from './index.ts';
import type { CountParams } from './number.ts';
import { playable, type Generator, type Problem, type Scene } from './types.ts';

const SEEDS = 1000;
const LEVELS: Level[] = [1, 2, 3];
const ALL = ALL_GENERATORS;
const named = (id: string) => ALL.find((g) => g.id === id)!;

/** Works the answer out from what is on the screen, without using the generator's own arithmetic. */
function answerFromScene(scene: Scene): number {
  switch (scene.kind) {
    case 'count':
      return scene.arrangement === 'scattered' ? scene.cells.length : Array.from({ length: scene.n }).length;
    case 'add':
      return [...Array(scene.a), ...Array(scene.b)].length;
    case 'house': {
      let count = 0;
      for (let part = scene.known; part < scene.whole; part++) count++;
      return count;
    }
    case 'put':
    case 'subitize':
      return scene.n;
    case 'line':
      return scene.target;
    case 'compare':
      return scene.a < scene.b ? -1 : scene.a > scene.b ? 1 : 0;
    case 'quantity': {
      const leftHasMore = scene.left > scene.right;
      return (scene.ask === 'more') === leftHasMore ? -1 : 1;
    }
    case 'jar':
      return scene.cells.length;
    case 'balance':
    case 'missing': {
      let count = 0;
      for (let part = scene.a; part < scene.total; part++) count++;
      return count;
    }
    case 'sub': {
      let left = scene.a;
      for (let i = 0; i < scene.b; i++) left--;
      return left;
    }
    case 'whichSign':
      return scene.result > scene.a ? 1 : -1;
    case 'floor':
      return scene.floor;
    case 'coins': {
      let total = 0;
      for (const coin of scene.coins) total += coin;
      return total;
    }
    case 'exchange':
      return scene.coin;
    case 'groups': {
      let total = 0;
      for (const group of scene.groups) for (let i = 0; i < group; i++) total++;
      return total;
    }
    case 'rods':
    case 'regroup': {
      // a rod is ten cubes laid end to end
      const cubes = [...Array(scene.units)].length;
      return [...Array(scene.tens)].reduce((n: number) => n + [...Array(10)].length, cubes);
    }
    case 'build':
      return scene.n;
    case 'addMany':
      return scene.terms.flatMap((n) => [...Array(n)]).length;
    case 'bridge': {
      // fill the first frame, then count what spills over onto the second
      const spill = scene.b - (10 - scene.a);
      return 10 + spill;
    }
    case 'calc': {
      // lay the cubes out and add or take away one at a time
      let cubes = [...Array(scene.a)].length;
      for (let i = 0; i < scene.b; i++) cubes += scene.op;
      return cubes;
    }
    case 'inverse': {
      let left = [...Array(scene.a), ...Array(scene.b)].length;
      for (let i = 0; i < scene.taken; i++) left--;
      return left;
    }
    case 'subBridge':
      return [...Array(scene.a)].slice(scene.b).length;
    case 'fives':
      return [...Array(5), ...Array(scene.a - 5), ...Array(5), ...Array(scene.b - 5)].length;
    case 'week': {
      // walk along the cards, going round from Sunday to Monday
      const cards = [1, 2, 3, 4, 5, 6, 7];
      let at = cards.indexOf(scene.today);
      for (let i = 0; i < Math.abs(scene.offset); i++) at = (at + Math.sign(scene.offset) + cards.length) % cards.length;
      return cards[at]!;
    }
    case 'story': {
      // read the numbers back out of the text the child sees, not the stored ones
      const numbers = (scene.text.match(/\d+/g) ?? []).map(Number);
      const [first, second] = scene.operation === 'missing' ? [numbers[1]!, numbers[0]!] : [numbers[0]!, numbers[1]!];
      if (scene.operation === 'twoStep') return numbers[0]! + numbers[1]! - numbers[2]!;
      return scene.operation === 'add' ? first + second : scene.operation === 'subtract' ? first - second : second - first;
    }
  }
}

const each = (g: Generator<unknown>, fn: (p: Problem, params: unknown, label: string) => void) => {
  const play = playable(g);
  for (const level of LEVELS) {
    for (let seed = 0; seed < SEEDS; seed++) {
      const problem = play.produce({ rng: mulberry32(seed), level }, new Set());
      fn(problem, problem.params, `${g.id} level=${level} seed=${seed}`);
    }
  }
};

describe.each(ALL.map((g) => [g.id, g] as const))('%s', (_id, g) => {
  it('gives the same problem for the same seed', () => {
    for (const level of LEVELS) {
      for (let seed = 0; seed < SEEDS; seed++) {
        const once = playable(g).produce({ rng: mulberry32(seed), level }, new Set());
        const again = playable(g).produce({ rng: mulberry32(seed), level }, new Set());
        expect(again, `seed=${seed}`).toEqual(once);
      }
    }
  });

  it('keeps every constraint', () => {
    each(g, (_p, params, label) => {
      for (const c of g.constraints) expect(c(params), label).toBe(true);
    });
  });

  it('has an answer that an independent count of the scene agrees with', () => {
    each(g, (p, _params, label) => {
      expect(equals(p.answer, ratio(answerFromScene(p.scene))), label).toBe(true);
      expect(p.answer.d, label).toBe(1n);
      if (!['compare', 'line', 'quantity', 'whichSign'].includes(p.scene.kind)) expect(p.answer.n > 0n, label).toBe(true);
    });
  });

  it('accepts the right answer, and no detector fires on it', () => {
    each(g, (p, params, label) => {
      expect(playable(g).grade(p, formatNumber(p.answer)), label).toEqual({ ok: true });
      for (const d of g.detectors) expect(d.detect(params, p.answer), `${label} ${d.code}`).toBe(false);
    });
  });

  it('catches every mistake its simulators make', () => {
    let simulated = 0;
    each(g, (p, params, label) => {
      for (const d of g.detectors) {
        const wrong = d.simulate(params);
        if (!wrong) continue;
        simulated++;
        expect(equals(wrong, p.answer), `${label} ${d.code} simulated the right answer`).toBe(false);
        expect(d.detect(params, wrong), `${label} ${d.code}`).toBe(true);
        expect(playable(g).grade(p, formatNumber(wrong)).ok, `${label} ${d.code}`).toBe(false);
      }
    });
    expect(simulated).toBeGreaterThan(0);
  });

  it('reads every problem aloud', () => {
    each(g, (p, _params, label) => {
      expect(p.say.length, label).toBeGreaterThan(0);
    });
  });
});

describe('ranges', () => {
  const answers = (id: string) => {
    const g = GENERATORS.find((x) => x.id === id)!;
    const seen = new Set<number>();
    for (let seed = 0; seed < SEEDS; seed++) seen.add(Number(g.produce({ rng: mulberry32(seed), level: 1 }, new Set()).answer.n));
    return [...seen].sort((a, b) => a - b);
  };

  it.each([
    ['count.to5', [1, 2, 3, 4, 5]],
    ['count.to10', [6, 7, 8, 9, 10]],
    ['count.to20', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]],
    ['add.to5', [2, 3, 4, 5]],
    ['add.to10', [6, 7, 8, 9, 10]],
    ['house.to5', [1, 2, 3, 4]],
    ['house.to10', [1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ['pairs10', [1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ['add.ten-plus', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]],
    ['add.doubles', [2, 4, 6, 8, 10]],
    ['put.to5', [1, 2, 3, 4, 5]],
    ['put.to10', [6, 7, 8, 9, 10]],
    ['put.to20', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]],
    ['subitize.to5', [1, 2, 3, 4, 5]],
    ['subitize.to10', [6, 7, 8, 9, 10]],
    ['subitize.to20', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]],
    ['line.step.to10', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
    ['line.place.to10', [1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ['sub.small', [1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ['sub.large', [1, 2, 3]],
    ['floor.to10', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
    ['money.exchange', [2, 5, 10]],
  ])('%s stays in range and reaches all of it', (id, expected) => {
    expect(answers(id)).toEqual(expected);
  });
});

describe('specific mistakes', () => {
  const grade = (generator: Generator<unknown>, params: unknown, build: { answer: Problem['answer'] }, input: string) =>
    playable(generator).grade({ params, answer: build.answer, policy: { equality: 'value' } } as Problem, input);
  const count = named('count.to20');
  const add = named('add.to10');
  const house = named('house.to5');
  const countOf = (n: number): CountParams => ({ n, arrangement: 'frames', cells: [] });

  it('31 for 13 is a reversal, and has its own hint', () => {
    expect(grade(count, countOf(13), { answer: ratio(13) }, '31')).toEqual({ ok: false, code: 'DIGIT_REVERSAL', hintId: 'teen-digits' });
  });

  it('14 for 13 is a miscount', () => {
    expect(grade(count, countOf(13), { answer: ratio(13) }, '14')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'count-again' });
  });

  it('11 reversed is itself, so it is no mistake to look for', () => {
    expect(count.detectors[0]!.simulate(countOf(11))).toBeNull();
  });

  it('5 + 3 = 7 is counting from the first number', () => {
    expect(grade(add, { a: 5, b: 3, dots: false }, { answer: ratio(8) }, '7')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'count-from-next' });
  });

  it('5 + 3 = 2 is taking away', () => {
    expect(grade(add, { a: 5, b: 3, dots: false }, { answer: ratio(8) }, '2')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'putting-together' });
  });

  it('copying the whole of a number house is told apart from a near miss', () => {
    const params = { whole: 5, known: 2, missingOnRight: true, dots: false };
    expect(grade(house, params, { answer: ratio(3) }, '5')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'house-parts' });
    expect(grade(house, params, { answer: ratio(3) }, '7')).toEqual({ ok: false, code: 'ADDED_PARTS', hintId: 'house-parts' });
    expect(grade(house, params, { answer: ratio(3) }, '4')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: undefined });
  });

  it('an unrelated number has no diagnosis', () => {
    expect(grade(count, countOf(13), { answer: ratio(13) }, '9')).toEqual({ ok: false });
  });
});

describe('comparing', () => {
  const compare = named('cmp.sign.to10');
  const params = { a: 3, b: 8, minGap: 1, dots: false };
  const grade = (input: string) => playable(compare).grade({ params, answer: ratio(-1), policy: { equality: 'value' } } as Problem, input);

  it('hears the sign the wrong way round as the whale facing the wrong way', () => {
    expect(grade('-1')).toEqual({ ok: true });
    expect(grade('1')).toEqual({ ok: false, code: 'SIGN_REVERSED', hintId: 'whale-mouth' });
    expect(grade('0')).toEqual({ ok: false });
  });

  it('brings the numbers closer as the level rises, and sometimes makes them equal', () => {
    const g = GENERATORS.find((x) => x.id === 'cmp.sign.to10')!;
    const gaps = (level: Level) => Array.from({ length: SEEDS }, (_, seed) => g.produce({ rng: mulberry32(seed), level }, new Set()).scene).map((s) => (s.kind === 'compare' ? Math.abs(s.a - s.b) : -1));
    expect(gaps(1).filter((d) => d !== 0).every((d) => d >= 3)).toBe(true);
    expect(gaps(2).filter((d) => d !== 0).every((d) => d >= 2)).toBe(true);
    expect(gaps(3)).toContain(1);
    expect(gaps(1)).toContain(0);
  });
});

describe('the number line', () => {
  const place = named('line.place.to20');
  const grade = (labels: string, input: string) =>
    playable(place).grade({ params: { max: 20, target: 7, labels }, answer: ratio(7), policy: { equality: 'value' } } as Problem, input);

  it('wants the exact tick when the numbers are written, and is forgiving when they are not', () => {
    expect(grade('all', '8').ok).toBe(false);
    expect(grade('all', '7').ok).toBe(true);
    expect(grade('ends', '8').ok).toBe(true);
    expect(grade('ends', '6').ok).toBe(true);
    expect(grade('ends', '9')).toEqual({ ok: false, code: 'LINE_POSITION', hintId: 'line-from-zero' });
  });

  it('knows going the wrong way along it', () => {
    const step = named('line.step.to10');
    const params = { max: 10, at: 4, direction: 1, labels: 'all' };
    expect(playable(step).grade({ params, answer: ratio(5), policy: { equality: 'value' } } as Problem, '3')).toEqual({ ok: false, code: 'WRONG_DIRECTION', hintId: 'line-direction' });
  });
});

describe('part two mistakes', () => {
  const gradeOf = (id: string, params: unknown, answer: number, input: string) => playable(named(id)).grade({ params, answer: ratio(answer), policy: { equality: 'value' } } as Problem, input);

  it('tells size from count when the side with fewer has the big dots', () => {
    const params = { left: 3, right: 7, ask: 'more', bigSide: 'left', minGap: 1 };
    expect(gradeOf('qty.to10', params, 1, '1')).toEqual({ ok: true });
    expect(gradeOf('qty.to10', params, 1, '-1')).toEqual({ ok: false, code: 'SIZE_NOT_COUNT', hintId: 'size-not-count' });
  });

  it('calls 6 − 2 = 8 adding, and 6 − 2 = 6 not taking anything away', () => {
    const params = { a: 6, b: 2, dots: false };
    expect(gradeOf('sub.small', params, 4, '8')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'taking-away' });
    expect(gradeOf('sub.small', params, 4, '6')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'taking-away' });
    expect(gradeOf('sub.small', params, 4, '5')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'count-again' });
  });

  it('knows counting coins from adding their values', () => {
    expect(gradeOf('money.total', { coins: [5, 2, 1], unit: 'euro' }, 8, '3')).toEqual({ ok: false, code: 'COUNTED_COINS', hintId: 'coin-value' });
  });

  it('knows counting floors from the top', () => {
    expect(gradeOf('floor.to10', { floor: 3, floors: 10 }, 3, '8')).toEqual({ ok: false, code: 'COUNTED_FROM_TOP', hintId: 'floors-up' });
  });

  it('is pleased with a close estimate', () => {
    const params = { n: 8, max: 15, tolerance: 2, cells: [] };
    expect(gradeOf('jar.to10', params, 8, '10').ok).toBe(true);
    expect(gradeOf('jar.to10', params, 8, '6').ok).toBe(true);
    expect(gradeOf('jar.to10', params, 8, '11')).toMatchObject({ ok: false, code: 'LINE_POSITION' });
  });

  it('keeps taking away a little apart from taking away a lot', () => {
    const scenes = (id: string) => Array.from({ length: SEEDS }, (_, seed) => GENERATORS.find((g) => g.id === id)!.produce({ rng: mulberry32(seed), level: 1 }, new Set()).scene);
    for (const s of scenes('sub.small')) expect(s.kind === 'sub' && s.b <= 2).toBe(true);
    for (const s of scenes('sub.large')) expect(s.kind === 'sub' && s.a - s.b <= 3 && s.b >= 2).toBe(true);
  });

  it('never makes money that does not add up within ten', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const { scene } = GENERATORS.find((g) => g.id === 'money.total')!.produce({ rng: mulberry32(seed), level: 1 }, new Set());
      expect(scene.kind === 'coins' && scene.coins.reduce((a, b) => a + b, 0) <= 10 && scene.coins.some((c) => c > 1), `seed ${seed}`).toBe(true);
    }
  });
});

describe('avoiding repeats', () => {
  it('finds another problem when it can', () => {
    const g = GENERATORS.find((x) => x.id === 'count.to5')!;
    const avoid = new Set(['count.to5:1', 'count.to5:2', 'count.to5:3', 'count.to5:4']);
    for (let seed = 0; seed < 200; seed++) expect(g.produce({ rng: mulberry32(seed), level: 1 }, avoid).key).toBe('count.to5:5');
  });

  it('repeats rather than failing when everything has been used', () => {
    const g = GENERATORS.find((x) => x.id === 'count.to5')!;
    const avoid = new Set([1, 2, 3, 4, 5].map((n) => ['count.to5', n].join(':')));
    expect(g.produce({ rng: mulberry32(1), level: 1 }, avoid).generatorId).toBe('count.to5');
  });
});

describe('chapters 33-42', () => {
  const gradeOf = (id: string, params: unknown, answer: number, input: string) => playable(named(id)).grade({ params, answer: ratio(answer), policy: { equality: 'value' } } as Problem, input);
  const scenes = (id: string, level: Level) => Array.from({ length: SEEDS }, (_, seed) => GENERATORS.find((g) => g.id === id)!.produce({ rng: mulberry32(seed), level }, new Set()).scene);

  it('reads 3 rods and 7 cubes as 37, and names 73 and 10', () => {
    const params = { tens: 3, units: 7, cubesFirst: false };
    expect(gradeOf('tens.read.to50', params, 37, '37')).toEqual({ ok: true });
    expect(gradeOf('tens.read.to50', params, 37, '73')).toEqual({ ok: false, code: 'DIGIT_REVERSAL', hintId: 'digit-reversal' });
    expect(gradeOf('tens.read.to50', params, 37, '10')).toEqual({ ok: false, code: 'COUNTED_GROUPS', hintId: 'tens-worth' });
  });

  it('counts a collection by its groups, a five among them from level 2', () => {
    expect(gradeOf('groups.to50', { groups: [10, 10, 5, 1, 1] }, 27, '5')).toEqual({ ok: false, code: 'COUNTED_GROUPS', hintId: 'tens-worth' });
    for (const s of scenes('groups.to50', 1)) expect(s.kind === 'groups' && !s.groups.includes(5)).toBe(true);
    expect(scenes('groups.to50', 2).some((s) => s.kind === 'groups' && s.groups.includes(5))).toBe(true);
  });

  it('hears cubes left untied as their own mistake', () => {
    expect(gradeOf('tens.regroup', { tens: 1, units: 14 }, 24, '24')).toEqual({ ok: true });
    expect(gradeOf('tens.regroup', { tens: 1, units: 14 }, 24, '114')).toEqual({ ok: false, code: 'NOT_REGROUPED', hintId: 'bundle-ten' });
    expect(gradeOf('tens.regroup', { tens: 1, units: 24 }, 34, '214')).toEqual({ ok: false, code: 'NOT_REGROUPED', hintId: 'bundle-ten' });
    for (const s of scenes('tens.regroup', 3)) expect(s.kind === 'regroup' && s.units >= 10 && s.tens * 10 + s.units <= 49).toBe(true);
  });

  it('knows a number left out of three', () => {
    expect(gradeOf('add.three', { terms: [4, 3, 6], dots: false }, 13, '7')).toEqual({ ok: false, code: 'TERM_MISSED', hintId: 'add-all' });
    expect(gradeOf('add.three', { terms: [4, 3, 6], dots: false }, 13, '10')).toEqual({ ok: false, code: 'TERM_MISSED', hintId: 'add-all' });
    for (const s of scenes('add.three', 3)) expect(s.kind === 'addMany' && s.terms.some((a, i) => s.terms.some((b, j) => i !== j && a + b === 10))).toBe(true);
  });

  it('crosses ten every time, and knows a forgotten ten', () => {
    for (const level of LEVELS) for (const s of scenes('add.bridge', level)) expect(s.kind === 'bridge' && s.a + s.b > 10 && s.a + s.b <= 18).toBe(true);
    expect(gradeOf('add.bridge', { a: 8, b: 5, frames: true }, 13, '3')).toEqual({ ok: false, code: 'CARRY_FORGOTTEN', hintId: 'make-ten' });
    expect(gradeOf('add.bridge', { a: 8, b: 5, frames: true }, 13, '31')).toEqual({ ok: false, code: 'DIGIT_REVERSAL', hintId: 'teen-digits' });
  });

  it('praises making ten only when the frames show it', () => {
    const bridge = GENERATORS.find((g) => g.id === 'add.bridge')!;
    expect(bridge.produce({ rng: mulberry32(1), level: 1 }, new Set()).praise).toBe('made-ten');
    expect(bridge.produce({ rng: mulberry32(1), level: 3 }, new Set()).praise).toBeUndefined();
  });

  it('goes round the week from Sunday to Monday, but not while today is marked', () => {
    expect(gradeOf('days.week', { today: 7, offset: 1, marked: false }, 1, '1')).toEqual({ ok: true });
    expect(gradeOf('days.week', { today: 2, offset: 1, marked: false }, 3, '1')).toEqual({ ok: false, code: 'WRONG_DIRECTION', hintId: 'days-order' });
    expect(gradeOf('days.week', { today: 2, offset: 2, marked: false }, 4, '3')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'days-order' });
    for (const s of scenes('days.week', 1)) expect(s.kind === 'week' && s.today + s.offset >= 1 && s.today + s.offset <= 7).toBe(true);
    expect(scenes('days.week', 2).some((s) => s.kind === 'week' && (s.today + s.offset === 8 || s.today + s.offset === 0))).toBe(true);
  });

  it('asks what day it is in the clips it has', () => {
    const p = GENERATORS.find((g) => g.id === 'days.week')!.produce({ rng: mulberry32(3), level: 3 }, new Set());
    expect(p.say[0]).toEqual({ instruction: 'today-is' });
    expect(p.say[1]).toMatchObject({ instruction: expect.stringMatching(/^day-[1-7]$/) });
  });
});

describe('chapters 46-49', () => {
  const gradeOf = (id: string, params: unknown, answer: number, input: string) => playable(named(id)).grade({ params, answer: ratio(answer), policy: { equality: 'value' } } as Problem, input);
  const scenes = (id: string, level: Level) => Array.from({ length: SEEDS }, (_, seed) => GENERATORS.find((g) => g.id === id)!.produce({ rng: mulberry32(seed), level }, new Set()).scene);

  it('keeps the units within ten without a bridge, and always crosses with one', () => {
    for (const level of LEVELS) {
      for (const s of scenes('calc.2d1d', level)) expect(s.kind === 'calc' && (s.op === 1 ? (s.a % 10) + s.b <= 9 : s.b <= s.a % 10)).toBe(true);
      for (const s of scenes('calc.2d1d.bridge', level)) expect(s.kind === 'calc' && (s.op === 1 ? (s.a % 10) + s.b >= 10 : s.b > s.a % 10)).toBe(true);
    }
    for (const s of scenes('calc.2d1d', 1)) expect(s.kind === 'calc' && s.a <= 29 && s.picture).toBe(true);
  });

  it('names 14 + 3 = 44, 17 + 5 = 12 and 23 − 5 = 22', () => {
    expect(gradeOf('calc.2d1d', { a: 14, b: 3, op: 1, picture: true }, 17, '44')).toEqual({ ok: false, code: 'PLACE_VALUE', hintId: 'add-to-units' });
    expect(gradeOf('calc.2d1d.bridge', { a: 17, b: 5, op: 1, picture: true }, 22, '12')).toEqual({ ok: false, code: 'CARRY_FORGOTTEN', hintId: 'make-ten' });
    expect(gradeOf('calc.2d1d.bridge', { a: 23, b: 5, op: -1, picture: true }, 18, '22')).toEqual({ ok: false, code: 'SUB_SMALLER_FROM_LARGER', hintId: 'take-to-ten' });
    expect(gradeOf('calc.2d1d.bridge', { a: 23, b: 5, op: -1, picture: true }, 18, '28')).toEqual({ ok: false, code: 'CARRY_FORGOTTEN', hintId: 'make-ten' });
  });

  it('takes back what was added, and knows 15 − 6 = 11', () => {
    expect(gradeOf('calc.inverse', { a: 9, b: 6, takeFirst: false }, 9, '21')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'look-at-addition' });
    expect(gradeOf('sub.bridge', { a: 15, b: 6, style: 'plain' }, 9, '11')).toEqual({ ok: false, code: 'SUB_SMALLER_FROM_LARGER', hintId: 'take-to-ten' });
    for (const s of scenes('sub.bridge', 3)) expect(s.kind === 'subBridge' || s.kind === 'missing').toBe(true);
    expect(scenes('sub.bridge', 3).some((s) => s.kind === 'missing')).toBe(true);
  });

  it('adds two fives first, and praises it when the picture shows them', () => {
    expect(gradeOf('add.fives', { a: 7, b: 8, picture: true }, 15, '5')).toEqual({ ok: false, code: 'CARRY_FORGOTTEN', hintId: 'five-and-five' });
    for (const s of scenes('add.fives', 1)) expect(s.kind === 'fives' && s.b === 5).toBe(true);
    const fives = GENERATORS.find((g) => g.id === 'add.fives')!;
    expect(fives.produce({ rng: mulberry32(2), level: 2 }, new Set()).praise).toBe('two-fives');
    expect(fives.produce({ rng: mulberry32(2), level: 3 }, new Set()).praise).toBeUndefined();
  });

  it('plays doubles, then near doubles, then halves too', () => {
    expect(gradeOf('add.doubles20', { kind: 'near', a: 7, biggerFirst: true, dots: false }, 15, '14')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'use-doubles' });
    expect(gradeOf('add.doubles20', { kind: 'half', a: 7, biggerFirst: true, dots: false }, 7, '14')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'use-doubles' });
    for (const s of scenes('add.doubles20', 1)) expect(s.kind === 'add' && s.a === s.b).toBe(true);
    for (const s of scenes('add.doubles20', 2)) expect(s.kind === 'add' && Math.abs(s.a - s.b) === 1).toBe(true);
    expect(scenes('add.doubles20', 3).some((s) => s.kind === 'sub')).toBe(true);
  });
});
