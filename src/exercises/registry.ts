// Which exercise a round plays. Until ΜΘ3 every round is the placeholder.

import type { RoundKind } from '../engine/types.ts';
import { placeholder } from './placeholder/index.ts';
import type { ExerciseModule } from './types.ts';

export interface ExerciseEntry {
  module: ExerciseModule;
  /** false: the round leaves no trace in answers, stars or rounds played */
  countsForProgress: boolean;
}

const PLACEHOLDER: ExerciseEntry = { module: placeholder, countsForProgress: false };

export function exerciseForRound(_kind: RoundKind): ExerciseEntry {
  return PLACEHOLDER;
}
