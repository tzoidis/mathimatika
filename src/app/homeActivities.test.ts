import { describe, expect, it } from 'vitest';
import bookMap from '../content/book-map.1.json';
import type { Curriculum } from '../engine/types.ts';
import { homeActivities, reachedActivities } from './homeActivities.ts';

const curriculum = bookMap as Curriculum;

describe('home activities', () => {
  it('belong to chapters of the book, each with its own id', () => {
    const ids = homeActivities(1).map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of homeActivities(1)) expect(curriculum.units.some((u) => u.id === a.unit), a.id).toBe(true);
  });

  it('appear only once the class reaches their chapter', () => {
    expect(reachedActivities(1, curriculum, null)).toEqual([]);
    expect(reachedActivities(1, curriculum, '5')).toEqual([]);
    expect(reachedActivities(1, curriculum, '25').map((a) => a.id)).toEqual(['write']);
    expect(reachedActivities(1, curriculum, '26').map((a) => a.id)).toEqual(['lines', 'write']);
    expect(reachedActivities(1, curriculum, '54').map((a) => a.id)).toEqual(['span', 'steps', 'litre', 'tangram', 'calendar', 'lines', 'write']);
    expect(reachedActivities(1, curriculum, '60')[0]!.id).toBe('weigh');
    expect(reachedActivities(1, curriculum, '64').length).toBe(homeActivities(1).length);
  });
});
