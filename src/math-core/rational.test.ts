import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { add, compare, decimalPlaces, div, equals, isInteger, mul, neg, ratio, sub, toMixed, type Rational } from './rational.ts';

const big = fc.bigInt({ min: -(10n ** 12n), max: 10n ** 12n });
const nonZero = big.filter((x) => x !== 0n);
const rational = fc.tuple(big, nonZero).map(([n, d]) => ratio(n, d));
const nonZeroRational = rational.filter((r) => r.n !== 0n);

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));

describe('Rational', () => {
  it('is always in lowest terms with a positive denominator', () => {
    fc.assert(
      fc.property(big, nonZero, (n, d) => {
        const r = ratio(n, d);
        expect(r.d > 0n).toBe(true);
        expect(gcd(r.n, r.d)).toBe(1n);
        expect(r.n * d).toBe(n * r.d); // the same value
      }),
    );
  });

  it('agrees with examples', () => {
    expect(ratio(2, 4)).toEqual({ n: 1n, d: 2n });
    expect(ratio(50, 100)).toEqual(ratio(5, 10));
    expect(ratio(0, -7)).toEqual({ n: 0n, d: 1n });
    expect(ratio(3, -6)).toEqual({ n: -1n, d: 2n });
    expect(add(ratio(1, 2), ratio(1, 4))).toEqual(ratio(3, 4));
    expect(mul(ratio(2, 3), ratio(3, 4))).toEqual(ratio(1, 2));
    expect(div(ratio(1, 2), ratio(1, 4))).toEqual(ratio(2));
  });

  it('never accepts a float or a zero denominator', () => {
    expect(() => ratio(0.5)).toThrow(RangeError);
    expect(() => ratio(1, 0)).toThrow(RangeError);
    expect(() => div(ratio(1), ratio(0))).toThrow(RangeError);
  });

  it('obeys the field laws', () => {
    fc.assert(
      fc.property(rational, rational, rational, (a, b, c) => {
        expect(add(a, b)).toEqual(add(b, a));
        expect(mul(a, b)).toEqual(mul(b, a));
        expect(add(add(a, b), c)).toEqual(add(a, add(b, c)));
        expect(mul(a, add(b, c))).toEqual(add(mul(a, b), mul(a, c)));
        expect(sub(add(a, b), b)).toEqual(a);
        expect(add(a, neg(a))).toEqual(ratio(0));
      }),
    );
  });

  it('undoes multiplication with division', () => {
    fc.assert(fc.property(rational, nonZeroRational, (a, b) => {
      expect(div(mul(a, b), b)).toEqual(a);
    }));
  });

  it('compares by cross multiplication, whatever the signs', () => {
    fc.assert(
      fc.property(rational, rational, (a: Rational, b: Rational) => {
        const c = compare(a, b);
        expect(c).toBe(-compare(b, a) || 0);
        expect(c === 0).toBe(equals(a, b));
        expect(c).toBe(Math.sign(Number(sub(a, b).n)));
      }),
    );
  });

  it('splits into whole and fraction', () => {
    expect(toMixed(ratio(3, 2))).toEqual({ whole: 1n, fraction: ratio(1, 2) });
    expect(toMixed(ratio(-3, 2))).toEqual({ whole: -1n, fraction: ratio(-1, 2) });
    expect(toMixed(ratio(4))).toEqual({ whole: 4n, fraction: ratio(0) });
    fc.assert(
      fc.property(rational, (a) => {
        const { whole, fraction } = toMixed(a);
        expect(add(ratio(whole), fraction)).toEqual(a);
        expect(fraction.n * fraction.n < fraction.d * fraction.d).toBe(true);
      }),
    );
  });

  it('knows which values have a finite decimal form', () => {
    expect(decimalPlaces(ratio(1, 3))).toBeNull();
    expect(decimalPlaces(ratio(1, 6))).toBeNull();
    expect(decimalPlaces(ratio(7))).toBe(0);
    expect(decimalPlaces(ratio(1, 2))).toBe(1);
    expect(decimalPlaces(ratio(1, 20))).toBe(2);
    expect(decimalPlaces(ratio(1, 8))).toBe(3);
    expect(isInteger(ratio(6, 3))).toBe(true);
  });
});
