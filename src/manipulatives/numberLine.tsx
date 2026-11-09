// The number line: tap anywhere along its tall strip and the marker snaps to the
// nearest number, so a tick being narrow does not make it hard to hit.

import type { MouseEvent } from 'react';
import { t } from '../i18n.ts';
import { formatNumber } from '../math-core/format.ts';
import type { LineLabels } from '../math-core/generators/types.ts';
import type { Manipulative, ManipulativeViewProps } from './types.ts';

export interface NumberLineConfig {
  max: number;
  labels: LineLabels;
  /** where the marker starts */
  mark: number | null;
  target: number;
}

export interface NumberLineState {
  max: number;
  labels: LineLabels;
  at: number | null;
}

/** Space kept clear at each end of the strip, in pixels, so the end labels fit. */
const INSET = 28;

export function tickAt(x: number, width: number, max: number): number {
  const along = (x - INSET) / (width - 2 * INSET);
  return Math.min(max, Math.max(0, Math.round(along * max)));
}

export function showsLabel(tick: number, max: number, labels: LineLabels): boolean {
  if (tick === 0 || tick === max) return true;
  return labels === 'all' || (labels === 'fives' && tick % 5 === 0);
}

function View({ state, onChange, readOnly, highlight = [] }: ManipulativeViewProps<NumberLineState>) {
  const { max, labels, at } = state;
  const ticks = Array.from({ length: max + 1 }, (_, i) => i);
  const position = (tick: number) => `calc(${INSET}px + (100% - ${2 * INSET}px) * ${tick} / ${max})`;

  const tap = (e: MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const box = e.currentTarget.getBoundingClientRect();
    onChange({ ...state, at: tickAt(e.clientX - box.left, box.width, max) });
  };

  return (
    <div className={`number-line ${readOnly ? '' : 'number-line--active'}`} role="img" aria-label={numberLine.describe(state)} onClick={tap}>
      <span className="line-track" style={{ left: INSET, right: INSET }} />
      {ticks.map((tick) => (
        <span key={tick} className="line-tick" style={{ left: position(tick) }}>
          {showsLabel(tick, max, labels) && <span className="line-label">{formatNumber(tick)}</span>}
        </span>
      ))}
      {highlight.map((h) => (
        <span key={h} className="line-marker line-marker--hint" style={{ left: position(Number(h)) }} />
      ))}
      {at !== null && <span className="line-marker" style={{ left: position(at) }} />}
    </div>
  );
}

export const numberLine: Manipulative<NumberLineState, NumberLineConfig> = {
  kind: 'numberLine',
  init: ({ max, labels, mark }) => ({ max, labels, at: mark }),
  View,
  read: (state) => (state.at === null ? null : String(state.at)),
  showSolution: ({ max, labels, target }) => ({ max, labels, at: target }),
  highlightOf: (state) => (state.at === null ? [] : [String(state.at)]),
  demo: ({ max, labels, target }) => [target === 1 ? 2 : 1, target === 3 ? 4 : 3, null].map((at) => ({ max, labels, at })),
  describe: (state) => (state.at === null ? t('manipulative.line.empty') : t('manipulative.line', { n: formatNumber(state.at) })),
};
