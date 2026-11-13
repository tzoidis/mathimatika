// Navigation icons. Navigation never uses text (PRD §6).

const common = { width: 40, height: 40, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const HomeIcon = () => (
  <svg {...common} aria-hidden>
    <path d="M3 11 12 3l9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const NextIcon = () => (
  <svg {...common} aria-hidden>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const LockIcon = () => (
  <svg {...common} width={28} height={28} aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const SpeakerIcon = () => (
  <svg {...common} aria-hidden>
    <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

/** «show me again»: a circling arrow */
export const ReplayIcon = () => (
  <svg {...common} aria-hidden>
    <path d="M4 12a8 8 0 1 0 2.5-5.8" />
    <path d="M4 4v4h4" />
  </svg>
);

export const BackspaceIcon = () => (
  <svg {...common} aria-hidden>
    <path d="M9 5h11v14H9l-6-7z" />
    <path d="m12 9 5 6M17 9l-5 6" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...common} aria-hidden>
    <path d="m5 12 5 5 9-10" />
  </svg>
);

/** The hammer of the Workshop. */
export const WorkshopIcon = () => (
  <svg {...common} aria-hidden>
    <path d="M14 7 5 16l3 3 9-9" />
    <path d="m12 5 3-2 6 6-2 3z" fill="currentColor" />
  </svg>
);

export const TurtleIcon = () => (
  <svg width="140" height="140" viewBox="0 0 200 200" aria-hidden>
    <ellipse cx="100" cy="112" rx="66" ry="46" fill="#6aa35f" stroke="#2a1c12" strokeWidth="5" />
    <path d="M60 110 H140 M100 68 V156" stroke="#2a1c12" strokeWidth="4" />
    <circle cx="176" cy="104" r="20" fill="#a9c98f" stroke="#2a1c12" strokeWidth="5" />
    <circle cx="183" cy="99" r="4" fill="#2a1c12" />
    <path d="M58 146 V170 M142 146 V170" stroke="#a9c98f" strokeWidth="18" strokeLinecap="round" />
  </svg>
);

export const HareIcon = () => (
  <svg width="140" height="140" viewBox="0 0 200 200" aria-hidden>
    <path d="M120 74 Q104 10 124 10 Q144 16 138 74 M146 76 Q150 14 170 18 Q184 28 160 82" fill="#d8c3a5" stroke="#2a1c12" strokeWidth="5" />
    <ellipse cx="86" cy="130" rx="62" ry="40" fill="#d8c3a5" stroke="#2a1c12" strokeWidth="5" />
    <circle cx="146" cy="96" r="30" fill="#d8c3a5" stroke="#2a1c12" strokeWidth="5" />
    <circle cx="156" cy="90" r="5" fill="#2a1c12" />
    <circle cx="24" cy="122" r="12" fill="#fff4dc" stroke="#2a1c12" strokeWidth="4" />
    <path d="M60 164 V184 M110 164 V184" stroke="#d8c3a5" strokeWidth="18" strokeLinecap="round" />
  </svg>
);

/** «Δεν ξέρω ακόμα»: a question mark in a speech bubble */
export const NotYetIcon = () => (
  <svg {...common} aria-hidden>
    <path d="M4 5h16v11H11l-4 4v-4H4z" />
    <path d="M10 9a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.6M12 14.2v.1" />
  </svg>
);

export const StarIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
      fill="var(--star)"
      stroke="var(--star-edge)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
