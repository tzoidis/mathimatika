// Rods and cubes (PRD §5): a rod is ten cubes tied together. In `build` the child adds
// and takes away rods and cubes with four buttons; in `regroup` there are too many loose
// cubes, and «tie» turns ten of them into a rod. Taps only, every button 96px.

import type { ReactNode } from 'react';
import { t } from '../i18n.ts';
import { formatNumber } from '../math-core/format.ts';
import type { Manipulative, ManipulativeViewProps } from './types.ts';

export type RodsMode = 'build' | 'regroup';

export interface RodsConfig {
  mode: RodsMode;
  /** the number to make */
  target: number;
  /** what is on the table at the start: nothing in build, too many cubes in regroup */
  tens: number;
  units: number;
}

export interface RodsState {
  mode: RodsMode;
  tens: number;
  units: number;
}

export const MAX_RODS = 5;
export const MAX_CUBES = 29;
const TEN = 10;

const valueOf = (s: { tens: number; units: number }) => s.tens * TEN + s.units;

/** Rods first, then the cubes in rows of five; dashed ones are where the answer would go. */
export function RodsPicture({ tens, units, ghostTens = 0, ghostUnits = 0, cubesFirst = false }: { tens: number; units: number; ghostTens?: number; ghostUnits?: number; cubesFirst?: boolean }) {
  const rods = (
    <div className="rods">
      {Array.from({ length: tens + ghostTens }, (_, i) => (
        <span key={i} className={`rod ${i >= tens ? 'rod--ghost' : ''}`}>
          {Array.from({ length: TEN }, (_, k) => (
            <span key={k} className="rod-cube" />
          ))}
        </span>
      ))}
    </div>
  );
  const cubes = (
    <div className="cubes">
      {Array.from({ length: units + ghostUnits }, (_, i) => (
        <span key={i} className={`cube ${i >= units ? 'cube--ghost' : ''}`} />
      ))}
    </div>
  );
  return (
    <div className="rods-picture" role="img" aria-label={t('manipulative.rods', { tens: formatNumber(tens), units: formatNumber(units) })}>
      {cubesFirst ? cubes : rods}
      {cubesFirst ? rods : cubes}
    </div>
  );
}

/** The book's table of tens and units, filled in as the child works. */
export function PlaceTable({ tens, units }: { tens: number; units: number }) {
  return (
    <table className="place-table">
      <thead>
        <tr>
          <th>{t('place.tens')}</th>
          <th>{t('place.units')}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{formatNumber(tens)}</td>
          <td>{formatNumber(units)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Step({ label, sign, disabled, onClick, children }: { label: string; sign: string; disabled: boolean; onClick(): void; children: ReactNode }) {
  return (
    <button type="button" className="rods-button" aria-label={label} disabled={disabled} onClick={onClick}>
      <span className="rods-button-sign">{sign}</span>
      {children}
    </button>
  );
}

function View({ state, onChange, readOnly, highlight = [] }: ManipulativeViewProps<RodsState>) {
  const [wantTens, wantUnits] = highlight.length === 2 ? highlight.map(Number) : [0, 0];
  const set = (tens: number, units: number) => onChange({ ...state, tens, units });
  return (
    <div className="rods-wrap">
      <RodsPicture tens={state.tens} units={state.units} ghostTens={Math.max(0, wantTens! - state.tens)} ghostUnits={Math.max(0, wantUnits! - state.units)} />
      <PlaceTable tens={state.tens} units={state.units} />
      {!readOnly && state.mode === 'build' && (
        <div className="rods-controls">
          <Step label={t('manipulative.rods.removeRod')} sign="−" disabled={state.tens === 0} onClick={() => set(state.tens - 1, state.units)}>
            <span className="rod rod--icon" />
          </Step>
          <Step label={t('manipulative.rods.addRod')} sign="+" disabled={state.tens >= MAX_RODS} onClick={() => set(state.tens + 1, state.units)}>
            <span className="rod rod--icon" />
          </Step>
          <Step label={t('manipulative.rods.removeCube')} sign="−" disabled={state.units === 0} onClick={() => set(state.tens, state.units - 1)}>
            <span className="cube" />
          </Step>
          <Step label={t('manipulative.rods.addCube')} sign="+" disabled={state.units >= MAX_CUBES} onClick={() => set(state.tens, state.units + 1)}>
            <span className="cube" />
          </Step>
        </div>
      )}
      {!readOnly && state.mode === 'regroup' && (
        <div className="rods-controls">
          <Step label={t('manipulative.rods.tie')} sign="" disabled={state.units < TEN} onClick={() => set(state.tens + 1, state.units - TEN)}>
            <span className="tie-icon" aria-hidden>
              <span className="cube" />
              <span className="tie-arrow">→</span>
              <span className="rod rod--icon" />
            </span>
          </Step>
        </div>
      )}
    </div>
  );
}

/**
 * In regroup, cubes left untied read as the child would write the table, a rod and
 * fourteen cubes as «114»: never the right number, and the detector names it.
 */
export function readRods(state: RodsState): string | null {
  if (state.mode === 'build') return valueOf(state) === 0 ? null : String(valueOf(state));
  return String(state.units >= TEN ? state.tens * 100 + state.units : valueOf(state));
}

/** A different number from the question's, so the demo never shows its answer. */
function demoSteps(config: RodsConfig): { tens: number; units: number }[] {
  if (config.mode === 'build') {
    const rods = config.target <= 11 ? 2 : 1;
    return [
      { tens: rods, units: 0 },
      { tens: rods, units: 1 },
    ];
  }
  const units = config.tens === 1 && config.units === 11 ? 12 : 11;
  return [
    { tens: 1, units },
    { tens: 2, units: units - TEN },
  ];
}

export const rods: Manipulative<RodsState, RodsConfig> = {
  kind: 'dienes',
  init: ({ mode, tens, units }) => ({ mode, tens, units }),
  View,
  read: readRods,
  showSolution: ({ mode, target }) => ({ mode, tens: Math.floor(target / TEN), units: target % TEN }),
  highlightOf: (state) => [String(state.tens), String(state.units)],
  demo: (config) => demoSteps(config).map((s) => ({ mode: config.mode, ...s })),
  describe: (state) => t('manipulative.rods', { tens: formatNumber(state.tens), units: formatNumber(state.units) }),
};
