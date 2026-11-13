// Grade 1, space and shapes: which arrow, routes on squared paper (ch. 1, 36), pictures
// made of shapes (ch. 40), how many pieces make a shape (ch. 45), and mirror halves
// (ch. 56). Everything is data; the drawings are in exercises/question.

import { pick, randInt, shuffle } from '../../engine/rng.ts';
import type { SkillId } from '../../engine/types.ts';
import { ratio, type Rational } from '../rational.ts';
import type { ShapeKind } from './geometry.ts';
import { given, nOffByOne } from './number.ts';
import type { Choice, GenCtx, Generator } from './types.ts';

const mistake = (value: number, right: number): Rational | null => (value === right || value < 1 ? null : ratio(value));

// ---------- the grid ----------

export type Direction = 'up' | 'right' | 'down' | 'left';
export const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

export interface Grid {
  cols: number;
  rows: number;
  /** cells nobody can walk into */
  obstacles: number[];
}

export function step(grid: Grid, cell: number, d: Direction): number {
  const [c, r] = [cell % grid.cols, Math.floor(cell / grid.cols)];
  const [nc, nr] = d === 'up' ? [c, r - 1] : d === 'down' ? [c, r + 1] : d === 'left' ? [c - 1, r] : [c + 1, r];
  if (nc < 0 || nr < 0 || nc >= grid.cols || nr >= grid.rows) return cell;
  const next = nr * grid.cols + nc;
  return grid.obstacles.includes(next) ? cell : next;
}

/** The fewest steps from one cell to another, or null if there is no way through. */
export function shortestSteps(grid: Grid, from: number, to: number): number | null {
  const seen = new Map([[from, 0]]);
  const queue = [from];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    if (cell === to) return seen.get(cell)!;
    for (const d of DIRECTIONS) {
      const next = step(grid, cell, d);
      if (!seen.has(next)) {
        seen.set(next, seen.get(cell)! + 1);
        queue.push(next);
      }
    }
  }
  return null;
}

// ---------- which arrow (ch. 1) ----------

export interface ArrowParams {
  cols: number;
  rows: number;
  at: number;
  direction: Direction;
  /** how far the star is, in that direction */
  distance: number;
}

const arrowValue = (d: Direction) => DIRECTIONS.indexOf(d) + 1;
const opposite = (d: Direction): Direction => DIRECTIONS[(DIRECTIONS.indexOf(d) + 2) % 4]!;

function starOf(p: ArrowParams): number {
  let cell = p.at;
  for (let i = 0; i < p.distance; i++) cell = step({ cols: p.cols, rows: p.rows, obstacles: [] }, cell, p.direction);
  return cell;
}

export function arrowGenerator(id: string, skill: SkillId): Generator<ArrowParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const size = level === 1 ? 3 : 5;
      return { cols: size, rows: size, at: level === 1 ? 4 : randInt(0, size * size - 1, rng), direction: pick(DIRECTIONS, rng), distance: level === 3 ? randInt(1, 3, rng) : 1 };
    },
    // the star must be that far away in that direction, inside the grid
    constraints: [(p) => p.at >= 0 && p.at < p.cols * p.rows, (p) => shortestSteps({ cols: p.cols, rows: p.rows, obstacles: [] }, p.at, starOf(p)) === p.distance],
    key: (p) => [id, p.at, p.direction, p.distance].join(':'),
    build: (p) => ({
      answer: ratio(arrowValue(p.direction)),
      scene: { kind: 'arrow', cols: p.cols, rows: p.rows, at: p.at, star: starOf(p) },
      say: [{ instruction: 'which-arrow' }],
      answerMode: 'pictures',
      choices: DIRECTIONS.map((d): Choice => ({ label: d, value: arrowValue(d) })),
    }),
    detectors: [
      {
        code: 'WRONG_DIRECTION',
        hintId: 'look-at-star',
        simulate: (p) => ratio(arrowValue(opposite(p.direction))),
        detect: (p, a) => given(arrowValue(opposite(p.direction)), a),
      },
    ],
  };
}

// ---------- routes (ch. 36) ----------

export interface RouteParams extends Grid {
  start: number;
  target: number;
  /** go: walk it with the arrows · steps: how many steps it takes */
  ask: 'go' | 'steps';
}

const routeSteps = (p: RouteParams) => shortestSteps(p, p.start, p.target) ?? 0;

export function routeGenerator(id: string, skill: SkillId, ask: RouteParams['ask']): Generator<RouteParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const [cols, rows] = [5, 4];
      const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i), rng);
      const blocks = ask === 'go' ? (level === 1 ? 0 : level === 2 ? 3 : 5) : level === 3 ? 3 : 0;
      return { cols, rows, start: cells[0]!, target: cells[1]!, obstacles: cells.slice(2, 2 + blocks).sort((a, b) => a - b), ask };
    },
    constraints: [(p) => p.start !== p.target, (p) => routeSteps(p) >= 2, (p) => routeSteps(p) <= (p.ask === 'steps' ? 7 : 9), (p) => shortestSteps(p, p.start, p.target) !== null],
    key: (p) => [id, p.start, p.target, ...p.obstacles].join(':'),
    build: (p) => ({
      answer: ratio(p.ask === 'go' ? p.target + 1 : routeSteps(p)),
      scene: { kind: 'route', cols: p.cols, rows: p.rows, start: p.start, target: p.target, obstacles: p.obstacles, ask: p.ask },
      say: [{ instruction: p.ask === 'go' ? 'route-go' : 'route-steps' }],
      ...(p.ask === 'go' ? { answerMode: 'route' as const } : {}),
    }),
    detectors:
      ask === 'go'
        ? [
            {
              // stopped somewhere else: one step short is the usual
              code: 'ROUTE_MISSED',
              hintId: 'route-arrows',
              simulate: (p) => ratio(p.start + 1),
              detect: (p, a) => a.d === 1n && a.n >= 1n && a.n <= BigInt(p.cols * p.rows) && !given(p.target + 1, a),
            },
          ]
        : [
            // counted the square it starts on as well
            { code: 'OFF_BY_ONE', hintId: 'count-start', simulate: (p) => ratio(routeSteps(p) + 1), detect: (p, a) => given(routeSteps(p) + 1, a) },
            nOffByOne(routeSteps, 'count-start'),
          ],
  };
}

// ---------- pictures made of shapes (ch. 40) ----------

export interface Part {
  kind: ShapeKind;
  /** the box it fills, in a 100 × 100 picture */
  x: number;
  y: number;
  w: number;
  h: number;
  /** triangles point up unless turned: 0, 90, 180, 270 */
  turn?: number;
}

/** a square part always has w === h, so it looks like one */
export const COMPOSITIONS: Record<string, Part[]> = {
  house: [
    { kind: 'triangle', x: 15, y: 8, w: 70, h: 30 },
    { kind: 'square', x: 21, y: 38, w: 58, h: 58 },
    { kind: 'rectangle', x: 44, y: 70, w: 13, h: 26 },
    { kind: 'square', x: 26, y: 46, w: 13, h: 13 },
    { kind: 'square', x: 61, y: 46, w: 13, h: 13 },
    { kind: 'circle', x: 82, y: 4, w: 14, h: 14 },
  ],
  robot: [
    { kind: 'square', x: 36, y: 4, w: 28, h: 28 },
    { kind: 'circle', x: 39, y: 13, w: 8, h: 8 },
    { kind: 'circle', x: 53, y: 13, w: 8, h: 8 },
    { kind: 'rectangle', x: 26, y: 34, w: 48, h: 36 },
    { kind: 'rectangle', x: 12, y: 36, w: 12, h: 30 },
    { kind: 'rectangle', x: 76, y: 36, w: 12, h: 30 },
    { kind: 'rectangle', x: 32, y: 72, w: 12, h: 24 },
    { kind: 'rectangle', x: 56, y: 72, w: 12, h: 24 },
    { kind: 'triangle', x: 44, y: 44, w: 12, h: 12 },
  ],
  rocket: [
    { kind: 'triangle', x: 35, y: 4, w: 30, h: 22 },
    { kind: 'rectangle', x: 35, y: 26, w: 30, h: 52 },
    { kind: 'circle', x: 42, y: 34, w: 16, h: 16 },
    { kind: 'triangle', x: 18, y: 62, w: 17, h: 24 },
    { kind: 'triangle', x: 65, y: 62, w: 17, h: 24 },
    { kind: 'triangle', x: 40, y: 78, w: 20, h: 16, turn: 180 },
  ],
  cat: [
    { kind: 'circle', x: 22, y: 26, w: 56, h: 56 },
    { kind: 'triangle', x: 22, y: 8, w: 20, h: 24 },
    { kind: 'triangle', x: 58, y: 8, w: 20, h: 24 },
    { kind: 'circle', x: 36, y: 44, w: 9, h: 9 },
    { kind: 'circle', x: 55, y: 44, w: 9, h: 9 },
    { kind: 'triangle', x: 45, y: 58, w: 10, h: 8, turn: 180 },
  ],
  train: [
    { kind: 'rectangle', x: 6, y: 40, w: 40, h: 34 },
    { kind: 'rectangle', x: 46, y: 24, w: 30, h: 50 },
    { kind: 'square', x: 53, y: 31, w: 16, h: 16 },
    { kind: 'rectangle', x: 14, y: 26, w: 10, h: 14 },
    { kind: 'circle', x: 10, y: 70, w: 18, h: 18 },
    { kind: 'circle', x: 30, y: 70, w: 18, h: 18 },
    { kind: 'circle', x: 54, y: 70, w: 18, h: 18 },
    { kind: 'triangle', x: 76, y: 52, w: 18, h: 22, turn: 90 },
  ],
  tree: [
    { kind: 'triangle', x: 25, y: 4, w: 50, h: 28 },
    { kind: 'triangle', x: 18, y: 22, w: 64, h: 30 },
    { kind: 'triangle', x: 10, y: 42, w: 80, h: 32 },
    { kind: 'rectangle', x: 42, y: 74, w: 16, h: 22 },
    { kind: 'circle', x: 30, y: 50, w: 8, h: 8 },
    { kind: 'circle', x: 62, y: 56, w: 8, h: 8 },
  ],
};

export interface ComposeParams {
  picture: string;
  ask: ShapeKind;
}

const countOf = (picture: string, kind: ShapeKind) => COMPOSITIONS[picture]!.filter((p) => p.kind === kind).length;
const composeRight = (p: ComposeParams) => countOf(p.picture, p.ask);

export function composeGenerator(id: string, skill: SkillId): Generator<ComposeParams> {
  const pictures = Object.keys(COMPOSITIONS);
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ picture: pick(pictures, rng), ask: pick<ShapeKind>(level === 1 ? ['triangle', 'circle'] : ['triangle', 'circle', 'square', 'rectangle'], rng) }),
    constraints: [(p) => composeRight(p) >= 1],
    key: (p) => [id, p.picture, p.ask].join(':'),
    build: (p) => ({
      answer: ratio(composeRight(p)),
      scene: { kind: 'compose', picture: p.picture, ask: p.ask },
      say: [{ instruction: `count-${p.ask}s` }],
    }),
    detectors: [
      // squares and rectangles counted together
      {
        code: 'SHAPE_CONFUSED',
        hintId: 'shape-sides',
        simulate: (p) => (p.ask === 'square' || p.ask === 'rectangle' ? mistake(countOf(p.picture, 'square') + countOf(p.picture, 'rectangle'), composeRight(p)) : null),
        detect: (p, a) => {
          const both = countOf(p.picture, 'square') + countOf(p.picture, 'rectangle');
          return (p.ask === 'square' || p.ask === 'rectangle') && both !== composeRight(p) && given(both, a);
        },
      },
      { code: 'PART_IS_WHOLE', hintId: 'shape-sides', simulate: (p) => mistake(COMPOSITIONS[p.picture]!.length, composeRight(p)), detect: (p, a) => COMPOSITIONS[p.picture]!.length !== composeRight(p) && given(COMPOSITIONS[p.picture]!.length, a) },
      nOffByOne(composeRight, 'count-again'),
    ],
  };
}

// ---------- how many pieces (ch. 45) ----------

/** A shape cut into equal pieces: the piece shown on its own, and how many there are. */
export const FIGURES = {
  square2: { piece: 'triangle', pieces: 2 },
  square4: { piece: 'triangle', pieces: 4 },
  rect2: { piece: 'square', pieces: 2 },
  rect3: { piece: 'square', pieces: 3 },
  triangle4: { piece: 'triangle', pieces: 4 },
  rect4: { piece: 'triangle', pieces: 4 },
} as const;
export type Figure = keyof typeof FIGURES;

export interface PiecesParams {
  figure: Figure;
  /** level 1: the cuts are drawn */
  lines: boolean;
}

const piecesRight = (p: PiecesParams) => FIGURES[p.figure].pieces;

export function piecesGenerator(id: string, skill: SkillId): Generator<PiecesParams> {
  const figures = Object.keys(FIGURES) as Figure[];
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => ({ figure: pick(level === 1 ? (['square2', 'rect2', 'rect3'] as Figure[]) : figures, rng), lines: level === 1 }),
    constraints: [(p) => p.figure in FIGURES],
    key: (p) => [id, p.figure, p.lines ? 1 : 0].join(':'),
    build: (p) => ({
      answer: ratio(piecesRight(p)),
      scene: { kind: 'pieces', figure: p.figure, lines: p.lines },
      say: [{ instruction: 'pieces-how-many' }],
    }),
    detectors: [
      // four triangles seen as two halves
      { code: 'COUNTED_GROUPS', hintId: 'piece-fit', simulate: (p) => (piecesRight(p) === 4 ? ratio(2) : null), detect: (p, a) => piecesRight(p) === 4 && given(2, a) },
      nOffByOne(piecesRight, 'piece-fit'),
    ],
  };
}

// ---------- mirror halves (ch. 56) ----------

export interface MirrorParams {
  /** columns on each side of the fold */
  half: number;
  rows: number;
  /** coloured cells of the left half, as row * half + column */
  filled: number[];
}

/** The right half's cells that mirror the left half's, as row * half + column. */
export const mirrored = (p: Pick<MirrorParams, 'half' | 'filled'>) =>
  p.filled.map((cell) => Math.floor(cell / p.half) * p.half + (p.half - 1 - (cell % p.half))).sort((a, b) => a - b);

/** What a child who copies instead of mirroring would colour. */
export const copied = (p: Pick<MirrorParams, 'filled'>) => [...p.filled].sort((a, b) => a - b);

export const MIRRORED = 1;
export const COPIED = 2;
export const OTHER = 3;

export function mirrorGenerator(id: string, skill: SkillId): Generator<MirrorParams> {
  return {
    id,
    skill,
    params: ({ rng, level }: GenCtx) => {
      const half = level === 1 ? 2 : 3;
      const rows = 4;
      const cells = shuffle(Array.from({ length: half * rows }, (_, i) => i), rng);
      return { half, rows, filled: cells.slice(0, level === 1 ? 3 : level === 2 ? 4 : 6).sort((a, b) => a - b) };
    },
    // copying must look different from mirroring, so the mistake can be seen
    constraints: [(p) => mirrored(p).join() !== copied(p).join()],
    key: (p) => [id, p.half, ...p.filled].join(':'),
    build: (p) => ({
      answer: ratio(MIRRORED),
      scene: { kind: 'mirror', half: p.half, rows: p.rows, filled: p.filled },
      say: [{ instruction: 'mirror' }],
      answerMode: 'mirror',
    }),
    detectors: [{ code: 'COPIED_NOT_MIRRORED', hintId: 'mirror-fold', simulate: () => ratio(COPIED), detect: (_p, a) => given(COPIED, a) }],
  };
}
