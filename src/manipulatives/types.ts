// The things a child handles on screen (PRD §9). Every one is tapped, never dragged,
// with targets of at least 96px, and its state is plain data.

import type { FC } from 'react';
import type { RepresentationKind } from '../engine/types.ts';

export interface ManipulativeViewProps<S> {
  state: S;
  onChange(s: S): void;
  readOnly: boolean;
  /** parts to show as «this is where it goes»; see highlightOf */
  highlight?: string[];
}

export interface Manipulative<S, C> {
  kind: RepresentationKind;
  init(config: C): S;
  View: FC<ManipulativeViewProps<S>>;
  /** the answer as typed text, the same form the keypad gives; null if nothing was done yet */
  read(state: S): string | null;
  /** the state of the right answer */
  showSolution(config: C): S;
  /** which parts of a state to highlight, for View's `highlight` */
  highlightOf(state: S): string[];
  /** spoken by screen readers */
  describe(state: S): string;
}
