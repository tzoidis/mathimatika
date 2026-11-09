// Our own digits: no <input> for numbers, so the system keyboard never opens (PRD §9).
// ΜΘ3 grows this into the children's keypad (comma, fractions, units).

import { t } from '../i18n.ts';
import { BackspaceIcon, CheckIcon } from './Icons.tsx';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function NumPad({ onDigit, onDelete, onOk }: { onDigit(d: string): void; onDelete(): void; onOk(): void }) {
  const digit = (d: string) => (
    <button key={d} type="button" className="numpad-key" onClick={() => onDigit(d)}>
      {d}
    </button>
  );
  return (
    <div className="numpad">
      {DIGITS.map(digit)}
      <button type="button" className="numpad-key" aria-label={t('numpad.delete')} onClick={onDelete}>
        <BackspaceIcon />
      </button>
      {digit('0')}
      <button type="button" className="numpad-key numpad-key--ok" aria-label={t('numpad.ok')} onClick={onOk}>
        <CheckIcon />
      </button>
    </div>
  );
}
