import { describe, expect, it } from 'vitest';
import book from '../content/book-map.1.json';
import graphFile from '../content/skills.1.json';
import { findCycle, skillAvailability, validateCurriculum } from './curriculum.ts';
import type { Curriculum, Skill, SkillGraph, SkillId } from './types.ts';

const graph = graphFile as unknown as SkillGraph;
const map = book as unknown as Curriculum;

const skill = (id: string, requires: string[] = []): Skill => ({ id: id as SkillId, title: id, requires: requires as SkillId[], generators: [], representations: [] });
const fixture = (skills: Skill[], units: [string, string[]][]) => {
  const g: SkillGraph = { grade: 1, skills };
  const c: Curriculum = { grade: 1, book: 'b', units: units.map(([id, ids], i) => ({ id, order: i + 1, section: 's', title: id, skills: ids as SkillId[] })) };
  return [g, c] as const;
};

describe('grade 1 content', () => {
  it('is sound', () => {
    expect(validateCurriculum(graph, map)).toEqual([]);
  });

  it('has the 64 chapters of the two volumes, one by one', () => {
    expect(map.units.map((u) => u.id)).toEqual(Array.from({ length: 64 }, (_, i) => String(i + 1)));
  });

  it('marks exactly the revision and assessment chapters as teaching nothing new', () => {
    const review = map.units.filter((u) => u.review).map((u) => u.order);
    expect(review).toEqual([8, 16, 23, 24, 32, 38, 43, 44, 51, 57, 63, 64]);
  });

  it('never blocks a skill: the book teaches what a skill needs before the skill', () => {
    for (const unit of map.units) expect(skillAvailability(graph, map, unit.id).blocked).toEqual([]);
  });

  it('only ever adds skills as the class moves on, and ends with all of them', () => {
    let before: SkillId[] = [];
    for (const unit of map.units) {
      const { available } = skillAvailability(graph, map, unit.id);
      expect(available.length).toBe(before.length + unit.skills.length);
      expect(available.slice(0, before.length)).toEqual(before);
      before = available;
    }
    expect(before).toHaveLength(graph.skills.length);
  });

  it.each([
    ['1.add.within20.bridge', '1.add.pairs10'],
    ['1.place.exchange', '1.add.ten-plus'],
    ['1.sub.complement', '1.add.within10.missing'],
  ])('%s depends on %s', (id, required) => {
    const requiresOf = (x: string): string[] => graph.skills.find((s) => s.id === x)!.requires.flatMap((r) => [r, ...requiresOf(r)]);
    expect(requiresOf(id)).toContain(required);
  });

  it('keeps crossing the ten at chapter 42 and subtraction at chapter 28, where the book teaches them', () => {
    expect(skillAvailability(graph, map, '41').available).not.toContain('1.add.within20.bridge');
    expect(skillAvailability(graph, map, '42').available).toContain('1.add.within20.bridge');
    expect(skillAvailability(graph, map, '27').available).not.toContain('1.sub.within10.small');
    expect(skillAvailability(graph, map, '28').available).toContain('1.sub.within10.small');
  });
});

describe('skillAvailability', () => {
  it('offers nothing until a unit is set, or for a unit the book does not have', () => {
    expect(skillAvailability(graph, map, null)).toEqual({ available: [], blocked: [] });
    expect(skillAvailability(graph, map, 'nope')).toEqual({ available: [], blocked: [] });
  });

  it('accepts a requirement listed later in the same unit', () => {
    const [g, c] = fixture([skill('1.b', ['1.a']), skill('1.a')], [['u', ['1.b', '1.a']]]);
    expect(skillAvailability(g, c, 'u')).toEqual({ available: ['1.b', '1.a'], blocked: [] });
  });

  it('blocks a skill whose requirement comes later in the book, and says which', () => {
    const [g, c] = fixture([skill('1.a', ['1.b']), skill('1.b')], [['u1', ['1.a']], ['u2', ['1.b']]]);
    expect(skillAvailability(g, c, 'u1')).toEqual({ available: [], blocked: [{ id: '1.a', missing: ['1.b'] }] });
    expect(skillAvailability(g, c, 'u2').blocked).toEqual([]);
  });

  it('blocks everything downstream of a blocked skill', () => {
    const [g, c] = fixture([skill('1.a', ['1.z']), skill('1.b', ['1.a']), skill('1.z')], [['u1', ['1.a', '1.b']], ['u2', ['1.z']]]);
    expect(skillAvailability(g, c, 'u1').blocked.map((b) => b.id)).toEqual(['1.a', '1.b']);
  });
});

describe('validateCurriculum', () => {
  it('finds a cycle', () => {
    const skills = [skill('1.a', ['1.b']), skill('1.b', ['1.c']), skill('1.c', ['1.a'])];
    expect(findCycle(skills)).toEqual(['1.a', '1.b', '1.c', '1.a']);
    const [g, c] = fixture(skills, [['u', ['1.a', '1.b', '1.c']]]);
    expect(validateCurriculum(g, c).join()).toContain('cycle');
  });

  it('finds no cycle in a diamond', () => {
    expect(findCycle([skill('1.a', ['1.b', '1.c']), skill('1.b', ['1.d']), skill('1.c', ['1.d']), skill('1.d')])).toBeNull();
  });

  it.each<[string, Skill[], [string, string[]][], string]>([
    ['an unknown requirement', [skill('1.a', ['1.x'])], [['u', ['1.a']]], 'does not exist'],
    ['a self requirement', [skill('1.a', ['1.a'])], [['u', ['1.a']]], 'requires itself'],
    ['a duplicate skill', [skill('1.a'), skill('1.a')], [['u', ['1.a']]], 'defined twice'],
    ['the wrong grade in an id', [skill('2.a')], [['u', ['2.a']]], 'start with the grade'],
    ['a skill in no unit', [skill('1.a'), skill('1.b')], [['u', ['1.a']]], 'in no unit'],
    ['a skill in two units', [skill('1.a')], [['u', ['1.a']], ['v', ['1.a']]], 'more than one unit'],
    ['a unit naming an unknown skill', [skill('1.a')], [['u', ['1.a', '1.x']]], 'does not exist'],
    ['an empty unit that is not a review', [skill('1.a')], [['u', ['1.a']], ['v', []]], 'no skills'],
  ])('reports %s', (_name, skills, units, message) => {
    const [g, c] = fixture(skills, units);
    expect(validateCurriculum(g, c).join()).toContain(message);
  });
});
