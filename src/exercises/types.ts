// Shared exercise interface. Every mechanism is one folder under src/exercises/
// exporting an ExerciseModule. ΜΘ3 replaces `generate` with the PRD §9 generators.

import type { FC } from 'react';
import type { AnswerLog, Level, Round, RoundKind } from '../engine/types.ts';

export interface GenerateContext {
  roundKind: RoundKind;
  level: Level;
  rng: () => number;
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
