// Shapes drawn for the geometry questions: any shape at any turn and size, and the six
// things patterns are made of. Each of those differs in shape as well as colour, so
// colour never carries the meaning alone (PRD §7).

import type { Shape } from '../../math-core/generators/geometry.ts';

const INK = '#2a1c12';

function outline(shape: Shape) {
  switch (shape.kind) {
    case 'circle':
      return <circle cx="50" cy="50" r="38" />;
    case 'square':
      return <rect x="18" y="18" width="64" height="64" />;
    case 'rectangle': {
      const [w, h] = [
        [84, 40],
        [76, 48],
        [92, 30],
      ][shape.variant % 3]!;
      return <rect x={50 - w! / 2} y={50 - h! / 2} width={w} height={h} />;
    }
    case 'triangle':
      return <polygon points={['50,8 92,86 8,86', '14,14 14,86 86,86', '50,4 63,96 37,96'][shape.variant % 3]} />;
  }
}

export function ShapePicture({ shape, size = 120 }: { shape: Shape; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="shape-picture">
      <g transform={`rotate(${shape.rotate} 50 50) translate(50 50) scale(${shape.size / 100}) translate(-50 -50)`} fill="#7fa7c9" stroke={INK} strokeWidth={400 / shape.size} strokeLinejoin="round">
        {outline(shape)}
      </g>
    </svg>
  );
}

const PATTERN_ART = [
  <circle key="0" cx="50" cy="50" r="36" fill="#d96a5a" />,
  <rect key="1" x="16" y="16" width="68" height="68" fill="#4f6a8a" />,
  <polygon key="2" points="50,10 90,86 10,86" fill="#f6c443" />,
  <polygon key="3" points="50,8 92,50 50,92 8,50" fill="#6aa35f" />,
  <rect key="4" x="10" y="30" width="80" height="40" fill="#a77bc4" />,
  <polygon key="5" points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38" fill="#e8913a" />,
];

export function PatternItem({ item, size = 72 }: { item: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="pattern-item">
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        {PATTERN_ART[item]}
      </g>
    </svg>
  );
}

const STEP = 22;

/** Something `height` steps tall, standing on the ground or on a box `lift` steps high. */
export function Tower({ height, lift = 0 }: { height: number; lift?: number }) {
  return (
    <div className="tower">
      <span className="tower-body" style={{ height: height * STEP }} />
      {lift > 0 && <span className="tower-box" style={{ height: lift * STEP }} />}
    </div>
  );
}
