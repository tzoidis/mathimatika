// Our own Greek number format (PRD §9), not Intl.NumberFormat: that takes floats and
// its thousands separator depends on the browser. Decimal comma always; thousands
// with a dot or a narrow space, as the class book does.

import { decimalPlaces, neg, ratio, sub, add, toMixed, toRational, type Numeric, type Rational } from './rational.ts';

export type ThousandsStyle = 'dot' | 'thin';

export interface FormatOptions {
  thousands?: ThousandsStyle;
  /** keeps trailing zeros: 2,50 € rather than 2,5 € */
  minDecimals?: number;
}

const DOT = '.';
/** no-break, so a number never wraps across two lines */
const NARROW_SPACE = ' ';
const THIN_SPACE = ' ';
const MINUS = '−';
const COMMA = ',';

const separator = (style: ThousandsStyle) => (style === 'dot' ? DOT : NARROW_SPACE);

function group(digits: string, sep: string): string {
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += sep;
    out += digits[i];
  }
  return out;
}

/** Throws for a value with no finite decimal form (1/3): use formatFraction for those. */
export function formatNumber(value: Numeric, options: FormatOptions = {}): string {
  const { thousands = 'dot', minDecimals = 0 } = options;
  const x = toRational(value);
  const needed = decimalPlaces(x);
  if (needed === null) throw new RangeError('no finite decimal form');
  const places = Math.max(needed, minDecimals);
  const negative = x.n < 0n;
  const scaled = ((negative ? -x.n : x.n) * 10n ** BigInt(places)) / x.d;
  const digits = scaled.toString().padStart(places + 1, '0');
  const whole = digits.slice(0, digits.length - places);
  const decimals = digits.slice(digits.length - places);
  return (negative ? MINUS : '') + group(whole, separator(thousands)) + (places > 0 ? COMMA + decimals : '');
}

/** «3/4», or with `mixed` «1 1/2» for values above one. The fraction is shown as stored: in lowest terms. */
export function formatFraction(value: Numeric, { mixed = false }: { mixed?: boolean } = {}): string {
  const x = toRational(value);
  if (x.d === 1n) return formatNumber(x);
  const negative = x.n < 0n;
  const abs = negative ? neg(x) : x;
  const sign = negative ? MINUS : '';
  if (mixed && abs.n > abs.d) {
    const { whole, fraction } = toMixed(abs);
    return `${sign}${group(whole.toString(), DOT)} ${fraction.n}/${fraction.d}`;
  }
  return `${sign}${abs.n}/${abs.d}`;
}

const DIGITS = /^\d+$/;
/** every group of three, separated the same way all along */
const GROUPED = /^\d{1,3}(?:(\.| | )\d{3})(?:\1\d{3})*$/;

function parseWhole(text: string): bigint | null {
  if (DIGITS.test(text)) return BigInt(text);
  if (!GROUPED.test(text)) return null;
  return BigInt(text.split(DOT).join('').split(NARROW_SPACE).join('').split(THIN_SPACE).join(''));
}

function parseUnsigned(text: string): Rational | null {
  const mixed = /^(\S+) (\d+)\/(\d+)$/.exec(text);
  if (mixed) {
    const whole = parseWhole(mixed[1]!);
    const den = BigInt(mixed[3]!);
    return whole === null || den === 0n ? null : add(ratio(whole), ratio(BigInt(mixed[2]!), den));
  }
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const den = BigInt(fraction[2]!);
    return den === 0n ? null : ratio(BigInt(fraction[1]!), den);
  }
  const comma = text.indexOf(COMMA);
  if (comma === -1) {
    const whole = parseWhole(text);
    return whole === null ? null : ratio(whole);
  }
  const whole = parseWhole(text.slice(0, comma));
  const decimals = text.slice(comma + 1);
  if (whole === null || !DIGITS.test(decimals)) return null;
  return add(ratio(whole), ratio(BigInt(decimals), 10n ** BigInt(decimals.length)));
}

/** Reads what formatNumber and formatFraction write, plus plain digits. null if it is not a number. */
export function parseNumber(input: string): Rational | null {
  const text = input.trim();
  const negative = text.startsWith(MINUS) || text.startsWith('-');
  const value = parseUnsigned(negative ? text.slice(1) : text);
  if (value === null) return null;
  return negative ? sub(ratio(0n), value) : value;
}
