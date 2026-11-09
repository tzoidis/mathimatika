// Which exercise a round plays. Before a chapter is set there is nothing to practise
// from the book, so the round is the placeholder, which leaves no trace.

import type { RoundKind } from '../engine/types.ts';
import type { PlayableGenerator } from '../math-core/generators/types.ts';
import { fluency } from './fluency/index.ts';
import { placeholder } from './placeholder/index.ts';
import { question } from './question/index.ts';
import type { ExerciseModule } from './types.ts';

export interface ExerciseEntry {
  module: ExerciseModule;
  /** false: the round leaves no trace in answers, stars or rounds played */
  countsForProgress: boolean;
}

export function exerciseForRound(kind: RoundKind, generators: readonly PlayableGenerator[], playFluency = false): ExerciseEntry {
  if (kind === 'mix' && playFluency) return { module: fluency, countsForProgress: true };
  return generators.length > 0 ? { module: question, countsForProgress: true } : { module: placeholder, countsForProgress: false };
}
