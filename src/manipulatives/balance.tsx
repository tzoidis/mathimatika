// The balance: tap + and − to put blocks on the left pan until it evens out.

import { t } from '../i18n.ts';
import { formatNumber } from '../math-core/format.ts';
import type { Manipulative, ManipulativeViewProps } from './types.ts';

export interface BalanceConfig {
  a: number;
  total: number;
}

export interface BalanceState {
  a: number;
  total: number;
  placed: number;
}

const MAX_PLACED = 10;

export const tiltOf = (state: BalanceState): -1 | 0 | 1 => Math.sign(state.a + state.placed - state.total) as -1 | 0 | 1;

function Blocks({ n, ghost = 0 }: { n: number; ghost?: number }) {
  return (
    <div className="blocks">
      {Array.from({ length: n + ghost }, (_, i) => (
        <span key={i} className={`block ${i >= n ? 'block--ghost' : ''}`} />
      ))}
    </div>
  );
}

function View({ state, onChange, readOnly, highlight = [] }: ManipulativeViewProps<BalanceState>) {
  const tilt = tiltOf(state);
  const target = highlight[0] === undefined ? 0 : Number(highlight[0]);
  const ghost = Math.max(0, target - state.placed);
  return (
    <div className="balance-wrap">
      <div className={`balance balance--tilt${tilt + 1}`} role="img" aria-label={balance.describe(state)}>
        <div className="balance-beam" />
        <div className="balance-pan balance-pan--left">
          <Blocks n={state.a + state.placed} ghost={ghost} />
        </div>
        <div className="balance-pan balance-pan--right">
          <Blocks n={state.total} />
        </div>
        <div className="balance-post" />
      </div>
      {!readOnly && (
        <div className="balance-controls">
          <button type="button" className="choice-tile" aria-label={t('manipulative.balance.remove')} onClick={() => onChange({ ...state, placed: Math.max(0, state.placed - 1) })}>
            −
          </button>
          <button type="button" className="choice-tile" aria-label={t('manipulative.balance.add')} onClick={() => onChange({ ...state, placed: Math.min(MAX_PLACED, state.placed + 1) })}>
            +
          </button>
        </div>
      )}
    </div>
  );
}

export const balance: Manipulative<BalanceState, BalanceConfig> = {
  kind: 'balance',
  init: ({ a, total }) => ({ a, total, placed: 0 }),
  View,
  read: (state) => (state.placed === 0 ? null : String(state.placed)),
  showSolution: ({ a, total }) => ({ a, total, placed: total - a }),
  highlightOf: (state) => [String(state.placed)],
  demo: ({ a, total }) => [1, 2, 0].map((placed) => ({ a, total, placed })),
  describe: (state) => t('manipulative.balance', { left: formatNumber(state.a + state.placed), right: formatNumber(state.total) }),
};
