// Session flow, PRD §6: 3 rounds × 5 questions, in a fixed order, with a break
// between rounds. In grades 1-2 the child does not pick a station. When the daily
// limit is reached, the current round finishes, then the session ends with
// "see you tomorrow".

import type { RoundKind } from './types.ts';

export const QUESTIONS_PER_ROUND = 5;
export const ROUND_KINDS: readonly RoundKind[] = ['warmup', 'workshop', 'mix'];
export const ROUNDS_PER_SESSION = ROUND_KINDS.length;

export type Phase = { kind: 'play'; roundKind: RoundKind } | { kind: 'break' } | { kind: 'done'; reason: 'complete' | 'limit' };

export interface SessionState {
  /** 0-based index of the current (or next) round */
  round: number;
  phase: Phase;
  /** completed rounds, in order */
  played: RoundKind[];
  limitReached: boolean;
}

export type SessionAction = { type: 'roundComplete' } | { type: 'limitReached' } | { type: 'continue' };

export function startSession(): SessionState {
  return { round: 0, phase: { kind: 'play', roundKind: ROUND_KINDS[0]! }, played: [], limitReached: false };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  const { phase } = state;
  switch (action.type) {
    case 'roundComplete': {
      if (phase.kind !== 'play') return state;
      const played = [...state.played, phase.roundKind];
      const round = state.round + 1;
      const next: Phase = state.limitReached
        ? { kind: 'done', reason: 'limit' }
        : round >= ROUNDS_PER_SESSION
          ? { kind: 'done', reason: 'complete' }
          : { kind: 'break' };
      return { ...state, round, played, phase: next };
    }

    case 'limitReached':
      if (phase.kind === 'play') return { ...state, limitReached: true };
      if (phase.kind === 'done') return state;
      return { ...state, limitReached: true, phase: { kind: 'done', reason: 'limit' } };

    case 'continue':
      if (phase.kind !== 'break') return state;
      return { ...state, phase: { kind: 'play', roundKind: ROUND_KINDS[state.round]! } };
  }
}
