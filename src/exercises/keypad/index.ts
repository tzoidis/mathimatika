import type { ExerciseModule } from '../types.ts';
import { generate, KEYPAD_ID } from './generate.ts';
import { Keypad } from './Keypad.tsx';

export const keypad: ExerciseModule = { id: KEYPAD_ID, generate, Component: Keypad };
