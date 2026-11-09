// The content files as typed data. A grade without a book map yet gets nothing.

import bookMap1 from '../content/book-map.1.json';
import letters from '../content/letters.json';
import skills1 from '../content/skills.1.json';
import { skillAvailability } from '../engine/curriculum.ts';
import type { Curriculum, Grade, SkillGraph } from '../engine/types.ts';
import { generatorById } from '../math-core/generators/index.ts';
import type { PlayableGenerator } from '../math-core/generators/types.ts';

export interface GradeContent {
  graph: SkillGraph;
  curriculum: Curriculum;
}

const CONTENT: Partial<Record<Grade, GradeContent>> = {
  1: { graph: skills1 as unknown as SkillGraph, curriculum: bookMap1 as unknown as Curriculum },
};

export const gradeContent = (grade: Grade): GradeContent | null => CONTENT[grade] ?? null;

/** The generators of everything the class has reached, in book order. */
export function availableGenerators(grade: Grade, upToUnit: string | null): PlayableGenerator[] {
  const content = gradeContent(grade);
  if (!content) return [];
  const { available } = skillAvailability(content.graph, content.curriculum, upToUnit);
  return available.flatMap((id) =>
    (content.graph.skills.find((s) => s.id === id)?.generators ?? []).flatMap((generatorId) => generatorById(generatorId) ?? []),
  );
}

/** The generators of the latest chapter reached that has any: the class's current unit. */
export function latestGenerators(grade: Grade, upToUnit: string | null): PlayableGenerator[] {
  const content = gradeContent(grade);
  const last = content?.curriculum.units.find((u) => u.id === upToUnit);
  if (!content || !last) return [];
  const all = availableGenerators(grade, upToUnit);
  const reached = content.curriculum.units.filter((u) => u.order <= last.order).reverse();
  for (const unit of reached) {
    const here = all.filter((g) => unit.skills.includes(g.skill));
    if (here.length > 0) return here;
  }
  return [];
}

export const LETTER_UNITS: { title: string; graphemes: string[] }[] = letters.units;
