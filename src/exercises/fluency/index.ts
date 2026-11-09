import type { ExerciseModule } from '../types.ts';
import { Fluency } from './Fluency.tsx';
import { FLUENCY_ID, generate } from './generate.ts';

export const fluency: ExerciseModule = { id: FLUENCY_ID, generate, Component: Fluency };
