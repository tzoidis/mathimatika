// Our drawings of the lexicon's objects, for word problems: simple, countable, and the
// same size, so that size never tells the answer.

import type { ReactNode } from 'react';

const ART: Record<string, ReactNode> = {
  apple: (
    <>
      <path d="M32 18 C14 10 6 30 12 44 C16 54 26 58 32 54 C38 58 48 54 52 44 C58 30 50 10 32 18 Z" fill="#d96a5a" stroke="#2a1c12" strokeWidth="3" />
      <path d="M32 18 V8" stroke="#7c5a3a" strokeWidth="4" strokeLinecap="round" />
      <path d="M33 12 Q44 4 48 12 Q40 16 33 12 Z" fill="#6aa35f" />
    </>
  ),
  balloon: (
    <>
      <ellipse cx="32" cy="24" rx="18" ry="21" fill="#4f6a8a" stroke="#2a1c12" strokeWidth="3" />
      <path d="M32 45 L28 50 H36 Z" fill="#4f6a8a" />
      <path d="M32 50 Q26 56 32 62" fill="none" stroke="#2a1c12" strokeWidth="2" />
    </>
  ),
  flower: (
    <>
      <path d="M32 60 V32" stroke="#6aa35f" strokeWidth="4" />
      <g fill="#d96a5a">
        <circle cx="32" cy="12" r="9" />
        <circle cx="20" cy="22" r="9" />
        <circle cx="44" cy="22" r="9" />
        <circle cx="25" cy="34" r="9" />
        <circle cx="39" cy="34" r="9" />
      </g>
      <circle cx="32" cy="24" r="7" fill="#f6c443" />
    </>
  ),
  pencil: (
    <>
      <rect x="26" y="6" width="12" height="40" fill="#f6c443" stroke="#2a1c12" strokeWidth="3" />
      <path d="M26 46 L32 60 L38 46 Z" fill="#e9c9a0" stroke="#2a1c12" strokeWidth="3" strokeLinejoin="round" />
      <rect x="26" y="4" width="12" height="7" fill="#d96a5a" stroke="#2a1c12" strokeWidth="3" />
    </>
  ),
  car: (
    <>
      <path d="M8 40 V32 L18 20 H44 L54 32 V40 Z" fill="#d96a5a" stroke="#2a1c12" strokeWidth="3" strokeLinejoin="round" />
      <rect x="22" y="24" width="18" height="8" fill="#cfe3ef" />
      <circle cx="20" cy="44" r="7" fill="#2a1c12" />
      <circle cx="44" cy="44" r="7" fill="#2a1c12" />
    </>
  ),
  cookie: (
    <>
      <circle cx="32" cy="32" r="24" fill="#d8a96a" stroke="#7c5a3a" strokeWidth="3" />
      <circle cx="32" cy="32" r="8" fill="#fdf8ee" stroke="#7c5a3a" strokeWidth="3" />
    </>
  ),
  bird: (
    <>
      <ellipse cx="30" cy="36" rx="20" ry="15" fill="#f6c443" stroke="#2a1c12" strokeWidth="3" />
      <circle cx="44" cy="24" r="11" fill="#f6c443" stroke="#2a1c12" strokeWidth="3" />
      <circle cx="47" cy="22" r="2.5" fill="#2a1c12" />
      <path d="M54 24 L62 27 L54 30 Z" fill="#d96a5a" />
    </>
  ),
  duck: (
    <>
      <path d="M8 36 Q8 54 32 54 Q54 54 54 38 Q42 42 36 36 Z" fill="#fff4dc" stroke="#2a1c12" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="42" cy="24" r="11" fill="#fff4dc" stroke="#2a1c12" strokeWidth="3" />
      <circle cx="45" cy="22" r="2.5" fill="#2a1c12" />
      <path d="M52 24 H62 L54 30 Z" fill="#f6c443" stroke="#2a1c12" strokeWidth="2" />
    </>
  ),
  kitten: (
    <>
      <path d="M14 22 L18 8 L26 18 H38 L46 8 L50 22 Z" fill="#b98a5a" stroke="#2a1c12" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="32" cy="36" rx="20" ry="18" fill="#b98a5a" stroke="#2a1c12" strokeWidth="3" />
      <circle cx="25" cy="33" r="2.5" fill="#2a1c12" />
      <circle cx="39" cy="33" r="2.5" fill="#2a1c12" />
      <path d="M29 41 Q32 44 35 41" fill="none" stroke="#2a1c12" strokeWidth="2" />
    </>
  ),
};

export const OBJECT_IDS = Object.keys(ART);

/** `faded`: the ones that leave, or that are still missing, drawn in outline. */
export function ObjectPicture({ id, faded = false }: { id: string; faded?: boolean }) {
  return (
    <svg className={`object-picture ${faded ? 'object-picture--faded' : ''}`} width="56" height="56" viewBox="0 0 64 64" aria-hidden>
      {ART[id]}
    </svg>
  );
}
