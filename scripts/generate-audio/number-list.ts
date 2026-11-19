// Prints the number clips as JSON for generate.py, which is in Python and must
// not keep its own copy of the Greek forms.

// A clip may be made from a different spelling of the same word, chosen by ear
// (audio.json numberSpeech: «Ένα.» rounds off what «ένα» cut short).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { numberClips } from '../../src/audio/numberClips.ts';

export const numberSpeech: Record<string, string> = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'src', 'content', 'audio.json'), 'utf8')).numberSpeech ?? {};

if (import.meta.main) process.stdout.write(JSON.stringify(numberClips().map((c) => ({ ...c, text: numberSpeech[c.key] ?? c.text }))));
