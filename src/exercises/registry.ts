// Which exercise a round plays. Before a chapter is set there is nothing to practise
// from the book, so the round is the placeholder, which leaves no trace.

import type { RoundKind } from '../engine/types.ts';
import type { PlayableGenerator } from '../math-core/generators/types.ts';
import { keypad } from './keypad/index.ts';
import { placeholder } from './placeholder/index.ts';
import type { ExerciseModule } from './types.ts';

export interface ExerciseEntry {
  module: ExerciseModule;
  /** false: the round leaves no trace in answers, stars or rounds played */
  countsForProgress: boolean;
}

export function exerciseForRound(_kind: RoundKind, generators: readonly PlayableGenerator[]): ExerciseEntry {
  return generators.length > 0 ? { module: keypad, countsForProgress: true } : { module: placeholder, countsForProgress: false };
}
