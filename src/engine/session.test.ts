import { describe, expect, it } from 'vitest';
import { mulberry32, shuffle } from './rng.ts';
import { ROUND_KINDS, ROUNDS_PER_SESSION, sessionReducer, startSession, type SessionState } from './session.ts';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(7))).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(7)));
  });
});

describe('session flow', () => {
  const play = (s: SessionState) => sessionReducer(s, { type: 'roundComplete' });
  const resume = (s: SessionState) => sessionReducer(s, { type: 'continue' });

  it('runs warm-up, workshop and mix with a break between them', () => {
    let s = startSession();
    expect(s.phase).toEqual({ kind: 'play', roundKind: 'warmup' });
    s = play(s);
    expect(s.phase).toEqual({ kind: 'break' });
    s = resume(s);
    expect(s.phase).toEqual({ kind: 'play', roundKind: 'workshop' });
    s = play(s);
    expect(s.phase).toEqual({ kind: 'break' });
    s = resume(s);
    expect(s.phase).toEqual({ kind: 'play', roundKind: 'mix' });
    s = play(s);
    expect(s.phase).toEqual({ kind: 'done', reason: 'complete' });
    expect(s.played).toEqual([...ROUND_KINDS]);
    expect(s.round).toBe(ROUNDS_PER_SESSION);
  });

  it('ignores actions that do not fit the phase', () => {
    const start = startSession();
    expect(resume(start)).toBe(start);
    const inBreak = play(start);
    expect(play(inBreak)).toBe(inBreak);
  });

  it('lets the current round finish when the limit is reached', () => {
    let s = sessionReducer(startSession(), { type: 'limitReached' });
    expect(s.phase.kind).toBe('play');
    s = play(s);
    expect(s.phase).toEqual({ kind: 'done', reason: 'limit' });
  });

  it('ends at once if the limit is reached during a break', () => {
    const s = sessionReducer(play(startSession()), { type: 'limitReached' });
    expect(s.phase).toEqual({ kind: 'done', reason: 'limit' });
  });
});
