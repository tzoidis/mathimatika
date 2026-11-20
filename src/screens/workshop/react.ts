// What a thing in the Workshop does when it is tapped: a short movement and a few notes
// made by the device (no clips). Each item names its kind in workshop.json.

export const REACTIONS = ['hop', 'sway', 'glow', 'fly', 'swim', 'wobble', 'spin'] as const;
export type Reaction = (typeof REACTIONS)[number];

export const isReaction = (k: unknown): k is Reaction => REACTIONS.includes(k as Reaction);

const C = 523.25;
const D = 587.33;
const E = 659.25;
const G = 783.99;
const A = 880;
const C2 = 1046.5;

/** The notes of each kind, in hertz: soft and short, never a fanfare. */
export const REACTION_TUNES: Record<Reaction, readonly number[]> = {
  hop: [C, G],
  sway: [E, D, E],
  glow: [G, C2],
  fly: [C, E, G, C2],
  swim: [G, E, G],
  wobble: [A, A],
  spin: [C, E, G, E],
};

/** How long the movement lasts, in ms; matches the CSS animations. */
export const REACTION_MS = 900;
