import { describe, expect, it } from 'vitest';
import { numberToGreekWords } from '../math-core/greekWords.ts';
import { numberClips, numberRequest } from './numberClips.ts';

describe('number clips', () => {
  const clips = numberClips();

  it('has unique keys and only one file per spoken form of a number', () => {
    expect(new Set(clips.map((c) => c.key)).size).toBe(clips.length);
    for (const c of clips) {
      const n = c.key.split('-')[0];
      expect(clips.filter((o) => o.key.split('-')[0] === n && o.text === c.text)).toHaveLength(1);
    }
  });

  it('points every form of 0-100 to a clip with exactly that text', () => {
    const byKey = new Map(clips.map((c) => [c.key, c.text]));
    for (let n = 0; n <= 100; n++) {
      for (const gender of ['m', 'f', 'n'] as const) {
        for (const gramCase of ['nom', 'acc'] as const) {
          const req = numberRequest(n, gender, gramCase);
          expect(byKey.get(req.key)).toBe(numberToGreekWords(n, gender, gramCase));
        }
      }
    }
  });

  it('shares clips between the forms that sound the same', () => {
    expect(numberRequest(3, 'm').key).toBe(numberRequest(3, 'f').key);
    expect(numberRequest(3, 'n').key).not.toBe(numberRequest(3, 'f').key);
    expect(numberRequest(5, 'f').key).toBe('5');
    expect(numberRequest(1, 'f', 'acc').key).toBe(numberRequest(1, 'f', 'nom').key);
  });

  it('leaves a number beyond the clips to the local voice, with its words', () => {
    expect(numberRequest(101, 'f')).toEqual({ kind: 'number', key: '101', text: 'εκατόν μία' });
  });
});
