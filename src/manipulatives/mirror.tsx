// Mirror halves (book ch. 56): the left half is coloured; the child taps squares of the
// right half until it is the left half seen in a mirror. Every square is 96px.

import { t } from '../i18n.ts';
import { COPIED, copied, MIRRORED, mirrored, OTHER } from '../math-core/generators/space.ts';
import type { Manipulative, ManipulativeViewProps } from './types.ts';

export interface MirrorConfig {
  half: number;
  rows: number;
  filled: number[];
}

export interface MirrorState extends MirrorConfig {
  /** coloured squares of the right half, as row * half + column */
  right: number[];
}

const same = (a: number[], b: number[]) => [...a].sort((x, y) => x - y).join() === [...b].sort((x, y) => x - y).join();

function View({ state, onChange, readOnly, highlight = [] }: ManipulativeViewProps<MirrorState>) {
  const cells = Array.from({ length: state.half * state.rows }, (_, i) => i);
  const columns = { gridTemplateColumns: `repeat(${state.half}, var(--mirror-cell))` };
  return (
    <div className="mirror" role="group" aria-label={t('mirror.label')}>
      <div className="mirror-half" style={columns}>
        {cells.map((c) => (
          <span key={c} className={`mirror-cell ${state.filled.includes(c) ? 'mirror-cell--on' : ''}`} />
        ))}
      </div>
      <span className="mirror-fold" aria-hidden />
      <div className="mirror-half" style={columns}>
        {cells.map((c) => {
          const on = state.right.includes(c);
          return (
            <button
              key={c}
              type="button"
              disabled={readOnly}
              aria-pressed={on}
              aria-label={t('mirror.cell')}
              className={`mirror-cell ${on ? 'mirror-cell--on' : ''} ${highlight.includes(String(c)) && !on ? 'mirror-cell--hint' : ''}`}
              onClick={() => onChange({ ...state, right: on ? state.right.filter((x) => x !== c) : [...state.right, c] })}
            />
          );
        })}
      </div>
    </div>
  );
}

export const mirror: Manipulative<MirrorState, MirrorConfig> = {
  kind: 'grid',
  init: (config) => ({ ...config, right: [] }),
  View,
  read: (state) => {
    if (state.right.length === 0) return null;
    if (same(state.right, mirrored(state))) return String(MIRRORED);
    return String(same(state.right, copied(state)) ? COPIED : OTHER);
  },
  showSolution: (config) => ({ ...config, right: mirrored(config) }),
  highlightOf: (state) => state.right.map(String),
  // one square tapped and tapped again, never one of this answer's
  demo: (config) => {
    const free = Array.from({ length: config.half * config.rows }, (_, i) => i).find((c) => !mirrored(config).includes(c)) ?? 0;
    return [{ ...config, right: [free] }, { ...config, right: [] }];
  },
  describe: () => t('mirror.label'),
};
