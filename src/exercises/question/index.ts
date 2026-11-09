import type { ExerciseModule } from '../types.ts';
import { generate, QUESTION_ID } from './generate.ts';
import { Question } from './Question.tsx';

export const question: ExerciseModule = { id: QUESTION_ID, generate, Component: Question };
