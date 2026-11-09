import { praiseKeys } from '../../audio/recordings.ts';
import { QUESTIONS_PER_ROUND } from '../../engine/session.ts';
import { pick } from '../../engine/rng.ts';
import type { Round } from '../../engine/types.ts';
import type { GenerateContext } from '../types.ts';

export const PLACEHOLDER_ID = 'placeholder';

export interface PlaceholderItem {
  praiseKey: string;
}

/** A round with no maths in it: five taps, each answered with a praise clip. */
export function generate(ctx: GenerateContext): Round {
  const keys = praiseKeys();
  // the same praise twice in a row sounds like a stuck record
  const items: PlaceholderItem[] = [];
  for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
    const last = items[i - 1]?.praiseKey;
    items.push({ praiseKey: pick(keys.filter((k) => k !== last), ctx.rng) });
  }
  return { id: `${PLACEHOLDER_ID}-${ctx.roundKind}`, exerciseId: PLACEHOLDER_ID, seed: 0, level: ctx.level, items };
}
