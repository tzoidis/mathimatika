// The home activity cards of a grade, and which of them the class has reached.

import home1 from '../content/home.1.json' with { type: 'json' };
import type { Curriculum, Grade } from '../engine/types.ts';

export interface HomeActivity {
  id: string;
  /** the book chapter that brings it */
  unit: string;
  title: string;
  text: string;
}

const ACTIVITIES: Partial<Record<Grade, HomeActivity[]>> = { 1: home1.activities };

export const homeActivities = (grade: Grade): HomeActivity[] => ACTIVITIES[grade] ?? [];

/** The cards of the chapters reached so far, the newest first. */
export function reachedActivities(grade: Grade, curriculum: Curriculum, upToUnit: string | null): HomeActivity[] {
  const last = curriculum.units.find((u) => u.id === upToUnit);
  if (!last) return [];
  const order = (unit: string) => curriculum.units.find((u) => u.id === unit)?.order ?? Infinity;
  return homeActivities(grade)
    .filter((a) => order(a.unit) <= last.order)
    .sort((a, b) => order(b.unit) - order(a.unit));
}
