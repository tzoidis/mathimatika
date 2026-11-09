import { describe, expect, it } from 'vitest';
import { praiseKeys } from '../../audio/recordings.ts';
import { mulberry32 } from '../../engine/rng.ts';
import { QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import { generate, type PlaceholderItem } from './generate.ts';

describe('placeholder round', () => {
  const round = (seed: number) => generate({ roundKind: 'warmup', level: 1, rng: mulberry32(seed), generators: [], fresh: [] });

  it('has five items with an existing praise, never the same twice in a row', () => {
    for (let seed = 0; seed < 200; seed++) {
      const items = round(seed).items as PlaceholderItem[];
      expect(items).toHaveLength(QUESTIONS_PER_ROUND);
      items.forEach((item, i) => {
        expect(praiseKeys()).toContain(item.praiseKey);
        if (i > 0) expect(item.praiseKey).not.toBe(items[i - 1]!.praiseKey);
      });
    }
  });

  it('is deterministic for a seed', () => {
    expect(round(7)).toEqual(round(7));
  });
});
