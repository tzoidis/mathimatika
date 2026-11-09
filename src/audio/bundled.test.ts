import { describe, expect, it } from 'vitest';
import { bundledUrl } from './bundled.ts';
import { requiredRecordings } from './recordings.ts';

// The app says these without the device voice: a phrase added to audio.json needs
// its clip (python scripts/generate-audio/generate.py).
describe('bundled clips', () => {
  it('every instruction and praise', () => {
    expect(requiredRecordings().map((r) => r.key).filter((k) => !bundledUrl(k))).toEqual([]);
  });
});
