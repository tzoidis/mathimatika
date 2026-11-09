import { describe, expect, it } from 'vitest';
import { availableGenerators } from '../../app/curriculum.ts';
import { mulberry32 } from '../../engine/rng.ts';
import { ROUND_KINDS, QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import type { RoundKind } from '../../engine/types.ts';
import { exerciseForRound } from '../registry.ts';
import { generate, planRound, type KeypadItem } from './generate.ts';

const SEEDS = 300;
const at = (chapter: string) => availableGenerators(1, chapter);
const round = (kind: RoundKind, chapter: string, seed: number) =>
  generate({ roundKind: kind, level: 1, rng: mulberry32(seed), generators: at(chapter) }).items as KeypadItem[];

describe('what the book makes available', () => {
  it('offers nothing before a chapter is set, or before the first generator', () => {
    expect(availableGenerators(1, null)).toEqual([]);
    expect(at('4')).toEqual([]);
    expect(availableGenerators(2, '1')).toEqual([]);
  });

  it('follows the chapter, in book order', () => {
    expect(at('5').map((g) => g.id)).toEqual(['count.to5']);
    expect(at('16').map((g) => g.id)).toEqual(['count.to5', 'house.to5', 'count.to10', 'add.to5']);
    expect(at('17').map((g) => g.id)).toEqual(['count.to5', 'house.to5', 'count.to10', 'add.to5', 'count.to20']);
    expect(at('21').map((g) => g.id)).toEqual(['count.to5', 'house.to5', 'count.to10', 'add.to5', 'count.to20', 'add.to10', 'house.to10']);
  });

  it('plays the real exercise only once there is something to play', () => {
    expect(exerciseForRound('warmup', []).countsForProgress).toBe(false);
    expect(exerciseForRound('warmup', at('17')).countsForProgress).toBe(true);
  });
});

describe.each(ROUND_KINDS)('a %s round', (kind) => {
  it.each(['5', '7', '11', '13', '16', '17', '18', '21', '64'])('at chapter %s has 5 sound questions from what was taught', (chapter) => {
    const allowed = new Set(at(chapter).map((g) => g.id));
    for (let seed = 0; seed < SEEDS; seed++) {
      const items = round(kind, chapter, seed);
      expect(items).toHaveLength(QUESTIONS_PER_ROUND);
      for (const { problem } of items) expect(allowed.has(problem.generatorId), `${seed} ${problem.key}`).toBe(true);
      expect(items.some((i) => i.problem.generatorId.startsWith('count.')), `seed ${seed}: no number sense`).toBe(true);
      items.slice(1).forEach((item, i) => expect(item.praiseKey).not.toBe(items[i]!.praiseKey));
    }
  });

  it('is the same for the same seed', () => {
    const keys = (seed: number) => round(kind, '17', seed).map((i) => i.problem.key);
    expect(keys(7)).toEqual(keys(7));
  });

  it('does not repeat a question while there are others', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const keys = round(kind, '17', seed).map((i) => i.problem.key);
      expect(new Set(keys).size, `seed ${seed}: ${keys.join()}`).toBe(keys.length);
    }
  });
});

describe('the shape of a session', () => {
  it('starts easy and ends easy', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      expect(planRound('warmup', at('17'), mulberry32(seed))[0]!.level).toBe(1);
      const mix = planRound('mix', at('17'), mulberry32(seed));
      expect(mix[4]).toMatchObject({ level: 1, generator: { id: 'count.to5' } });
    }
  });

  it('keeps the newest material out of the warm-up and puts it in the workshop', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const ids = (kind: RoundKind) => planRound(kind, at('17'), mulberry32(seed)).map((s) => s.generator.id);
      expect(ids('warmup')).not.toContain('count.to20');
      expect(ids('workshop').filter((id) => id === 'add.to5' || id === 'count.to20').length).toBeGreaterThanOrEqual(4);
    }
  });
});
