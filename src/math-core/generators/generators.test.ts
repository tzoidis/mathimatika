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
      if (p.scene.kind !== 'compare' && p.scene.kind !== 'line') expect(p.answer.n > 0n, label).toBe(true);
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
