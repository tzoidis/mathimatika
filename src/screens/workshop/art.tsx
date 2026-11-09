// Our own drawings for the Workshop, in the mascot's style. Each is drawn in a 200 × 200
// box, so the same picture serves the choice tile and, moved and scaled, the scene.

import type { ReactNode } from 'react';

const WOOD = '#b98a5a';
const WOOD_DARK = '#7c5a3a';
const METAL = '#8a97a8';
const INK = '#2a1c12';
const RED = '#d96a5a';
const GREEN = '#6aa35f';
const GOLD = '#f6c443';
const BLUE = '#4f6a8a';
const CREAM = '#fff4dc';

export const ITEM_ART: Record<string, ReactNode> = {
  bench: (
    <>
      <rect x="10" y="70" width="180" height="26" rx="6" fill={WOOD} stroke={WOOD_DARK} strokeWidth="4" />
      <rect x="26" y="96" width="20" height="94" fill={WOOD_DARK} />
      <rect x="154" y="96" width="20" height="94" fill={WOOD_DARK} />
      <rect x="46" y="136" width="108" height="12" fill={WOOD} />
    </>
  ),
  lamp: (
    <>
      <rect x="96" y="0" width="8" height="90" fill={INK} />
      <path d="M50 150 L70 90 L130 90 L150 150 Z" fill={RED} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="158" r="16" fill={GOLD} stroke={INK} strokeWidth="4" />
    </>
  ),
  toolbox: (
    <>
      <path d="M72 70 V46 H128 V70" fill="none" stroke={INK} strokeWidth="8" />
      <rect x="20" y="70" width="160" height="100" rx="10" fill={RED} stroke={INK} strokeWidth="4" />
      <rect x="20" y="104" width="160" height="10" fill={INK} />
      <rect x="88" y="96" width="24" height="26" rx="4" fill={GOLD} stroke={INK} strokeWidth="4" />
    </>
  ),
  clock: (
    <>
      <circle cx="100" cy="100" r="82" fill={CREAM} stroke={WOOD_DARK} strokeWidth="12" />
      <path d="M100 100 V52" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M100 100 L134 118" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <circle cx="100" cy="100" r="9" fill={INK} />
    </>
  ),
  shelf: (
    <>
      <rect x="6" y="132" width="188" height="16" rx="4" fill={WOOD} stroke={WOOD_DARK} strokeWidth="4" />
      <path d="M36 148 V176 M164 148 V176" stroke={WOOD_DARK} strokeWidth="8" />
      <rect x="22" y="72" width="44" height="60" rx="8" fill="#cfe3ef" stroke={BLUE} strokeWidth="4" />
      <rect x="78" y="56" width="44" height="76" rx="8" fill={GOLD} stroke={WOOD_DARK} strokeWidth="4" />
      <rect x="134" y="82" width="44" height="50" rx="8" fill={GREEN} stroke={INK} strokeWidth="4" />
    </>
  ),
  scale: (
    <>
      <rect x="92" y="44" width="16" height="130" fill={METAL} stroke={INK} strokeWidth="3" />
      <rect x="20" y="40" width="160" height="10" rx="5" fill={INK} />
      <path d="M30 50 L12 106 H66 L46 50 M170 50 L134 106 H188 L170 50" fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M12 106 Q40 134 66 106 Z M134 106 Q160 134 188 106 Z" fill={GOLD} stroke={INK} strokeWidth="4" />
      <rect x="62" y="174" width="76" height="16" rx="6" fill={WOOD_DARK} />
    </>
  ),
  flowers: (
    <>
      <path d="M100 124 V60" stroke={GREEN} strokeWidth="8" />
      <path d="M100 100 Q70 84 62 106 Q84 116 100 100 Z" fill={GREEN} />
      <g fill={RED}>
        <circle cx="100" cy="28" r="20" />
        <circle cx="72" cy="50" r="20" />
        <circle cx="128" cy="50" r="20" />
        <circle cx="84" cy="78" r="20" />
        <circle cx="116" cy="78" r="20" />
      </g>
      <circle cx="100" cy="56" r="18" fill={GOLD} />
      <path d="M58 124 H142 L130 192 H70 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="4" strokeLinejoin="round" />
    </>
  ),
  stall: (
    <>
      <path d="M14 66 L34 16 H166 L186 66 Z" fill={BLUE} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M58 16 L50 66 M100 16 V66 M142 16 L150 66" stroke={CREAM} strokeWidth="10" />
      <path d="M28 66 V192 M172 66 V192" stroke={WOOD_DARK} strokeWidth="10" />
      <rect x="14" y="120" width="172" height="72" rx="6" fill={WOOD} stroke={WOOD_DARK} strokeWidth="4" />
    </>
  ),
  basket: (
    <>
      <path d="M36 100 Q100 10 164 100" fill="none" stroke={WOOD_DARK} strokeWidth="10" />
      <circle cx="68" cy="94" r="24" fill={RED} stroke={INK} strokeWidth="3" />
      <circle cx="104" cy="82" r="24" fill={RED} stroke={INK} strokeWidth="3" />
      <circle cx="136" cy="94" r="24" fill={GREEN} stroke={INK} strokeWidth="3" />
      <path d="M26 104 H174 L154 186 H46 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="4" strokeLinejoin="round" />
    </>
  ),
  cashbox: (
    <>
      <rect x="22" y="66" width="156" height="118" rx="10" fill={BLUE} stroke={INK} strokeWidth="4" />
      <rect x="60" y="84" width="80" height="12" rx="6" fill={INK} />
      <circle cx="100" cy="50" r="32" fill={GOLD} stroke={WOOD_DARK} strokeWidth="5" />
      <circle cx="100" cy="134" r="20" fill={CREAM} stroke={INK} strokeWidth="4" />
      <rect x="96" y="120" width="8" height="26" rx="4" fill={INK} />
    </>
  ),
  bird: (
    <>
      <path d="M36 160 H168" stroke={WOOD_DARK} strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="100" cy="104" rx="56" ry="44" fill={GOLD} stroke={INK} strokeWidth="4" />
      <circle cx="136" cy="74" r="30" fill={GOLD} stroke={INK} strokeWidth="4" />
      <circle cx="144" cy="68" r="6" fill={INK} />
      <path d="M164 72 L190 80 L164 88 Z" fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 94 Q88 80 102 118 Q68 126 60 94 Z" fill={BLUE} stroke={INK} strokeWidth="3" />
      <path d="M92 148 V160 M116 148 V160" stroke={INK} strokeWidth="6" />
    </>
  ),
  mill: (
    <>
      <path d="M62 192 L76 92 H124 L138 192 Z" fill={CREAM} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="88" y="150" width="24" height="42" rx="10" fill={WOOD_DARK} />
      <g stroke={WOOD_DARK} strokeWidth="14" strokeLinecap="round">
        <path d="M100 76 L100 12" />
        <path d="M100 76 L100 140" />
        <path d="M100 76 L36 76" />
        <path d="M100 76 L164 76" />
      </g>
      <circle cx="100" cy="76" r="12" fill={INK} />
    </>
  ),
};

/** Where each item sits in the 1000 × 620 scene, and how big. */
export const ITEM_PLACES: Record<string, { x: number; y: number; scale: number }> = {
  bench: { x: 40, y: 330, scale: 1.3 },
  toolbox: { x: 90, y: 300, scale: 0.72 },
  lamp: { x: 310, y: 0, scale: 0.85 },
  clock: { x: 60, y: 50, scale: 0.75 },
  shelf: { x: 500, y: 20, scale: 1.15 },
  scale: { x: 340, y: 420, scale: 0.85 },
  flowers: { x: 890, y: 450, scale: 0.65 },
  stall: { x: 680, y: 240, scale: 1.25 },
  basket: { x: 720, y: 440, scale: 0.75 },
  cashbox: { x: 820, y: 316, scale: 0.4 },
  bird: { x: 860, y: 40, scale: 0.6 },
  mill: { x: 530, y: 330, scale: 1 },
};

export function ItemPicture({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      {ITEM_ART[id]}
    </svg>
  );
}
