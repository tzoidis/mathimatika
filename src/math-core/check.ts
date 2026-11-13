// Is this answer right, whatever way it was written? PRD §9. Units arrive with the
// first measuring generator; nothing has a unit yet.

import { formatFraction, formatNumber, parseNumber } from './format.ts';
import { decimalPlaces, equals, ratio, type Rational } from './rational.ts';

export interface AcceptPolicy {
  /** value: 2/4 = 1/2 = 0,5 · simplest: 2/4 is right, with a gentle note · exactForm: written just so */
  equality: 'value' | 'simplest' | 'exactForm';
}

export type MisconceptionCode =
  | 'SUB_SMALLER_FROM_LARGER'
  | 'CARRY_FORGOTTEN'
  | 'DIGIT_REVERSAL'
  | 'OFF_BY_ONE'
  | 'FRAC_ADD_ACROSS'
  | 'FRAC_BIGGER_DEN_BIGGER'
  | 'DEC_LONGER_IS_BIGGER'
  | 'CLOCK_HANDS_SWAPPED'
  | 'AREA_PERIMETER_SWAP'
  | 'UNIT_NOT_CONVERTED'
  | 'MULT_AS_ADD'
  | 'OPERATION_SWAP'
  | 'PART_IS_WHOLE'
  | 'ADDED_PARTS'
  | 'SIGN_REVERSED'
  | 'WRONG_DIRECTION'
  | 'LINE_POSITION'
  | 'SIZE_NOT_COUNT'
  | 'COUNTED_FROM_TOP'
  | 'COUNTED_COINS'
  | 'COUNTED_GROUPS'
  | 'NOT_REGROUPED'
  | 'TERM_MISSED'
  | 'PLACE_VALUE'
  | 'MEASURED_PAST_END'
  | 'SIZE_NOT_WEIGHT'
  | 'SHAPE_CONFUSED'
  | 'POSITION_NOT_LENGTH'
  | 'PATTERN_BROKEN';

export type Verdict = { ok: true; note?: 'notSimplified' } | { ok: false; code?: MisconceptionCode; hintId?: string };

/** A fraction typed with a common factor left in it: «2/4», «1 2/4». */
function isReducible(input: string): boolean {
  const fraction = /(\d+)\/(\d+)\s*$/.exec(input);
  if (!fraction) return false;
  return ratio(BigInt(fraction[1]!), BigInt(fraction[2]!)).d !== BigInt(fraction[2]!);
}

function canonical(answer: Rational): string {
  return decimalPlaces(answer) === null ? formatFraction(answer) : formatNumber(answer);
}

/** Right or not, with no opinion on why it is wrong: that is the detectors' job. */
export function check(input: string, answer: Rational, policy: AcceptPolicy): Verdict {
  if (policy.equality === 'exactForm') return input.trim() === canonical(answer) ? { ok: true } : { ok: false };
  const given = parseNumber(input);
  if (!given || !equals(given, answer)) return { ok: false };
  return policy.equality === 'simplest' && isReducible(input) ? { ok: true, note: 'notSimplified' } : { ok: true };
}
