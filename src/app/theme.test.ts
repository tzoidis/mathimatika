import { describe, expect, it } from 'vitest';
import { ageBandOf, themeFor } from './theme.ts';

describe('age band', () => {
  it('groups the six grades in pairs', () => {
    expect(([1, 2, 3, 4, 5, 6] as const).map(ageBandOf)).toEqual(['early', 'early', 'middle', 'middle', 'late', 'late']);
  });

  it('uses the only theme for every grade for now', () => {
    expect(([1, 3, 6] as const).map(themeFor)).toEqual(['early', 'early', 'early']);
  });
});
