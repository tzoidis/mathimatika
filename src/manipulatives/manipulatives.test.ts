import { describe, expect, it } from 'vitest';
import { balance, tiltOf } from './balance.tsx';
import { numberLine, showsLabel, tickAt } from './numberLine.tsx';
import { rods } from './rods.tsx';
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

describe('balance', () => {
  const config = { a: 3, total: 8 };

  it('starts with nothing placed, tipped towards the heavier side', () => {
    const state = balance.init(config);
    expect(balance.read(state)).toBeNull();
    expect(tiltOf(state)).toBe(-1);
  });

  it('evens out at the solution, and tips the other way past it', () => {
    const solved = balance.showSolution(config);
    expect(balance.read(solved)).toBe('5');
    expect(tiltOf(solved)).toBe(0);
    expect(tiltOf({ ...solved, placed: 6 })).toBe(1);
  });
});

describe('the first-time demo', () => {
  it('ends empty on the ten frame, and shows something before that', () => {
    const frames = tenFrame.demo({ frames: 1, target: 3 });
    expect(frames.length).toBeGreaterThan(1);
    expect(tenFrame.read(frames[frames.length - 1]!)).toBeNull();
    expect(tenFrame.read(frames[0]!)).toBe('1');
  });

  it('never lands on the answer of the number line question', () => {
    for (const target of [1, 2, 3, 4, 7]) {
      const shown = numberLine.demo({ max: 10, labels: 'all', mark: null, target }).map((s) => s.at);
      expect(shown).not.toContain(target);
      expect(shown[shown.length - 1]).toBeNull();
    }
  });

  it('adds blocks on the balance and takes them off again', () => {
    expect(balance.demo({ a: 3, total: 8 }).map((s) => s.placed)).toEqual([1, 2, 0]);
  });
});

describe('rods and cubes', () => {
  const build = { mode: 'build' as const, target: 37, tens: 0, units: 0 };
  const regroup = { mode: 'regroup' as const, target: 24, tens: 1, units: 14 };

  it('builds a number from rods and cubes, any way that makes it', () => {
    expect(rods.read(rods.init(build))).toBeNull();
    expect(rods.read({ mode: 'build', tens: 3, units: 7 })).toBe('37');
    expect(rods.read({ mode: 'build', tens: 2, units: 17 })).toBe('37');
    expect(rods.read(rods.showSolution(build))).toBe('37');
    expect(rods.highlightOf(rods.showSolution(build))).toEqual(['3', '7']);
  });

  it('reads untied cubes as the table would be written, never as the answer', () => {
    expect(rods.read(rods.init(regroup))).toBe('114');
    expect(rods.read({ mode: 'regroup', tens: 2, units: 4 })).toBe('24');
    expect(rods.read(rods.showSolution(regroup))).toBe('24');
  });

  it('never demonstrates the answer to the question in hand', () => {
    for (const target of [11, 12, 20, 37, 50]) for (const s of rods.demo({ ...build, target })) expect(rods.read(s)).not.toBe(String(target));
    for (const s of rods.demo(regroup)) expect(rods.read(s)).not.toBe('24');
    for (const s of rods.demo({ mode: 'regroup', target: 21, tens: 1, units: 11 })) expect(rods.read(s)).not.toBe('21');
  });
});
