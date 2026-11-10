// The allowed-words rule of Glossa (its PRD §3), copied: text reaches the screen only
// if the child can read every word of it (PRD §7). A word is allowed when all its
// graphemes are taught up to the parent's «reads up to letter…», or it is a sight word,
// and all its pronunciation flags are unlocked. Diaeresis stays locked.
//
// Glossa has a word bank with hand-checked flags; here every word goes through the
// detector, which errs on the strict side. That only ever hides text, never shows too much.

import letters from '../../content/letters.json' with { type: 'json' };
import type { Flag } from './flags.ts';
import { lowerKey, splitWords, tokenize } from './greekTokenizer.ts';
import { detectFlags } from './pronunciationFlags.ts';

export interface LetterUnit {
  title: string;
  graphemes: string[];
  sightWords: string[];
  unlocksFlags: Flag[];
}

export const LETTER_UNITS = letters.units as LetterUnit[];

export interface ReadingContext {
  position: number;
  positionOf: Map<string, number>;
  unlockedFlags: Set<Flag>;
  sightWords: Set<string>;
}

/** `position` is how many graphemes are taught, in the order of letters.json. */
export function readingContext(position: number, units: readonly LetterUnit[] = LETTER_UNITS): ReadingContext {
  const positionOf = new Map<string, number>();
  const unlockedFlags = new Set<Flag>();
  const sightWords = new Set<string>();
  let taught = 0;
  for (const unit of units) {
    const reached = position > taught;
    for (const g of unit.graphemes) positionOf.set(g, ++taught);
    if (!reached) continue;
    unit.unlocksFlags.forEach((f) => unlockedFlags.add(f));
    unit.sightWords.forEach((w) => sightWords.add(lowerKey(w)));
  }
  return { position, positionOf, unlockedFlags, sightWords };
}

export function isWordAllowed(text: string, ctx: ReadingContext): boolean {
  const key = lowerKey(text);
  if (ctx.sightWords.has(key)) return true;
  const tokens = tokenize(key);
  if (tokens.some((t) => t.diaeresis)) return false;
  if (tokens.some((t) => (ctx.positionOf.get(t.g) ?? Infinity) > ctx.position)) return false;
  return detectFlags(key).every((f) => ctx.unlockedFlags.has(f));
}

/** Every word of a piece of text; digits and signs are not words and always pass. */
export function isTextAllowed(text: string, ctx: ReadingContext): boolean {
  return splitWords(text).every((w) => isWordAllowed(w, ctx));
}
