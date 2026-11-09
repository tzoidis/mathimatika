// Shared exercise interface. Every mechanism is one folder under src/exercises/
// exporting an ExerciseModule.

import type { FC } from 'react';
import type { AnswerLog, Level, Round, RoundKind } from '../engine/types.ts';
import type { PlayableGenerator } from '../math-core/generators/types.ts';

export interface GenerateContext {
  roundKind: RoundKind;
  level: Level;
  rng: () => number;
  /** what the class has reached, in book order */
  generators: PlayableGenerator[];
}

export interface ExerciseProps {
  round: Round;
  onAnswer(e: AnswerLog): void;
  onComplete(): void;
}

export interface ExerciseModule {
  id: string;
  /** No side effects; deterministic for the same rng seed. */
  generate(ctx: GenerateContext): Round;
  Component: FC<ExerciseProps>;
}
