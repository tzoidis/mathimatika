// The Workshop's other rooms, for the rest of the year: the yard, the harbour and the
// observatory. The same 200 × 200 drawings as art.tsx, our own, in the mascot's style.

import type { ReactNode } from 'react';

const WOOD = '#b98a5a';
const WOOD_DARK = '#7c5a3a';
const METAL = '#8a97a8';
const INK = '#2a1c12';
const RED = '#d96a5a';
const GREEN = '#6aa35f';
const GOLD = '#f6c443';
const BLUE = '#4f6a8a';
const SKY = '#cfe3ef';
const CREAM = '#fff4dc';
const SAND = '#e9c98f';
const NAVY = '#26324a';

export const ROOM_ART: Record<string, ReactNode> = {
  // ---------- the yard ----------
  tree: (
    <>
      <rect x="88" y="110" width="24" height="86" fill={WOOD_DARK} />
      <circle cx="100" cy="74" r="62" fill={GREEN} stroke={INK} strokeWidth="4" />
      <circle cx="74" cy="70" r="9" fill={RED} />
      <circle cx="122" cy="52" r="9" fill={RED} />
      <circle cx="116" cy="96" r="9" fill={RED} />
    </>
  ),
  swing: (
    <>
      <path d="M24 196 L52 16 H148 L176 196" fill="none" stroke={WOOD_DARK} strokeWidth="12" strokeLinejoin="round" />
      <path d="M78 18 V140 M122 18 V140" stroke={INK} strokeWidth="4" />
      <rect x="66" y="138" width="68" height="14" rx="5" fill={RED} stroke={INK} strokeWidth="3" />
    </>
  ),
  fountain: (
    <>
      <path d="M100 120 Q70 60 50 110 M100 120 Q130 60 150 110 M100 120 V40" fill="none" stroke="#7fb2d9" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="100" cy="150" rx="84" ry="26" fill={SKY} stroke={METAL} strokeWidth="8" />
      <rect x="84" y="112" width="32" height="40" fill={METAL} />
      <rect x="40" y="160" width="120" height="30" rx="10" fill={METAL} stroke={INK} strokeWidth="3" />
    </>
  ),
  doghouse: (
    <>
      <path d="M20 86 L100 20 L180 86 Z" fill={RED} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="36" y="86" width="128" height="104" fill={WOOD} stroke={WOOD_DARK} strokeWidth="4" />
      <path d="M76 190 V136 Q100 108 124 136 V190 Z" fill={INK} />
    </>
  ),
  bike: (
    <>
      <circle cx="50" cy="140" r="36" fill="none" stroke={INK} strokeWidth="8" />
      <circle cx="150" cy="140" r="36" fill="none" stroke={INK} strokeWidth="8" />
      <path d="M50 140 L86 82 H136 L150 140 M86 82 L100 140 L136 82 M80 70 H104 M136 82 L130 58 H150" fill="none" stroke={BLUE} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  kite: (
    <>
      <path d="M100 10 L156 70 L100 140 L44 70 Z" fill={GOLD} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M100 10 V140 M44 70 H156" stroke={RED} strokeWidth="4" />
      <path d="M100 140 Q80 160 104 172 Q128 184 100 198" fill="none" stroke={INK} strokeWidth="3" />
    </>
  ),
  sandbox: (
    <>
      <rect x="10" y="120" width="180" height="62" rx="6" fill={SAND} stroke={WOOD_DARK} strokeWidth="8" />
      <path d="M60 120 Q76 92 92 120 Z" fill={SAND} stroke={WOOD_DARK} strokeWidth="3" />
      <path d="M128 132 L150 96 L162 104 L140 140 Z" fill={RED} stroke={INK} strokeWidth="3" />
    </>
  ),
  sunflower: (
    <>
      <path d="M100 196 V90" stroke={GREEN} strokeWidth="10" />
      <path d="M100 150 Q70 130 60 152 Q84 162 100 150 Z" fill={GREEN} />
      <g fill={GOLD} stroke={WOOD_DARK} strokeWidth="2">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="100" cy="30" rx="11" ry="24" transform={`rotate(${i * 30} 100 62)`} />
        ))}
      </g>
      <circle cx="100" cy="62" r="24" fill={WOOD_DARK} />
    </>
  ),
  butterfly: (
    <>
      <path d="M100 100 Q40 20 26 70 Q20 110 100 100 Q40 130 54 170 Q86 186 100 100" fill="#a77bc4" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M100 100 Q160 20 174 70 Q180 110 100 100 Q160 130 146 170 Q114 186 100 100" fill="#a77bc4" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="100" cy="104" rx="8" ry="44" fill={INK} />
      <path d="M96 62 Q86 40 76 36 M104 62 Q114 40 124 36" fill="none" stroke={INK} strokeWidth="3" />
    </>
  ),
  mailbox: (
    <>
      <rect x="92" y="110" width="16" height="86" fill={WOOD_DARK} />
      <path d="M40 112 V66 Q40 36 80 36 H160 V112 Z" fill={BLUE} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M144 36 V10 H172 V24 H144" fill={RED} stroke={INK} strokeWidth="3" />
      <rect x="60" y="70" width="60" height="10" rx="5" fill={INK} />
    </>
  ),

  // ---------- the harbour ----------
  boat: (
    <>
      <path d="M14 110 H186 L160 168 H40 Z" fill={RED} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="70" y="70" width="60" height="40" fill={CREAM} stroke={INK} strokeWidth="4" />
      <circle cx="100" cy="90" r="9" fill={SKY} stroke={INK} strokeWidth="3" />
      <path d="M10 180 Q40 166 70 180 T130 180 T190 180" fill="none" stroke="#7fb2d9" strokeWidth="6" />
    </>
  ),
  lighthouse: (
    <>
      <path d="M66 196 L80 60 H120 L134 196 Z" fill={CREAM} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M72 140 H128 M76 100 H124" stroke={RED} strokeWidth="18" />
      <rect x="76" y="34" width="48" height="26" fill={GOLD} stroke={INK} strokeWidth="4" />
      <path d="M70 34 L100 8 L130 34 Z" fill={RED} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </>
  ),
  gull: (
    <>
      <path d="M20 90 Q60 50 100 96 Q140 50 180 90" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="100" cy="104" rx="22" ry="14" fill={CREAM} stroke={INK} strokeWidth="4" />
      <path d="M120 100 L136 104 L120 108 Z" fill={GOLD} />
    </>
  ),
  anchor: (
    <>
      <circle cx="100" cy="32" r="18" fill="none" stroke={METAL} strokeWidth="10" />
      <path d="M100 50 V180 M60 80 H140 M30 130 Q40 186 100 180 Q160 186 170 130" fill="none" stroke={METAL} strokeWidth="12" strokeLinecap="round" />
    </>
  ),
  crates: (
    <>
      <rect x="16" y="100" width="88" height="88" fill={WOOD} stroke={WOOD_DARK} strokeWidth="5" />
      <rect x="104" y="100" width="88" height="88" fill={WOOD} stroke={WOOD_DARK} strokeWidth="5" />
      <rect x="58" y="14" width="88" height="86" fill={WOOD} stroke={WOOD_DARK} strokeWidth="5" />
      <path d="M16 100 L104 188 M104 100 L192 188 M58 14 L146 100" stroke={WOOD_DARK} strokeWidth="5" />
    </>
  ),
  fish: (
    <>
      <path d="M30 100 Q90 40 150 100 Q90 160 30 100 Z" fill={GOLD} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M150 100 L190 70 V130 Z" fill={GOLD} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="62" cy="92" r="7" fill={INK} />
      <path d="M96 76 Q110 100 96 124" fill="none" stroke={RED} strokeWidth="4" />
    </>
  ),
  crab: (
    <>
      <ellipse cx="100" cy="120" rx="58" ry="40" fill={RED} stroke={INK} strokeWidth="4" />
      <path d="M50 110 Q20 80 34 54 M150 110 Q180 80 166 54" fill="none" stroke={INK} strokeWidth="6" />
      <path d="M24 56 Q34 30 50 52 Z M176 56 Q166 30 150 52 Z" fill={RED} stroke={INK} strokeWidth="4" />
      <path d="M58 150 L36 178 M80 158 L68 188 M142 150 L164 178 M120 158 L132 188" stroke={INK} strokeWidth="5" />
      <circle cx="86" cy="106" r="7" fill={INK} />
      <circle cx="114" cy="106" r="7" fill={INK} />
    </>
  ),
  sailboat: (
    <>
      <path d="M96 20 V140" stroke={WOOD_DARK} strokeWidth="6" />
      <path d="M100 24 L170 132 H100 Z" fill={CREAM} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M92 40 L40 132 H92 Z" fill={SKY} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 144 H176 L156 180 H44 Z" fill={BLUE} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </>
  ),
  buoy: (
    <>
      <path d="M100 16 V52" stroke={INK} strokeWidth="6" />
      <circle cx="100" cy="14" r="10" fill={GOLD} stroke={INK} strokeWidth="3" />
      <path d="M50 160 L70 52 H130 L150 160 Z" fill={RED} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M62 112 H138" stroke={CREAM} strokeWidth="16" />
      <path d="M14 172 Q44 158 74 172 T134 172 T194 172" fill="none" stroke="#7fb2d9" strokeWidth="6" />
    </>
  ),
  net: (
    <>
      <path d="M20 40 H180 L150 180 H50 Z" fill="none" stroke={WOOD_DARK} strokeWidth="6" strokeLinejoin="round" />
      <g stroke={WOOD} strokeWidth="3">
        {[60, 100, 140].map((y) => (
          <path key={y} d={`M${20 + (y - 40) * 0.21} ${y} H${180 - (y - 40) * 0.21}`} />
        ))}
        {[60, 100, 140].map((x) => (
          <path key={x} d={`M${x} 40 L${100 + (x - 100) * 0.62} 180`} />
        ))}
      </g>
      <circle cx="40" cy="40" r="10" fill={GOLD} />
      <circle cx="160" cy="40" r="10" fill={GOLD} />
    </>
  ),

  // ---------- the observatory ----------
  telescope: (
    <>
      <path d="M100 120 L60 196 M100 120 L140 196 M100 120 V196" stroke={WOOD_DARK} strokeWidth="8" strokeLinecap="round" />
      <rect x="40" y="70" width="130" height="36" rx="10" fill={BLUE} stroke={INK} strokeWidth="4" transform="rotate(-25 100 100)" />
      <rect x="150" y="54" width="30" height="48" rx="6" fill={GOLD} stroke={INK} strokeWidth="4" transform="rotate(-25 100 100)" />
    </>
  ),
  moon: (
    <>
      <path d="M126 20 A80 80 0 1 0 170 150 A64 64 0 1 1 126 20 Z" fill={GOLD} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="80" cy="110" r="10" fill="#e5b23a" />
      <circle cx="100" cy="150" r="7" fill="#e5b23a" />
    </>
  ),
  planet: (
    <>
      <circle cx="100" cy="100" r="54" fill={RED} stroke={INK} strokeWidth="4" />
      <ellipse cx="100" cy="100" rx="94" ry="24" fill="none" stroke={GOLD} strokeWidth="10" transform="rotate(-18 100 100)" />
      <path d="M62 84 Q100 70 138 84" fill="none" stroke={CREAM} strokeWidth="5" />
    </>
  ),
  rocket: (
    <>
      <path d="M100 10 Q144 50 140 140 H60 Q56 50 100 10 Z" fill={CREAM} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="76" r="18" fill={SKY} stroke={INK} strokeWidth="4" />
      <path d="M60 110 L30 160 H62 Z M140 110 L170 160 H138 Z" fill={RED} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M78 140 Q100 196 122 140 Z" fill={GOLD} stroke={RED} strokeWidth="4" />
    </>
  ),
  comet: (
    <>
      <path d="M150 50 L20 150 L60 170 Z" fill="#7fb2d9" opacity="0.7" />
      <path d="M150 50 L40 120 L50 140 Z" fill={SKY} />
      <circle cx="150" cy="50" r="28" fill={GOLD} stroke={INK} strokeWidth="4" />
    </>
  ),
  globe: (
    <>
      <path d="M100 160 V186 M60 190 H140" stroke={WOOD_DARK} strokeWidth="10" strokeLinecap="round" />
      <path d="M34 90 A66 66 0 0 0 166 90" fill="none" stroke={METAL} strokeWidth="6" />
      <circle cx="100" cy="86" r="62" fill="#7fb2d9" stroke={INK} strokeWidth="4" />
      <path d="M70 50 Q90 40 96 64 Q80 80 66 70 Z M110 96 Q140 90 136 120 Q118 134 108 116 Z" fill={GREEN} />
    </>
  ),
  owl: (
    <>
      <path d="M40 60 L54 24 L76 46 H124 L146 24 L160 60 V150 Q100 200 40 150 Z" fill={WOOD} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="76" cy="84" r="24" fill={CREAM} stroke={INK} strokeWidth="4" />
      <circle cx="124" cy="84" r="24" fill={CREAM} stroke={INK} strokeWidth="4" />
      <circle cx="76" cy="84" r="9" fill={INK} />
      <circle cx="124" cy="84" r="9" fill={INK} />
      <path d="M92 110 L100 124 L108 110 Z" fill={GOLD} />
      <path d="M70 150 Q100 136 130 150" fill="none" stroke={WOOD_DARK} strokeWidth="5" />
    </>
  ),
  lantern: (
    <>
      <path d="M80 30 Q100 6 120 30" fill="none" stroke={INK} strokeWidth="6" />
      <rect x="64" y="30" width="72" height="18" rx="4" fill={NAVY} />
      <rect x="70" y="48" width="60" height="100" rx="8" fill={GOLD} stroke={NAVY} strokeWidth="6" />
      <path d="M100 116 Q86 100 100 76 Q114 100 100 116 Z" fill={RED} />
      <rect x="60" y="148" width="80" height="18" rx="4" fill={NAVY} />
    </>
  ),
  starmap: (
    <>
      <rect x="20" y="24" width="160" height="152" rx="8" fill={NAVY} stroke={WOOD_DARK} strokeWidth="6" />
      <path d="M50 60 L90 80 L120 56 L150 96 M70 140 L110 120 L150 140" fill="none" stroke={SKY} strokeWidth="3" />
      <g fill={GOLD}>
        {[[50, 60], [90, 80], [120, 56], [150, 96], [70, 140], [110, 120], [150, 140]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />
        ))}
      </g>
    </>
  ),
  binoculars: (
    <>
      <rect x="20" y="70" width="64" height="100" rx="24" fill={NAVY} stroke={INK} strokeWidth="4" />
      <rect x="116" y="70" width="64" height="100" rx="24" fill={NAVY} stroke={INK} strokeWidth="4" />
      <rect x="80" y="96" width="40" height="30" fill={METAL} stroke={INK} strokeWidth="4" />
      <circle cx="52" cy="146" r="18" fill={SKY} />
      <circle cx="148" cy="146" r="18" fill={SKY} />
    </>
  ),
};

/** Where each item sits in its room's 1000 × 620 scene. */
export const ROOM_PLACES: Record<string, { x: number; y: number; scale: number }> = {
  tree: { x: 40, y: 140, scale: 1.5 },
  swing: { x: 330, y: 250, scale: 0.95 },
  fountain: { x: 560, y: 300, scale: 1 },
  doghouse: { x: 790, y: 290, scale: 0.8 },
  bike: { x: 300, y: 450, scale: 0.75 },
  kite: { x: 600, y: 20, scale: 0.7 },
  sandbox: { x: 470, y: 470, scale: 0.75 },
  sunflower: { x: 900, y: 420, scale: 0.6 },
  butterfly: { x: 420, y: 80, scale: 0.4 },
  mailbox: { x: 20, y: 450, scale: 0.6 },

  boat: { x: 40, y: 400, scale: 1 },
  lighthouse: { x: 820, y: 100, scale: 1.3 },
  gull: { x: 300, y: 40, scale: 0.6 },
  anchor: { x: 600, y: 440, scale: 0.6 },
  crates: { x: 640, y: 260, scale: 0.8 },
  fish: { x: 300, y: 500, scale: 0.45 },
  crab: { x: 470, y: 520, scale: 0.4 },
  sailboat: { x: 250, y: 230, scale: 0.9 },
  buoy: { x: 480, y: 360, scale: 0.55 },
  net: { x: 840, y: 440, scale: 0.65 },

  telescope: { x: 60, y: 280, scale: 1.2 },
  moon: { x: 780, y: 30, scale: 0.85 },
  planet: { x: 480, y: 40, scale: 0.75 },
  rocket: { x: 830, y: 300, scale: 1 },
  comet: { x: 250, y: 30, scale: 0.7 },
  globe: { x: 470, y: 330, scale: 0.85 },
  owl: { x: 330, y: 270, scale: 0.6 },
  lantern: { x: 650, y: 420, scale: 0.6 },
  starmap: { x: 620, y: 150, scale: 0.6 },
  binoculars: { x: 300, y: 470, scale: 0.55 },
};

/** Each room's walls and floor. */
export const ROOM_SCENES: Record<string, ReactNode> = {
  workshop: (
    <>
      <rect width="1000" height="430" fill="#fbe9c9" />
      <rect y="430" width="1000" height="190" fill="#e0c8a0" />
      <rect y="424" width="1000" height="10" fill="#b98a5a" />
    </>
  ),
  yard: (
    <>
      <rect width="1000" height="440" fill={SKY} />
      <circle cx="920" cy="70" r="44" fill={GOLD} />
      <rect y="440" width="1000" height="180" fill="#a9d18e" />
      <path d="M0 440 H1000" stroke={GREEN} strokeWidth="8" />
    </>
  ),
  harbour: (
    <>
      <rect width="1000" height="400" fill={SKY} />
      <rect y="400" width="620" height="220" fill="#7fb2d9" />
      <rect x="620" y="400" width="380" height="220" fill={SAND} />
      <path d="M0 400 H620" stroke="#5b93c0" strokeWidth="6" />
    </>
  ),
  sky: (
    <>
      <rect width="1000" height="460" fill={NAVY} />
      <g fill={CREAM}>
        {[[90, 60], [200, 160], [380, 90], [560, 200], [700, 70], [930, 230], [140, 300], [640, 300]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />
        ))}
      </g>
      <rect y="460" width="1000" height="160" fill="#4a3f5c" />
    </>
  ),
};
