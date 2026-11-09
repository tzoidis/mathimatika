// Shared exercise interface. Every mechanism is one folder under src/exercises/
// exporting an ExerciseModule.

import type { FC } from 'react';
import type { AnswerLog, Level, Round, RoundKind } from '../engine/types.ts';
import type { Fact } from '../math-core/facts.ts';
import type { PlayableGenerator } from '../math-core/generators/types.ts';

export interface GenerateContext {
  roundKind: RoundKind;
  level: Level;
  rng: () => number;
  /** what the class has reached, in book order */
  generators: PlayableGenerator[];
  /** those of the latest chapter that has any: the current unit */
  fresh: PlayableGenerator[];
  /** the number facts open so far; only the fluency round uses them */
  facts?: Fact[];
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
