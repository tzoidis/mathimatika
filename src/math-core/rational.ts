// Exact arithmetic (PRD §9). No float anywhere in the logic: decimals are rationals
// with denominator 10^k, so 0,50 = 0,5 and 2/4 = 1/2 with no rounding surprises.

export interface Rational {
  readonly n: bigint;
  readonly d: bigint;
}

export type Numeric = Rational | bigint | number;

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** Always normalized: d > 0 and n/d in lowest terms; zero is 0/1. */
export function ratio(n: bigint | number, d: bigint | number = 1n): Rational {
  let num = toBigInt(n);
  let den = toBigInt(d);
  if (den === 0n) throw new RangeError('zero denominator');
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return g === 1n ? { n: num, d: den } : { n: num / g, d: den / g };
}

function toBigInt(x: bigint | number): bigint {
  if (typeof x === 'bigint') return x;
  if (!Number.isSafeInteger(x)) throw new RangeError('only whole numbers are accepted; use ratio() for anything else');
  return BigInt(x);
}

export function toRational(x: Numeric): Rational {
  return typeof x === 'object' ? x : ratio(x);
}

export const add = (a: Rational, b: Rational): Rational => ratio(a.n * b.d + b.n * a.d, a.d * b.d);
export const neg = (a: Rational): Rational => ({ n: -a.n, d: a.d });
export const sub = (a: Rational, b: Rational): Rational => add(a, neg(b));
export const mul = (a: Rational, b: Rational): Rational => ratio(a.n * b.n, a.d * b.d);

export function div(a: Rational, b: Rational): Rational {
  if (b.n === 0n) throw new RangeError('division by zero');
  return ratio(a.n * b.d, a.d * b.n);
}

/** Negative, zero or positive, as a < b, a = b or a > b. */
export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
}

export const equals = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d;
export const isInteger = (a: Rational): boolean => a.d === 1n;

/** The whole part (towards zero) and the fraction left over, with the sign on both. */
export function toMixed(a: Rational): { whole: bigint; fraction: Rational } {
  const whole = a.n / a.d;
  return { whole, fraction: sub(a, ratio(whole)) };
}

/** How many decimal digits an exact decimal needs; null if it has no finite decimal form (1/3). */
export function decimalPlaces(a: Rational): number | null {
  let d = a.d;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    twos++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    fives++;
  }
  return d === 1n ? Math.max(twos, fives) : null;
}
