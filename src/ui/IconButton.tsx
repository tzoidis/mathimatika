import type { ReactNode } from 'react';

export function IconButton({
  label,
  onClick,
  children,
  variant = 'plain',
}: {
  /** accessible name only; never shown */
  label: string;
  onClick(): void;
  children: ReactNode;
  /** soft: a rounded square, for a button that must not be mistaken for its round neighbours */
  variant?: 'plain' | 'primary' | 'soft';
}) {
  return (
    <button type="button" className={`icon-button icon-button--${variant}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
