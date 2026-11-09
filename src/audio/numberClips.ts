// The number clips of grade 1 (PRD §9): 0-100 in every form that sounds different.
// «τρεις» is the same for masculine and feminine, so they share one file.

import { numberToGreekWords, type Gender, type GrammaticalCase } from '../math-core/greekWords.ts';

export const MAX_NUMBER_CLIP = 100;

const FORMS: { suffix: string; gender: Gender; gramCase: GrammaticalCase }[] = [
  { suffix: '', gender: 'n', gramCase: 'nom' },
  { suffix: '-m', gender: 'm', gramCase: 'nom' },
  { suffix: '-f', gender: 'f', gramCase: 'nom' },
  { suffix: '-m-acc', gender: 'm', gramCase: 'acc' },
];

export interface NumberClip {
  /** the file's key: "21-m" is number/21-m.mp3 */
  key: string;
  text: string;
}

function clipsOf(n: number): NumberClip[] {
  const clips: NumberClip[] = [];
  for (const { suffix, gender, gramCase } of FORMS) {
    const text = numberToGreekWords(n, gender, gramCase);
    if (!clips.some((c) => c.text === text)) clips.push({ key: `${n}${suffix}`, text });
  }
  return clips;
}

export function numberClips(): NumberClip[] {
  return Array.from({ length: MAX_NUMBER_CLIP + 1 }, (_, n) => clipsOf(n)).flat();
}

/** What to ask the AudioService for; a number with no clip falls back to the local voice. */
export function numberRequest(n: number, gender: Gender = 'n', gramCase: GrammaticalCase = 'nom'): { kind: 'number'; key: string; text: string } {
  const text = numberToGreekWords(n, gender, gramCase);
  const clip = n >= 0 && n <= MAX_NUMBER_CLIP ? clipsOf(n).find((c) => c.text === text) : undefined;
  return { kind: 'number', key: clip?.key ?? String(n), text };
}
