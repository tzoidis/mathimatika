// Drawings for ch. 41 «Ο χρόνος»: three pictures of each everyday story, the four
// seasons as one tree, what happens in each season, the calendar cards and the month.
// Each stage differs in shape, not only in colour (PRD §7).

import type { ReactNode } from 'react';
import { formatNumber } from '../../math-core/format.ts';
import type { Story } from '../../math-core/generators/time.ts';

const INK = '#2a1c12';

function Art({ children, size = 120 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className="time-picture" stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {children}
    </svg>
  );
}

const pot = <path d="M38 82 h44 l-6 30 h-32 z" fill="#c8794a" />;
const soil = <path d="M40 82 h40" />;

function flame(x: number, y: number) {
  return <path d={`M${x} ${y} q-7 -10 0 -20 q7 10 0 20 z`} fill="#f2b13c" />;
}

/** Stage 1, 2, 3 of each story. */
const STORY_ART: Record<Story, [ReactNode, ReactNode, ReactNode]> = {
  seed: [
    <>
      {pot}
      {soil}
      <ellipse cx="60" cy="76" rx="6" ry="4" fill="#8a5a2b" />
    </>,
    <>
      {pot}
      <path d="M60 82 v-22" fill="none" stroke="#3f8a3a" />
      <path d="M60 66 q-14 -4 -16 -14 q12 0 16 14 z" fill="#6fbf5a" />
    </>,
    <>
      {pot}
      <path d="M60 82 v-46" fill="none" stroke="#3f8a3a" />
      <path d="M60 66 q-16 -4 -18 -14 q14 0 18 14 z M60 60 q16 -4 18 -14 q-14 0 -18 14 z" fill="#6fbf5a" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="60" cy="22" rx="7" ry="12" fill="#e77fa6" transform={`rotate(${a} 60 32)`} />
      ))}
      <circle cx="60" cy="32" r="6" fill="#f2c94c" />
    </>,
  ],
  egg: [
    <>
      <path d="M22 96 q38 22 76 0" fill="#c9a26b" />
      <ellipse cx="60" cy="66" rx="22" ry="30" fill="#fbf3e4" />
    </>,
    <>
      <path d="M22 96 q38 22 76 0" fill="#c9a26b" />
      <ellipse cx="60" cy="66" rx="22" ry="30" fill="#fbf3e4" />
      <path d="M40 58 l8 6 l6 -8 l7 8 l6 -8 l7 8 l5 -6" fill="none" />
      <path d="M58 46 l8 4 l-8 4 z" fill="#f2a33c" />
    </>,
    <>
      <path d="M8 104 q14 -18 28 0 l-6 -6 l-6 6 l-6 -6 z" fill="#fbf3e4" />
      <path d="M84 104 q14 -18 28 0 l-6 -6 l-6 6 l-6 -6 z" fill="#fbf3e4" />
      <circle cx="60" cy="74" r="24" fill="#f6d84a" />
      <circle cx="60" cy="40" r="15" fill="#f6d84a" />
      <circle cx="55" cy="37" r="2" fill={INK} />
      <path d="M68 40 l9 3 l-9 4 z" fill="#f2a33c" />
    </>,
  ],
  snowman: [
    <>
      <path d="M6 106 h108" />
      <circle cx="60" cy="82" r="24" fill="#ffffff" />
    </>,
    <>
      <path d="M6 106 h108" />
      <circle cx="60" cy="82" r="24" fill="#ffffff" />
      <circle cx="60" cy="44" r="17" fill="#ffffff" />
    </>,
    <>
      <path d="M6 106 h108" />
      <circle cx="60" cy="82" r="24" fill="#ffffff" />
      <circle cx="60" cy="44" r="17" fill="#ffffff" />
      <path d="M44 28 h32 M50 28 v-18 h20 v18" fill="#3b3b4f" />
      <circle cx="54" cy="42" r="2" fill={INK} />
      <circle cx="66" cy="42" r="2" fill={INK} />
      <path d="M60 47 l14 3 l-14 3 z" fill="#f08a3a" />
      <circle cx="60" cy="74" r="2.5" fill={INK} />
      <circle cx="60" cy="86" r="2.5" fill={INK} />
    </>,
  ],
  glass: [
    <>
      <path d="M38 18 h44 l-6 92 h-32 z" fill="#ffffff" />
      <path d="M39.5 30 h41 l-5.2 78 h-30.6 z" fill="#f4a43a" stroke="none" />
    </>,
    <>
      <path d="M38 18 h44 l-6 92 h-32 z" fill="#ffffff" />
      <path d="M42.2 66 h35.6 l-2.5 42 h-30.6 z" fill="#f4a43a" stroke="none" />
    </>,
    <>
      <path d="M38 18 h44 l-6 92 h-32 z" fill="#ffffff" />
      <path d="M45 104 h30" stroke="#f4a43a" />
    </>,
  ],
  apple: [
    <>
      <path d="M60 34 q-30 -14 -34 20 q0 40 34 52 q34 -12 34 -52 q-4 -34 -34 -20 z" fill="#d9483b" />
      <path d="M60 34 q2 -14 10 -20" fill="none" />
      <path d="M64 24 q12 -10 20 -2 q-10 8 -20 2 z" fill="#6fbf5a" />
    </>,
    <>
      <path d="M60 34 q-30 -14 -34 20 q0 40 34 52 q34 -12 34 -52 q-4 -34 -34 -20 z" fill="#d9483b" />
      <circle cx="98" cy="62" r="16" fill="var(--card)" stroke="none" />
      <path d="M88 47 a17 17 0 0 0 0 30" fill="none" stroke="#fbf0cf" strokeWidth="7" />
      <path d="M91.5 48 a16 16 0 0 0 0 28" fill="none" />
      <path d="M60 34 q2 -14 10 -20" fill="none" />
    </>,
    <>
      <path d="M50 30 q14 6 20 0 q-8 18 -2 38 q6 22 -2 38 q-8 -4 -16 0 q-6 -18 0 -38 q6 -20 0 -38 z" fill="#fbf0cf" />
      <path d="M44 28 q16 8 32 0 l-2 -6 q-14 6 -28 0 z M44 108 q16 -8 32 0 l-2 6 q-14 -6 -28 0 z" fill="#d9483b" />
      <path d="M60 22 q2 -10 8 -14" fill="none" />
    </>,
  ],
  candle: [
    <>
      <path d="M30 110 h60" />
      <rect x="48" y="34" width="24" height="76" fill="#f3efe6" />
      {flame(60, 32)}
    </>,
    <>
      <path d="M30 110 h60" />
      <rect x="48" y="70" width="24" height="40" fill="#f3efe6" />
      <path d="M48 76 q-4 8 0 14" fill="#f3efe6" />
      {flame(60, 68)}
    </>,
    <>
      <path d="M30 110 h60" />
      <path d="M40 110 q4 -12 14 -12 h12 q10 0 14 12 z" fill="#f3efe6" />
      <path d="M60 98 v-8" />
      <path d="M58 82 q6 -6 2 -12 M64 78 q4 -4 1 -9" fill="none" stroke="#9a9a9a" />
    </>,
  ],
};

export function StoryPicture({ story, stage }: { story: Story; stage: number }) {
  return <Art size={150}>{STORY_ART[story][stage - 1]}</Art>;
}

/** 1 spring, 2 summer, 3 autumn, 4 winter: one tree through the year. */
const SEASON_ART: ReactNode[] = [
  <>
    <path d="M54 112 v-40 h12 v40" fill="#8a5a2b" />
    <circle cx="60" cy="48" r="32" fill="#a6d98a" />
    {[
      [44, 36],
      [70, 30],
      [78, 54],
      [50, 60],
      [62, 46],
    ].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#f4a6c4" />
    ))}
  </>,
  <>
    <circle cx="100" cy="18" r="11" fill="#f6c63d" />
    <path d="M54 112 v-40 h12 v40" fill="#8a5a2b" />
    <circle cx="60" cy="50" r="36" fill="#3f9a45" />
    <circle cx="48" cy="42" r="5" fill="#d9483b" />
    <circle cx="72" cy="58" r="5" fill="#d9483b" />
  </>,
  <>
    <path d="M54 112 v-40 h12 v40" fill="#8a5a2b" />
    <path d="M30 56 q-2 -30 30 -32 q32 2 30 32 q-6 16 -30 16 q-24 0 -30 -16 z" fill="#e8913a" />
    <path d="M18 92 l6 -4 l4 6 l-6 4 z M96 100 l6 -4 l4 6 l-6 4 z M84 84 l6 -4 l4 6 l-6 4 z" fill="#d36b2e" />
  </>,
  <>
    <path d="M6 108 q54 -10 108 0 v12 h-108 z" fill="#ffffff" />
    <path d="M56 110 v-46 l-16 -22 M60 70 l18 -24 M58 86 l-14 -10 M60 60 v-26" fill="none" stroke="#8a5a2b" strokeWidth="6" />
    {[
      [20, 20],
      [94, 30],
      [30, 60],
      [100, 70],
    ].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#bfe0f2" />
    ))}
  </>,
];

export function SeasonPicture({ season, size }: { season: number; size?: number }) {
  return <Art size={size}>{SEASON_ART[season - 1]}</Art>;
}

const school = (
  <>
    <path d="M24 108 v-48 l36 -26 l36 26 v48 z" fill="#f1dcb5" />
    <rect x="52" y="80" width="16" height="28" fill="#a86b3c" />
    <rect x="32" y="66" width="14" height="12" fill="#bfe0f2" />
    <rect x="74" y="66" width="14" height="12" fill="#bfe0f2" />
    <path d="M60 34 v-22 l14 5 l-14 5" fill="#4b8fd1" />
  </>
);

const EVENT_ART: Record<string, ReactNode> = {
  flowers: (
    <>
      {[30, 60, 90].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 112 v-50`} fill="none" stroke="#3f8a3a" />
          <path d={`M${x - 12} 46 l6 12 l6 -10 l6 10 l6 -12 v14 q-12 14 -24 0 z`} fill={['#e77fa6', '#f2c94c', '#d9483b'][i]} />
        </g>
      ))}
    </>
  ),
  sea: (
    <>
      <circle cx="96" cy="22" r="12" fill="#f6c63d" />
      <path d="M4 70 q14 -10 28 0 t28 0 t28 0 t28 0 v50 h-112 z" fill="#5aa9dd" />
      <circle cx="44" cy="54" r="14" fill="#ffffff" />
      <path d="M30 54 h28 M44 40 v28" stroke="#d9483b" />
    </>
  ),
  leaves: SEASON_ART[2],
  snow: (
    <>
      {[
        [30, 30],
        [80, 24],
        [56, 64],
        [24, 90],
        [94, 82],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x! - 12} ${y} h24 M${x} ${y! - 12} v24 M${x! - 8} ${y! - 8} l16 16 M${x! - 8} ${y! + 8} l16 -16`} stroke="#5aa9dd" />
      ))}
    </>
  ),
  easter: (
    <>
      <ellipse cx="44" cy="70" rx="22" ry="30" fill="#c8302a" />
      <ellipse cx="82" cy="78" rx="18" ry="24" fill="#c8302a" />
    </>
  ),
  mayday: (
    <>
      <circle cx="60" cy="60" r="34" fill="none" stroke="#3f8a3a" strokeWidth="8" />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <circle key={a} cx="60" cy="26" r="8" fill={['#e77fa6', '#f2c94c', '#d9483b', '#ffffff', '#b07fe7', '#f2c94c'][i]} transform={`rotate(${a} 60 60)`} />
      ))}
    </>
  ),
  'school-closes': (
    <>
      {school}
      <circle cx="102" cy="18" r="11" fill="#f6c63d" />
      <path d="M50 92 l20 0 M50 86 l20 12" stroke="#d9483b" />
    </>
  ),
  'school-opens': (
    <>
      <rect x="28" y="40" width="64" height="66" rx="10" fill="#4b8fd1" />
      <path d="M44 40 v-10 q16 -12 32 0 v10" fill="none" />
      <rect x="38" y="62" width="44" height="22" rx="4" fill="#f6c63d" />
      <path d="M14 30 l6 -4 l4 6 l-6 4 z M100 54 l6 -4 l4 6 l-6 4 z" fill="#d36b2e" />
    </>
  ),
  christmas: (
    <>
      <path d="M60 14 l30 44 h-12 l20 30 h-76 l20 -30 h-12 z" fill="#2f7d3a" />
      <rect x="52" y="88" width="16" height="20" fill="#8a5a2b" />
      <path d="M60 4 l3 7 h7 l-5 5 l2 7 l-7 -4 l-7 4 l2 -7 l-5 -5 h7 z" fill="#f6c63d" />
      <circle cx="48" cy="56" r="4" fill="#d9483b" />
      <circle cx="70" cy="70" r="4" fill="#d9483b" />
      <circle cx="56" cy="80" r="4" fill="#f6c63d" />
    </>
  ),
};

export function EventPicture({ event }: { event: string }) {
  return <Art size={160}>{EVENT_ART[event]}</Art>;
}

/** The calendar cards from the furthest asked day to the other side of today. */
export function DateCards({ today, offset, slot }: { today: number; offset: number; slot: ReactNode }) {
  const from = Math.min(offset, -1);
  const to = Math.max(offset, 1);
  return (
    <div className="date-cards">
      {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((d) => (
        <div key={d} className={`date-card ${d === 0 ? 'date-card--today' : ''}`}>
          {d === 0 && <span className="week-sun" aria-hidden />}
          <span className="date-number">{d === 0 ? formatNumber(today) : d === offset ? slot : ''}</span>
        </div>
      ))}
    </div>
  );
}

/** The month as a wall calendar, Monday first, with the asked date ringed. */
export function MonthGrid({ first, length, date }: { first: number; length: number; date: number }) {
  const cells = [...Array<null>(first - 1).fill(null), ...Array.from({ length }, (_, i) => i + 1)];
  return (
    <div className="month" aria-hidden>
      {cells.map((n, i) => (
        <span key={i} className={`month-cell month-cell--${(i % 7) + 1} ${n === null ? 'month-cell--empty' : ''} ${n === date ? 'month-cell--asked' : ''}`}>
          {n === null ? '' : formatNumber(n)}
        </span>
      ))}
    </div>
  );
}
