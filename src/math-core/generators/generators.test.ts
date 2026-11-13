// PRD §9-10: every generator × level × 1.000 seeds.

import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../engine/rng.ts';
import type { Level } from '../../engine/types.ts';
import { formatNumber } from '../format.ts';
import { equals, ratio } from '../rational.ts';
import golden from '../../content/word-problems.golden.json';
import { ALL_GENERATORS, GENERATORS } from './index.ts';
import { COMPOSITIONS, FIGURES, mirrored } from './space.ts';
import type { CountParams } from './number.ts';
import { playable, type Generator, type Problem, type Scene } from './types.ts';

const SEEDS = 1000;

/** The month each event falls in, and the season of each month: kept apart from the generator's table. */
const EVENT_MONTH: Record<string, number> = { flowers: 4, sea: 7, leaves: 10, snow: 1, easter: 4, mayday: 5, 'school-closes': 6, 'school-opens': 9, christmas: 12 };
const seasonOfMonth = (m: number) => (m >= 3 && m <= 5 ? 1 : m >= 6 && m <= 8 ? 2 : m >= 9 && m <= 11 ? 3 : 4);
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
    case 'neighbour':
      return scene.direction === 1 ? scene.n + 1 : scene.n - 1;
    case 'times':
      return [...Array(scene.n)].flatMap(() => [...Array(scene.k)]).length;
    case 'measure': {
      // count the clips under the object only, up to its end
      const under = [...Array(scene.length + scene.extra)].slice(0, scene.length).length;
      return scene.other === null ? under : under - [...Array(scene.other)].length;
    }
    case 'tensCalc': {
      let total = scene.a;
      for (let i = 0; i < scene.b / 10; i++) total += scene.op * 10;
      return total;
    }
    case 'tenStep': {
      let n = scene.n;
      for (let i = 0; i < 10; i++) n += scene.direction;
      return n;
    }
    case 'wallet': {
      let total = 0;
      for (const v of [...scene.notes, ...scene.coins]) total += v;
      return total;
    }
    case 'share': {
      // deal one to each plate in turn until none are left
      const plates = Array.from({ length: scene.plates }, () => 0);
      for (let i = 0; i < scene.total; i++) plates[i % scene.plates]!++;
      return plates[0]!;
    }
    case 'heavier':
      return scene.heavy === 'left' ? -1 : 1;
    case 'whichShape':
      return scene.tiles.findIndex((s) => s.kind === scene.target) + 1;
    case 'countShapes':
      return scene.shapes.filter((s) => s.kind === 'triangle').length;
    case 'lengths':
      return (scene.ask === 'taller') === scene.left > scene.right ? -1 : 1;
    case 'pattern': {
      // the shortest repeat that every piece shown agrees with, then the piece it puts in the gap
      const seq = scene.sequence;
      const gap = seq.indexOf(-1);
      for (let period = 1; period < seq.length; period++) {
        const agrees = seq.every((x, i) => x === -1 || seq.every((y, j) => y === -1 || (i - j) % period !== 0 || x === y));
        if (agrees) return scene.options.indexOf(seq.find((x, i) => x !== -1 && (i - gap) % period === 0)!) + 1;
      }
      return NaN;
    }
    case 'commute':
      return scene.a;
    case 'sentence':
      return scene.options.findIndex(([x, y, s]) => x === scene.a && y === scene.b && x + y === s) + 1;
    case 'match':
      return [...Array(scene.have)].slice(scene.give).length;
    case 'arrow': {
      // which way the star lies from the hedgehog: rows first, then columns
      const [dc, dr] = [(scene.star % scene.cols) - (scene.at % scene.cols), Math.floor(scene.star / scene.cols) - Math.floor(scene.at / scene.cols)];
      return dr < 0 ? 1 : dc > 0 ? 2 : dr > 0 ? 3 : 4;
    }
    case 'route': {
      if (scene.ask === 'go') return scene.target + 1;
      // flood the grid from the start, one ring of squares per step
      let ring = new Set([scene.start]);
      const seen = new Set(ring);
      for (let steps = 0; ; steps++) {
        if (ring.has(scene.target)) return steps;
        const next = new Set<number>();
        for (const cell of ring) {
          const [c, r] = [cell % scene.cols, Math.floor(cell / scene.cols)];
          for (const [nc, nr] of [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]] as const) {
            const n = nr * scene.cols + nc;
            if (nc >= 0 && nr >= 0 && nc < scene.cols && nr < scene.rows && !scene.obstacles.includes(n) && !seen.has(n)) {
              seen.add(n);
              next.add(n);
            }
          }
        }
        ring = next;
      }
    }
    case 'compose':
      return COMPOSITIONS[scene.picture]!.filter((p) => p.kind === scene.ask).length;
    case 'pieces':
      return FIGURES[scene.figure].pieces;
    case 'mirror':
      return 1;
    case 'order': {
      // the stages as they come in the story, then the one asked for
      const inOrder = [...scene.shown].sort((x, y) => x - y);
      return inOrder[scene.ask === 'first' ? 0 : scene.ask === 'middle' ? 1 : inOrder.length - 1]!;
    }
    case 'dates':
      return [...Array(scene.today + scene.offset)].length;
    case 'season':
      return seasonOfMonth(EVENT_MONTH[scene.event]!);
    case 'month': {
      // lay the month out on the wall calendar and read the column
      const cells = [...Array<number>(scene.first - 1).fill(0), ...Array.from({ length: scene.length }, (_, i) => i + 1)];
      return (cells.indexOf(scene.date) % 7) + 1;
    }
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
      if (scene.operation === 'multiply') return numbers[0]! * numbers[1]!;
      if (scene.operation === 'divide') return numbers[0]! / numbers[1]!;
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
      if (!['compare', 'line', 'quantity', 'whichSign', 'heavier', 'lengths'].includes(p.scene.kind)) expect(p.answer.n > 0n, label).toBe(true);
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

  it('never shows a story already in order, and knows the end taken for the start', () => {
    for (const level of LEVELS) for (const s of scenes('time.order', level)) expect(s.kind === 'order' && s.shown.join() !== '1,2,3').toBe(true);
    expect(gradeOf('time.order', { story: 'egg', shown: [3, 1, 2], ask: 'first' }, 1, '3')).toEqual({ ok: false, code: 'WRONG_DIRECTION', hintId: 'order-think' });
  });

  it('keeps the dates inside the month and says them as the class does', () => {
    for (const level of LEVELS) for (const s of scenes('days.dates', level)) expect(s.kind === 'dates' && s.today + s.offset >= 1 && s.today + s.offset <= 30).toBe(true);
    expect(gradeOf('days.dates', { today: 23, offset: -1 }, 22, '24')).toEqual({ ok: false, code: 'WRONG_DIRECTION', hintId: 'dates-order' });
    expect(gradeOf('days.dates', { today: 23, offset: -1 }, 22, '23')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'dates-order' });
    const p = GENERATORS.find((g) => g.id === 'days.dates')!.produce({ rng: mulberry32(2), level: 2 }, new Set());
    expect(p.say[1]).toMatchObject({ gender: 'f' });
  });

  it('asks about nature first and the days of the year later', () => {
    for (const s of scenes('time.seasons', 1)) expect(s.kind === 'season' && ['flowers', 'sea', 'leaves', 'snow'].includes(s.event)).toBe(true);
    expect(gradeOf('time.seasons', { event: 'christmas' }, 4, '1')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'seasons-order' });
    expect(gradeOf('time.seasons', { event: 'christmas' }, 4, '2')).toEqual({ ok: false });
  });

  it('reads a date of the month down to its day', () => {
    // a month that starts on a Wednesday: the 6th is a Monday
    expect(gradeOf('days.month', { first: 3, length: 30, date: 6 }, 1, '1')).toEqual({ ok: true });
    expect(gradeOf('days.month', { first: 3, length: 30, date: 6 }, 1, '7')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'month-column' });
    for (const s of scenes('days.month', 1)) expect(s.kind === 'month' && s.date <= 7).toBe(true);
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

describe('chapters 52-55', () => {
  const gradeOf = (id: string, params: unknown, answer: number, input: string) => playable(named(id)).grade({ params, answer: ratio(answer), policy: { equality: 'value' } } as Problem, input);
  const scenes = (id: string, level: Level) => Array.from({ length: SEEDS }, (_, seed) => GENERATORS.find((g) => g.id === id)!.produce({ rng: mulberry32(seed), level }, new Set()).scene);

  it('knows 59 → 50 and going the wrong way', () => {
    expect(gradeOf('next.to70', { n: 59, direction: 1 }, 60, '50')).toEqual({ ok: false, code: 'CARRY_FORGOTTEN', hintId: 'next-ten' });
    expect(gradeOf('next.to70', { n: 60, direction: -1 }, 59, '69')).toEqual({ ok: false, code: 'CARRY_FORGOTTEN', hintId: 'next-ten' });
    expect(gradeOf('next.to70', { n: 63, direction: 1 }, 64, '62')).toEqual({ ok: false, code: 'WRONG_DIRECTION', hintId: 'line-direction' });
    expect(scenes('next.to70', 2).some((s) => s.kind === 'neighbour' && s.n % 10 === 9 && s.direction === 1)).toBe(true);
  });

  it('reads «three times five» with the feminine three', () => {
    const p = GENERATORS.find((g) => g.id === 'times.intro')!.produce({ rng: mulberry32(1), level: 1 }, new Set());
    expect(p.say[0]).toMatchObject({ gender: 'f' });
    expect(p.say[1]).toEqual({ instruction: 'times' });
  });

  it('tells adding the two numbers and counting the groups from the product', () => {
    const params = { n: 3, k: 5, show: 1 };
    expect(gradeOf('times.intro', params, 15, '8')).toEqual({ ok: false, code: 'MULT_AS_ADD', hintId: 'equal-groups' });
    expect(gradeOf('times.intro', params, 15, '3')).toEqual({ ok: false, code: 'COUNTED_GROUPS', hintId: 'equal-groups' });
    expect(gradeOf('times.intro', params, 15, '20')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'equal-groups' });
    for (const level of LEVELS) for (const s of scenes('times.intro', level)) expect(s.kind === 'times' && [2, 5, 10].includes(s.k) && s.n * s.k <= 50).toBe(true);
  });

  it('measures only up to the end, and how much longer', () => {
    expect(gradeOf('measure.clips', { length: 5, extra: 2, other: null, object: 0 }, 5, '7')).toEqual({ ok: false, code: 'MEASURED_PAST_END', hintId: 'measure-to-end' });
    expect(gradeOf('measure.clips', { length: 7, extra: 0, other: 4, object: 0 }, 3, '7')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'how-much-longer' });
    for (const s of scenes('measure.clips', 2)) expect(s.kind === 'measure' && s.extra >= 1).toBe(true);
  });

  it('knows tens counted as ones', () => {
    expect(gradeOf('calc.tens', { a: 20, b: 30, op: 1, notes: true }, 50, '5')).toEqual({ ok: false, code: 'PLACE_VALUE', hintId: 'tens-worth' });
    expect(gradeOf('calc.tens', { a: 34, b: 20, op: 1, notes: false }, 54, '36')).toEqual({ ok: false, code: 'PLACE_VALUE', hintId: 'tens-worth' });
    for (const level of LEVELS) for (const s of scenes('calc.tens', level)) expect(s.kind === 'tensCalc' && s.b % 10 === 0 && s.a + s.op * s.b <= 70 && s.a + s.op * s.b >= 10).toBe(true);
  });
});

describe('chapters 58-60', () => {
  const gradeOf = (id: string, params: unknown, answer: number, input: string) => playable(named(id)).grade({ params, answer: ratio(answer), policy: { equality: 'value' } } as Problem, input);
  const scenes = (id: string, level: Level) => Array.from({ length: SEEDS }, (_, seed) => GENERATORS.find((g) => g.id === id)!.produce({ rng: mulberry32(seed), level }, new Set()).scene);

  it('steps by ten, and knows a step of one', () => {
    expect(gradeOf('tens.step.to100', { n: 47, direction: 1 }, 57, '48')).toEqual({ ok: false, code: 'PLACE_VALUE', hintId: 'tens-worth' });
    expect(gradeOf('tens.step.to100', { n: 47, direction: 1 }, 57, '37')).toEqual({ ok: false, code: 'WRONG_DIRECTION', hintId: 'line-direction' });
    for (const s of scenes('tens.step.to100', 1)) expect(s.kind === 'tenStep' && s.n % 10 === 0).toBe(true);
  });

  it('adds money up to 100 euro, notes and coins', () => {
    expect(gradeOf('money.wallet', { notes: [20, 10], coins: [2, 1] }, 33, '4')).toEqual({ ok: false, code: 'COUNTED_COINS', hintId: 'coin-value' });
    expect(gradeOf('money.wallet', { notes: [20, 10], coins: [2, 1] }, 33, '30')).toEqual({ ok: false, code: 'TERM_MISSED', hintId: 'add-all' });
    for (const level of LEVELS) for (const s of scenes('money.wallet', level)) expect(s.kind === 'wallet' && [...s.notes, ...s.coins].reduce((a, b) => a + b, 0) <= 100).toBe(true);
  });

  it('shares out equally, and knows the whole or the plates for the share', () => {
    const params = { k: 3, each: 4, scattered: false };
    expect(gradeOf('share.plates', params, 4, '12')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'share-fair' });
    expect(gradeOf('share.plates', params, 4, '3')).toEqual({ ok: false, code: 'COUNTED_GROUPS', hintId: 'share-fair' });
    for (const s of scenes('share.plates', 2)) expect(s.kind === 'share' && s.total % s.plates === 0 && s.total <= 20).toBe(true);
  });

  it('draws the lighter thing bigger from level 2, and names choosing by size', () => {
    const params = { left: 'parcel', right: 'sack', heavy: 'left', bigSide: 'right' };
    expect(gradeOf('weight.heavier', params, -1, '1')).toEqual({ ok: false, code: 'SIZE_NOT_WEIGHT', hintId: 'heavy-down' });
    for (const s of scenes('weight.heavier', 2)) expect(s.kind === 'heavier' && s.bigSide !== s.heavy && s.bigSide !== null).toBe(true);
    for (const s of scenes('weight.heavier', 1)) expect(s.kind === 'heavier' && s.bigSide === null).toBe(true);
  });

  it('plays equal groups of two to five for the book\'s petals and wheels', () => {
    for (const level of LEVELS) for (const s of scenes('times.groups', level)) expect(s.kind === 'times' && [2, 3, 4, 5].includes(s.k) && s.n * s.k <= 25).toBe(true);
  });
});

describe('word problems of mixed kinds', () => {
  const story = (id: string) => named(id);
  const gradeStory = (id: string, problemId: string, input: string) => {
    const g = story(id);
    const problem = (golden as { problems: { id: string; answer: number }[] }).problems.find((x) => x.id === problemId)!;
    return playable(g).grade({ params: { problem, pictures: true }, answer: ratio(problem.answer), policy: { equality: 'value' } } as Problem, input);
  };

  it('gives each kind of problem its own hint for the other operation', () => {
    // 12 apples shared by 3: 12 − 3 = 9
    expect(gradeStory('story.mixed', 'shareout-01', '9')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'share-fair' });
    // 3 flowers in each of 2 boxes: 3 + 2 = 5
    expect(gradeStory('story.mixed', 'boxes-01', '5')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'equal-groups' });
    // gave 2, has 10 now: 10 − 2 = 8
    expect(gradeStory('story.mixed', 'before-01', '8')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'putting-together' });
    expect(gradeStory('story.addsub.to20', 'takeout-01', '19')).toEqual({ ok: false, code: 'OPERATION_SWAP', hintId: 'taking-away' });
  });
});

describe('geometry and early gaps', () => {
  const gradeOf = (id: string, params: unknown, answer: number, input: string) => playable(named(id)).grade({ params, answer: ratio(answer), policy: { equality: 'value' } } as Problem, input);
  const scenes = (id: string, level: Level) => Array.from({ length: SEEDS }, (_, seed) => GENERATORS.find((g) => g.id === id)!.produce({ rng: mulberry32(seed), level }, new Set()).scene);

  it('turns and stretches shapes only from level 2, and keeps square and rectangle apart until then', () => {
    for (const s of scenes('shapes.which', 1)) {
      expect(s.kind === 'whichShape' && s.tiles.every((t) => t.rotate === 0)).toBe(true);
      const kinds = s.kind === 'whichShape' ? s.tiles.map((t) => t.kind) : [];
      expect(kinds.includes('square') && kinds.includes('rectangle')).toBe(false);
    }
    expect(scenes('shapes.which', 2).some((s) => s.kind === 'whichShape' && s.tiles.some((t) => t.rotate !== 0))).toBe(true);
  });

  it('knows counting every shape, and leaving out the turned triangles', () => {
    const tri = (rotate: number) => ({ kind: 'triangle', rotate, size: 100, variant: 0 });
    const params = { shapes: [tri(0), tri(45), tri(0), { kind: 'circle', rotate: 0, size: 100, variant: 0 }] };
    expect(gradeOf('shapes.count', params, 3, '4')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'shape-sides' });
    expect(gradeOf('shapes.count', params, 3, '2')).toEqual({ ok: false, code: 'SHAPE_CONFUSED', hintId: 'turned-shape' });
  });

  it('puts the shorter one on a box at level 3, and names choosing by the top', () => {
    const params = { ask: 'taller', left: 3, right: 6, raised: 'left' };
    expect(gradeOf('lengths.compare', params, 1, '-1')).toEqual({ ok: false, code: 'POSITION_NOT_LENGTH', hintId: 'from-the-ground' });
    for (const s of scenes('lengths.compare', 3)) expect(s.kind === 'lengths' && s.raised === (s.left < s.right ? 'left' : 'right')).toBe(true);
  });

  it('builds patterns AB first, with the gap at the end until level 3', () => {
    for (const s of scenes('pattern.next', 1)) expect(s.kind === 'pattern' && s.sequence.at(-1) === -1 && new Set(s.sequence.filter((x) => x !== -1)).size === 2).toBe(true);
    expect(scenes('pattern.next', 3).some((s) => s.kind === 'pattern' && s.sequence.at(-1) !== -1)).toBe(true);
  });

  it('knows 3 + 5 = 5 + 8 and 3 + 5 = 5 + 5', () => {
    expect(gradeOf('add.commute', { a: 3, b: 5 }, 3, '8')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'same-numbers' });
    expect(gradeOf('add.commute', { a: 3, b: 5 }, 3, '5')).toEqual({ ok: false, code: 'ADDED_PARTS', hintId: 'same-numbers' });
  });

  it('always leaves cookies missing, and knows writing the cookies', () => {
    expect(gradeOf('match.missing', { have: 5, give: 3, spread: true }, 2, '3')).toEqual({ ok: false, code: 'PART_IS_WHOLE', hintId: 'line-up' });
    for (const level of LEVELS) for (const s of scenes('match.missing', level)) expect(s.kind === 'match' && s.give < s.have).toBe(true);
  });
});

describe('space: arrows, routes, pictures of shapes, pieces, mirrors', () => {
  const gradeOf = (id: string, params: unknown, answer: number, input: string) => playable(named(id)).grade({ params, answer: ratio(answer), policy: { equality: 'value' } } as Problem, input);
  const scenes = (id: string, level: Level) => Array.from({ length: SEEDS }, (_, seed) => GENERATORS.find((g) => g.id === id)!.produce({ rng: mulberry32(seed), level }, new Set()).scene);

  it('names the opposite arrow', () => {
    expect(gradeOf('orient.arrow', { cols: 3, rows: 3, at: 4, direction: 'up', distance: 1 }, 1, '3')).toEqual({ ok: false, code: 'WRONG_DIRECTION', hintId: 'look-at-star' });
  });

  it('always leaves a way round the rocks, and counts steps without the first square', () => {
    for (const level of LEVELS) for (const s of scenes('route.go', level)) expect(s.kind === 'route' && !s.obstacles.includes(s.target) && !s.obstacles.includes(s.start)).toBe(true);
    expect(scenes('route.go', 3).every((s) => s.kind === 'route' && s.obstacles.length === 5)).toBe(true);
    const params = { cols: 5, rows: 4, start: 0, target: 3, obstacles: [], ask: 'steps' };
    expect(gradeOf('route.steps', params, 3, '4')).toEqual({ ok: false, code: 'OFF_BY_ONE', hintId: 'count-start' });
  });

  it('draws squares as squares, and knows squares and rectangles counted together', () => {
    for (const parts of Object.values(COMPOSITIONS)) for (const p of parts) if (p.kind === 'square' || p.kind === 'circle') expect(p.w).toBe(p.h);
    expect(gradeOf('compose.count', { picture: 'robot', ask: 'square' }, 1, '6')).toEqual({ ok: false, code: 'SHAPE_CONFUSED', hintId: 'shape-sides' });
  });

  it('knows four triangles seen as two', () => {
    expect(gradeOf('tangram.pieces', { figure: 'square4', lines: false }, 4, '2')).toEqual({ ok: false, code: 'COUNTED_GROUPS', hintId: 'piece-fit' });
  });

  it('tells a copied half from a mirrored one', () => {
    expect(gradeOf('mirror.half', { half: 2, rows: 4, filled: [0, 3, 4] }, 1, '2')).toEqual({ ok: false, code: 'COPIED_NOT_MIRRORED', hintId: 'mirror-fold' });
    expect(mirrored({ half: 3, filled: [0, 4] })).toEqual([2, 4]);
  });
});
