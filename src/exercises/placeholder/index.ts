import type { ExerciseModule } from '../types.ts';
import { generate, PLACEHOLDER_ID } from './generate.ts';
import { Placeholder } from './Placeholder.tsx';

export const placeholder: ExerciseModule = { id: PLACEHOLDER_ID, generate, Component: Placeholder };
