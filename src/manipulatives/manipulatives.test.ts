import { describe, expect, it } from 'vitest';
import { numberLine, showsLabel, tickAt } from './numberLine.tsx';
import { tenFrame } from './tenFrame.tsx';

describe('ten frame', () => {
  const config = { frames: 2, target: 13 };

  it('starts empty, with nothing to read', () => {
    const state = tenFrame.init(config);
    expect(state.cells).toHaveLength(20);
    expect(tenFrame.read(state)).toBeNull();
  });

  it('reads how many counters are on it, wherever they are', () => {
    const state = tenFrame.init(config);
    state.cells[0] = true;
    state.cells[7] = true;
    state.cells[19] = true;
    expect(tenFrame.read(state)).toBe('3');
  });

  it('solves by filling from the start, which reads as the target', () => {
    const solved = tenFrame.showSolution(config);
    expect(tenFrame.read(solved)).toBe('13');
    expect(solved.cells.slice(0, 13).every(Boolean)).toBe(true);
    expect(tenFrame.highlightOf(solved)).toHaveLength(13);
  });

  it('describes itself', () => {
    expect(tenFrame.describe(tenFrame.showSolution(config))).toContain('13');
  });
});

describe('number line', () => {
  const config = { max: 20, labels: 'all' as const, mark: null, target: 7 };

  it('starts with no marker unless it is given one', () => {
    expect(numberLine.read(numberLine.init(config))).toBeNull();
    expect(numberLine.read(numberLine.init({ ...config, mark: 4 }))).toBe('4');
  });

  it('reads and solves at the target', () => {
    const solved = numberLine.showSolution(config);
    expect(numberLine.read(solved)).toBe('7');
    expect(numberLine.highlightOf(solved)).toEqual(['7']);
  });

  it('snaps a tap to the nearest number and never leaves the line', () => {
    expect(tickAt(28, 556, 10)).toBe(0);
    expect(tickAt(528, 556, 10)).toBe(10);
    expect(tickAt(278, 556, 10)).toBe(5);
    expect(tickAt(0, 556, 10)).toBe(0);
    expect(tickAt(556, 556, 10)).toBe(10);
    expect(tickAt(300, 556, 10)).toBe(5);
  });

  it('labels the ends always, and the rest by level', () => {
    expect(showsLabel(0, 20, 'ends')).toBe(true);
    expect(showsLabel(20, 20, 'ends')).toBe(true);
    expect(showsLabel(10, 20, 'ends')).toBe(false);
    expect(showsLabel(10, 20, 'fives')).toBe(true);
    expect(showsLabel(7, 20, 'fives')).toBe(false);
    expect(showsLabel(7, 20, 'all')).toBe(true);
  });
});
