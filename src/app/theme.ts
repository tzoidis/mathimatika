// The look is data per age band (PRD §6, §9); the engine stays the same. Only the
// first band's theme exists so far: a band without its own theme uses it.

import type { Grade } from '../engine/types.ts';

export type AgeBand = 'early' | 'middle' | 'late';

const THEMES_AVAILABLE: readonly AgeBand[] = ['early'];

export function ageBandOf(grade: Grade): AgeBand {
  return grade <= 2 ? 'early' : grade <= 4 ? 'middle' : 'late';
}

/** The value of <html data-band>, which selects the design tokens in index.css. */
export function themeFor(grade: Grade): AgeBand {
  const band = ageBandOf(grade);
  return THEMES_AVAILABLE.includes(band) ? band : THEMES_AVAILABLE[0]!;
}
