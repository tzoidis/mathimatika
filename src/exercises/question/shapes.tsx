// Shapes drawn for the geometry questions: any shape at any turn and size, and the six
// things patterns are made of. Each of those differs in shape as well as colour, so
// colour never carries the meaning alone (PRD §7).

import type { Shape } from '../../math-core/generators/geometry.ts';
import type { Figure, Part } from '../../math-core/generators/space.ts';

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

const PART_FILL: Record<string, string> = { triangle: '#f6c443', square: '#7fa7c9', rectangle: '#6aa35f', circle: '#d96a5a' };

/** A picture made of shapes (book ch. 40), each drawn in its own box. */
export function CompositionPicture({ parts, size = 300 }: { parts: Part[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="composition" aria-hidden>
      <g stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
        {parts.map((p, i) => {
          const fill = PART_FILL[p.kind];
          const [cx, cy] = [p.x + p.w / 2, p.y + p.h / 2];
          switch (p.kind) {
            case 'circle':
              return <ellipse key={i} cx={cx} cy={cy} rx={p.w / 2} ry={p.h / 2} fill={fill} />;
            case 'triangle':
              return (
                <polygon
                  key={i}
                  points={[[cx, p.y], [p.x + p.w, p.y + p.h], [p.x, p.y + p.h]].map((pt) => pt.join(',')).join(' ')}
                  transform={`rotate(${p.turn ?? 0} ${cx} ${cy})`}
                  fill={fill}
                />
              );
            default:
              return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={fill} />;
          }
        })}
      </g>
    </svg>
  );
}

const U = 50;
type Poly = [number, number][];

/** Each figure as its pieces, in units of U; the first piece is the one shown alone. */
const FIGURE_PIECES: Record<Figure, Poly[]> = {
  square2: [
    [[0, 0], [2, 0], [0, 2]],
    [[2, 0], [2, 2], [0, 2]],
  ],
  square4: [
    [[0, 0], [2, 0], [1, 1]],
    [[2, 0], [2, 2], [1, 1]],
    [[2, 2], [0, 2], [1, 1]],
    [[0, 2], [0, 0], [1, 1]],
  ],
  rect2: [
    [[0, 0], [2, 0], [2, 2], [0, 2]],
    [[2, 0], [4, 0], [4, 2], [2, 2]],
  ],
  rect3: [
    [[0, 0], [2, 0], [2, 2], [0, 2]],
    [[2, 0], [4, 0], [4, 2], [2, 2]],
    [[4, 0], [6, 0], [6, 2], [4, 2]],
  ],
  triangle4: [
    [[2, 0], [3, 2], [1, 2]],
    [[1, 2], [2, 4], [0, 4]],
    [[3, 2], [4, 4], [2, 4]],
    [[1, 2], [3, 2], [2, 4]],
  ],
  rect4: [
    [[0, 0], [2, 0], [0, 2]],
    [[2, 0], [2, 2], [0, 2]],
    [[2, 0], [4, 0], [2, 2]],
    [[4, 0], [4, 2], [2, 2]],
  ],
};

const points = (poly: Poly, dx = 0, dy = 0) => poly.map(([x, y]) => [x * U + dx, y * U + dy].join(',')).join(' ');

function bounds(polys: Poly[]) {
  const xs = polys.flat().map(([x]) => x);
  const ys = polys.flat().map(([, y]) => y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/** The whole shape, its cuts drawn or not, at the same scale as the piece. */
export function FigurePicture({ figure, lines }: { figure: Figure; lines: boolean }) {
  const polys = FIGURE_PIECES[figure];
  const b = bounds(polys);
  return (
    <svg width={b.w * U * 0.9 + 8} height={b.h * U * 0.9 + 8} viewBox={`-4 -4 ${b.w * U + 8} ${b.h * U + 8}`} aria-hidden className="figure-picture">
      <g fill="#7fa7c9" stroke={lines ? INK : '#7fa7c9'} strokeWidth="3" strokeLinejoin="round">
        {polys.map((p, i) => (
          <polygon key={i} points={points(p)} />
        ))}
      </g>
      <polygon points={points(outlineOf(figure))} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

/** The outer edge of each figure. */
function outlineOf(figure: Figure): Poly {
  switch (figure) {
    case 'square2':
    case 'square4':
      return [[0, 0], [2, 0], [2, 2], [0, 2]];
    case 'rect2':
    case 'rect4':
      return [[0, 0], [4, 0], [4, 2], [0, 2]];
    case 'rect3':
      return [[0, 0], [6, 0], [6, 2], [0, 2]];
    case 'triangle4':
      return [[2, 0], [4, 4], [0, 4]];
  }
}

/** One piece, alone, at the figure's scale. */
export function PiecePicture({ figure }: { figure: Figure }) {
  const piece = FIGURE_PIECES[figure][0]!;
  const b = bounds([piece]);
  return (
    <svg width={b.w * U * 0.9 + 8} height={b.h * U * 0.9 + 8} viewBox={`${b.minX * U - 4} ${b.minY * U - 4} ${b.w * U + 8} ${b.h * U + 8}`} aria-hidden className="piece-picture">
      <polygon points={points(piece)} fill="#f6c443" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
