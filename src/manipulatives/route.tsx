// Squared paper (book ch. 36): the hedgehog walks one square per arrow tapped, around
// the rocks, to the star. Four arrow buttons of 96px; the grid itself is not tapped.

import { t } from '../i18n.ts';
import { DIRECTIONS, step, type Direction } from '../math-core/generators/space.ts';
import { Mascot } from '../ui/Mascot.tsx';
import { StarIcon } from '../ui/Icons.tsx';
import type { UiKey } from '../i18n.ts';
import type { Manipulative, ManipulativeViewProps } from './types.ts';

export interface RouteConfig {
  cols: number;
  rows: number;
  start: number;
  target: number;
  obstacles: number[];
}

export interface RouteState extends RouteConfig {
  at: number;
}

const ROTATION: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };

export function ArrowGlyph({ direction, size = 56 }: { direction: Direction; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <g transform={`rotate(${ROTATION[direction]} 12 12)`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20 V4 M5 11 L12 4 L19 11" />
      </g>
    </svg>
  );
}

/** The squared paper with the hedgehog, the star and the rocks. */
export function GridPicture({ cols, rows, at, target, obstacles, hint = false }: { cols: number; rows: number; at: number; target: number; obstacles: number[]; hint?: boolean }) {
  return (
    <div className="grid-paper" style={{ gridTemplateColumns: `repeat(${cols}, var(--grid-cell))` }} role="img" aria-label={t('route.label')}>
      {Array.from({ length: cols * rows }, (_, cell) => (
        <span key={cell} className={`grid-cell ${obstacles.includes(cell) ? 'grid-cell--rock' : ''} ${hint && cell === target ? 'grid-cell--hint' : ''}`}>
          {cell === target && cell !== at && <StarIcon size={44} />}
          {cell === at && <Mascot size={56} />}
        </span>
      ))}
    </div>
  );
}

function View({ state, onChange, readOnly, highlight = [] }: ManipulativeViewProps<RouteState>) {
  return (
    <div className="route-wrap">
      <GridPicture cols={state.cols} rows={state.rows} at={state.at} target={state.target} obstacles={state.obstacles} hint={highlight.length > 0} />
      {!readOnly && (
        <div className="arrow-pad">
          {DIRECTIONS.map((d) => (
            <button key={d} type="button" className={`arrow-key arrow-key--${d}`} aria-label={t(`route.${d}` as UiKey)} onClick={() => onChange({ ...state, at: step(state, state.at, d) })}>
              <ArrowGlyph direction={d} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A few steps from the start that do not reach the star, for the first-time demo. */
function demoWalk(config: RouteConfig): number[] {
  const cells = [config.start];
  for (const d of DIRECTIONS) {
    const next = step(config, cells[cells.length - 1]!, d);
    if (next !== cells[cells.length - 1] && next !== config.target && cells.length < 3) cells.push(next);
  }
  return cells;
}

export const route: Manipulative<RouteState, RouteConfig> = {
  kind: 'grid',
  init: (config) => ({ ...config, at: config.start }),
  View,
  // where the hedgehog stands, numbered from 1; nothing until it has moved
  read: (state) => (state.at === state.start ? null : String(state.at + 1)),
  showSolution: (config) => ({ ...config, at: config.target }),
  highlightOf: (state) => [String(state.target)],
  demo: (config) => demoWalk(config).map((at) => ({ ...config, at })),
  describe: () => t('route.label'),
};
