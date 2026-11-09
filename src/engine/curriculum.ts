// Skill graph and book map, PRD §4. Pure: the content files come in as arguments,
// so scripts/validate-content.ts and the tests share this code with the app.

import { REPRESENTATION_KINDS, type Curriculum, type Skill, type SkillGraph, type SkillId } from './types.ts';

/** A cycle in the requires of these skills, as a path that ends where it starts; null if there is none. */
export function findCycle(skills: Skill[]): SkillId[] | null {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const done = new Set<SkillId>();
  const path: SkillId[] = [];

  function visit(id: SkillId): SkillId[] | null {
    const seenAt = path.indexOf(id);
    if (seenAt >= 0) return [...path.slice(seenAt), id];
    if (done.has(id)) return null;
    path.push(id);
    for (const required of byId.get(id)?.requires ?? []) {
      const cycle = visit(required);
      if (cycle) return cycle;
    }
    path.pop();
    done.add(id);
    return null;
  }

  for (const skill of skills) {
    const cycle = visit(skill.id);
    if (cycle) return cycle;
  }
  return null;
}

function duplicates<T>(values: T[]): T[] {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
}

/** Everything wrong with one grade's graph and book map; empty when they are sound. */
export function validateCurriculum(graph: SkillGraph, curriculum: Curriculum): string[] {
  const errors: string[] = [];
  const ids = new Set(graph.skills.map((s) => s.id));
  const kinds = new Set<string>(REPRESENTATION_KINDS);

  if (graph.grade !== curriculum.grade) errors.push(`graph is for grade ${graph.grade}, book map for grade ${curriculum.grade}`);
  for (const id of duplicates(graph.skills.map((s) => s.id))) errors.push(`${id}: defined twice`);

  for (const skill of graph.skills) {
    if (!skill.id.startsWith(`${graph.grade}.`)) errors.push(`${skill.id}: id does not start with the grade`);
    if (skill.title.trim() === '') errors.push(`${skill.id}: no title`);
    if (skill.requires.includes(skill.id)) errors.push(`${skill.id}: requires itself`);
    for (const required of skill.requires) if (!ids.has(required)) errors.push(`${skill.id}: requires ${required}, which does not exist`);
    for (const kind of skill.representations) if (!kinds.has(kind)) errors.push(`${skill.id}: unknown representation ${kind}`);
  }

  const cycle = findCycle(graph.skills);
  if (cycle) errors.push(`requires form a cycle: ${cycle.join(' -> ')}`);

  for (const id of duplicates(curriculum.units.map((u) => u.id))) errors.push(`unit ${id}: defined twice`);
  curriculum.units.forEach((unit, i) => {
    if (i > 0 && unit.order <= curriculum.units[i - 1]!.order) errors.push(`unit ${unit.id}: out of order`);
    if (unit.title.trim() === '') errors.push(`unit ${unit.id}: no title`);
    if (unit.review && unit.skills.length > 0) errors.push(`unit ${unit.id}: a review chapter teaches nothing new`);
    if (!unit.review && unit.skills.length === 0) errors.push(`unit ${unit.id}: no skills`);
    for (const id of unit.skills) if (!ids.has(id)) errors.push(`unit ${unit.id}: skill ${id} does not exist`);
  });

  const mapped = curriculum.units.flatMap((u) => u.skills);
  for (const id of duplicates(mapped)) errors.push(`${id}: in more than one unit`);
  for (const id of ids) if (!mapped.includes(id)) errors.push(`${id}: in no unit of the book map`);

  return errors;
}

export interface BlockedSkill {
  id: SkillId;
  /** direct requirements that have not appeared yet */
  missing: SkillId[];
}

export interface Availability {
  /** in book order */
  available: SkillId[];
  /** reached by the book, but something they need has not appeared: the parent is warned */
  blocked: BlockedSkill[];
}

/** PRD §4: available = its unit is reached and everything it requires has already appeared. */
export function skillAvailability(graph: SkillGraph, curriculum: Curriculum, upToUnit: string | null): Availability {
  const last = curriculum.units.find((u) => u.id === upToUnit);
  if (!last) return { available: [], blocked: [] };

  const reached = curriculum.units.filter((u) => u.order <= last.order).flatMap((u) => u.skills);
  const inReach = new Set(reached);
  const byId = new Map(graph.skills.map((s) => [s.id, s]));
  const known = new Map<SkillId, boolean>();

  // Memoised over a validated DAG, so this terminates.
  const isAvailable = (id: SkillId): boolean => {
    const cached = known.get(id);
    if (cached !== undefined) return cached;
    const result = inReach.has(id) && (byId.get(id)?.requires ?? []).every(isAvailable);
    known.set(id, result);
    return result;
  };

  const availability: Availability = { available: [], blocked: [] };
  for (const id of reached) {
    if (isAvailable(id)) availability.available.push(id);
    else availability.blocked.push({ id, missing: byId.get(id)!.requires.filter((r) => !isAvailable(r)) });
  }
  return availability;
}
