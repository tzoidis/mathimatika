// The ten frame: tap a cell to put a counter in it, tap again to take it away.

import { t } from '../i18n.ts';
import { formatNumber } from '../math-core/format.ts';
import type { Manipulative, ManipulativeViewProps } from './types.ts';

const FRAME_SIZE = 10;

export interface TenFrameConfig {
  frames: number;
  target: number;
}

export interface TenFrameState {
  cells: boolean[];
}

const filled = (state: TenFrameState) => state.cells.filter(Boolean).length;

function View({ state, onChange, readOnly, highlight = [] }: ManipulativeViewProps<TenFrameState>) {
  const frames = Array.from({ length: state.cells.length / FRAME_SIZE }, (_, f) => f);
  return (
    <div className="ten-frames" role="group" aria-label={tenFrame.describe(state)}>
      {frames.map((f) => (
        <div key={f} className="ten-frame ten-frame--big">
          {Array.from({ length: FRAME_SIZE }, (_, i) => {
            const cell = f * FRAME_SIZE + i;
            const on = state.cells[cell]!;
            return (
              <button
                key={cell}
                type="button"
                className="frame-button"
                disabled={readOnly}
                aria-pressed={on}
                aria-label={t('manipulative.cell')}
                onClick={() => onChange({ cells: state.cells.map((v, k) => (k === cell ? !v : v)) })}
              >
                {on ? <span className="dot dot--big" /> : highlight.includes(String(cell)) && <span className="dot dot--big dot--hollow" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const tenFrame: Manipulative<TenFrameState, TenFrameConfig> = {
  kind: 'tenFrame',
  init: ({ frames }) => ({ cells: Array.from({ length: frames * FRAME_SIZE }, () => false) }),
  View,
  read: (state) => (filled(state) === 0 ? null : String(filled(state))),
  showSolution: ({ frames, target }) => ({ cells: Array.from({ length: frames * FRAME_SIZE }, (_, i) => i < target) }),
  highlightOf: (state) => state.cells.flatMap((on, i) => (on ? [String(i)] : [])),
  demo: ({ frames }) => {
    const size = frames * FRAME_SIZE;
    return [1, 2, 0].map((n) => ({ cells: Array.from({ length: size }, (_, i) => i < n) }));
  },
  describe: (state) => t('manipulative.tenFrame', { n: formatNumber(filled(state)) }),
};
