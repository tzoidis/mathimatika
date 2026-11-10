import { describe, expect, it } from 'vitest';
import { availableGenerators, latestGenerators } from '../../app/curriculum.ts';
import { mulberry32 } from '../../engine/rng.ts';
import { ROUND_KINDS, QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import type { RoundKind } from '../../engine/types.ts';
import { exerciseForRound } from '../registry.ts';
import type { SkillProgress } from '../../engine/adaptive.ts';
import type { SkillId } from '../../engine/types.ts';
import { generate, isNumberSense, planRound, type Adapt, type QuestionItem } from './generate.ts';

const SEEDS = 300;
const at = (chapter: string) => availableGenerators(1, chapter);
const fresh = (chapter: string) => latestGenerators(1, chapter);
const round = (kind: RoundKind, chapter: string, seed: number) =>
  generate({ roundKind: kind, level: 1, rng: mulberry32(seed), generators: at(chapter), fresh: fresh(chapter) }).items as QuestionItem[];

describe('what the book makes available', () => {
  it('offers nothing before a chapter is set, or before the first generator', () => {
    expect(availableGenerators(1, null)).toEqual([]);
    expect(at('2')).toEqual([]);
    expect(availableGenerators(2, '1')).toEqual([]);
  });

  it('follows the chapter, in book order', () => {
    expect(at('3').map((g) => g.id)).toEqual(['qty.to5', 'jar.to5']);
    expect(at('4').map((g) => g.id)).toEqual(['qty.to5', 'jar.to5', 'subitize.to5', 'put.to5']);
    expect(at('5').map((g) => g.id)).toEqual(['qty.to5', 'jar.to5', 'subitize.to5', 'put.to5', 'count.to5']);
    const ids = at('17').map((g) => g.id);
    expect(ids).toContain('count.to20');
    expect(ids).not.toContain('add.to10');
    expect(ids.indexOf('count.to5')).toBeLessThan(ids.indexOf('count.to20'));
    expect(at('21').map((g) => g.id)).toEqual(expect.arrayContaining(['add.to10', 'add.doubles', 'house.to10', 'pairs10', 'floor.to10', 'money.total', 'balance.missing']));
    expect(at('21').map((g) => g.id)).not.toContain('sub.small');
    expect(at('32').map((g) => g.id)).toEqual(expect.arrayContaining(['sub.small', 'sub.large', 'sign.choice', 'missing.to10', 'count.to50', 'cmp.sign.to50']));
  });

  it('takes the current unit from the latest chapter that has exercises', () => {
    expect(fresh('17').map((g) => g.id)).toEqual(['subitize.to20', 'put.to20', 'count.to20', 'add.ten-plus', 'cmp.sign.to20', 'line.step.to20', 'line.place.to20']);
    // 16 is a revision chapter: back to chapter 15, its word problems
    expect(fresh('16').map((g) => g.id)).toEqual(['story.add.to5']);
    expect(latestGenerators(1, null)).toEqual([]);
  });

  it('plays the real exercise only once there is something to play', () => {
    expect(exerciseForRound('warmup', []).countsForProgress).toBe(false);
    expect(exerciseForRound('warmup', at('17')).countsForProgress).toBe(true);
  });
});

describe.each(ROUND_KINDS)('a %s round', (kind) => {
  it.each(['3', '4', '5', '7', '11', '13', '16', '17', '18', '21', '32', '64'])('at chapter %s has 5 sound questions from what was taught', (chapter) => {
    const allowed = new Set(at(chapter).map((g) => g.id));
    for (let seed = 0; seed < SEEDS; seed++) {
      const items = round(kind, chapter, seed);
      expect(items).toHaveLength(QUESTIONS_PER_ROUND);
      for (const { problem } of items) expect(allowed.has(problem.generatorId), `${seed} ${problem.key}`).toBe(true);
      expect(items.some((i) => isNumberSense({ id: i.problem.generatorId })), `seed ${seed}: no number sense`).toBe(true);
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
  const plan = (kind: RoundKind, seed: number) => planRound(kind, at('17'), fresh('17'), mulberry32(seed));

  it('starts easy and ends easy', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      expect(plan('warmup', seed)[0]!.level).toBe(1);
      expect(plan('mix', seed)[4]).toMatchObject({ level: 1, generator: { id: 'qty.to5' } });
    }
  });

  it('keeps the newest material out of the warm-up and puts it in the workshop', () => {
    const newest = new Set(fresh('17').map((g) => g.id));
    for (let seed = 0; seed < SEEDS; seed++) {
      expect(plan('warmup', seed).some((s) => newest.has(s.generator.id))).toBe(false);
      expect(plan('workshop', seed).filter((s) => newest.has(s.generator.id)).length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('adapting to the child', () => {
  const gens = at('21');
  const freshAt = fresh('21');
  const today = '2026-03-10';
  const progressOf = (entries: [string, Partial<SkillProgress>][]) =>
    new Map(entries.map(([skill, p]) => [skill as SkillId, { skill: skill as SkillId, stage: 1, state: 'practising', attempts: 10, helped: 0, days: 5, lastDay: '2026-03-01', dueDay: '2026-03-20', dominant: null, ...p } as SkillProgress]));
  const plan = (kind: RoundKind, adapt: Adapt, seed = 1) => planRound(kind, gens, freshAt, mulberry32(seed), adapt);
  const allOld = progressOf(gens.map((g) => [g.skill, {}]));

  it('plays each skill at its stage', () => {
    const progress = progressOf(gens.map((g) => [g.skill, { stage: 2 }]));
    for (let seed = 0; seed < SEEDS; seed++) for (const s of plan('workshop', { progress, today, focus: null }, seed)) expect(s.level).toBe(2);
  });

  it('puts what is due for review into the warm-up', () => {
    const progress = new Map(allOld);
    progress.set('1.num.count.to10' as SkillId, { ...allOld.get('1.num.count.to10' as SkillId)!, dueDay: '2026-03-09' });
    for (let seed = 0; seed < SEEDS; seed++) expect(plan('warmup', { progress, today, focus: null }, seed).some((s) => s.generator.id === 'count.to10')).toBe(true);
  });

  it('practises a new skill on its own, then mixes it with older ones', () => {
    const newest = new Set(freshAt.map((g) => g.id));
    const progress = new Map(allOld);
    for (const g of freshAt) progress.set(g.skill, { ...progress.get(g.skill)!, days: 1 });
    // all of them, but for the one number-sense question every grade 1 round keeps (PRD §7)
    for (let seed = 0; seed < SEEDS; seed++) {
      const others = plan('workshop', { progress, today, focus: null }, seed).filter((s) => !newest.has(s.generator.id));
      expect(others.length).toBeLessThanOrEqual(1);
      for (const s of others) expect(isNumberSense(s.generator)).toBe(true);
    }
    const mixed = Array.from({ length: SEEDS }, (_, seed) => plan('workshop', { progress: allOld, today, focus: null }, seed).filter((s) => !newest.has(s.generator.id)).length);
    expect(mixed.every((n) => n >= 1 && n <= 2 + 1)).toBe(true);
  });

  it('gives the workshop to the skill the parent chose', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const slots = plan('workshop', { progress: allOld, today, focus: '1.num.ordinal' as SkillId }, seed);
      expect(slots.filter((s) => s.generator.skill === '1.num.ordinal').length).toBe(4);
      expect(slots.filter((s) => s.generator.skill !== '1.num.ordinal').every((s) => isNumberSense(s.generator))).toBe(true);
    }
  });

  it('never asks three hard questions in a row', () => {
    const progress = progressOf(gens.map((g) => [g.skill, { stage: 3 }]));
    for (const kind of ROUND_KINDS) {
      for (let seed = 0; seed < SEEDS; seed++) {
        const levels = plan(kind, { progress, today, focus: null }, seed).map((s) => s.level).join('');
        expect(levels, `${kind} ${seed}`).not.toContain('333');
      }
    }
  });
});
