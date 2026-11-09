// The content files as typed data. A grade without a book map yet gets nothing.

import bookMap1 from '../content/book-map.1.json';
import letters from '../content/letters.json';
import skills1 from '../content/skills.1.json';
import type { Curriculum, Grade, SkillGraph } from '../engine/types.ts';

export interface GradeContent {
  graph: SkillGraph;
  curriculum: Curriculum;
}

const CONTENT: Partial<Record<Grade, GradeContent>> = {
  1: { graph: skills1 as unknown as SkillGraph, curriculum: bookMap1 as unknown as Curriculum },
};

export const gradeContent = (grade: Grade): GradeContent | null => CONTENT[grade] ?? null;

export const LETTER_UNITS: { title: string; graphemes: string[] }[] = letters.units;
