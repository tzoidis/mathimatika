import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatFraction, formatNumber, parseNumber } from './format.ts';
import { ratio } from './rational.ts';

const NNBSP = ' ';

describe('formatNumber', () => {
  it.each([
    [ratio(0), '0'],
    [ratio(7), '7'],
    [ratio(999), '999'],
    [ratio(1000), '1.000'],
    [ratio(12345), '12.345'],
    [ratio(1000000), '1.000.000'],
    [ratio(2469, 2), '1.234,5'],
    [ratio(1, 20), '0,05'],
    [ratio(1, 2), '0,5'],
    [ratio(1, 1000), '0,001'],
    [ratio(-3), '−3'],
    [ratio(-5, 2), '−2,5'],
  ])('%o is %s', (value, text) => {
    expect(formatNumber(value)).toBe(text);
  });

  it('takes whole numbers directly, never a float', () => {
    expect(formatNumber(1234)).toBe('1.234');
    expect(formatNumber(1234n)).toBe('1.234');
    expect(() => formatNumber(0.5)).toThrow(RangeError);
  });

  it('uses the thousands style of the class book', () => {
    expect(formatNumber(1234567, { thousands: 'thin' })).toBe(`1${NNBSP}234${NNBSP}567`);
    expect(formatNumber(ratio(24691, 20), { thousands: 'thin' })).toBe(`1${NNBSP}234,55`);
  });

  it('keeps the zeros of a price', () => {
    expect(formatNumber(ratio(5, 2), { minDecimals: 2 })).toBe('2,50');
    expect(formatNumber(3, { minDecimals: 2 })).toBe('3,00');
    expect(formatNumber(ratio(1, 8), { minDecimals: 2 })).toBe('0,125');
  });

  it('refuses a value with no finite decimal form', () => {
    expect(() => formatNumber(ratio(1, 3))).toThrow(RangeError);
  });
});

describe('formatFraction', () => {
  it.each([
    [ratio(3, 4), {}, '3/4'],
    [ratio(2, 4), {}, '1/2'],
    [ratio(3, 2), {}, '3/2'],
    [ratio(3, 2), { mixed: true }, '1 1/2'],
    [ratio(1, 2), { mixed: true }, '1/2'],
    [ratio(-3, 2), { mixed: true }, '−1 1/2'],
    [ratio(4), { mixed: true }, '4'],
  ])('%o with %o is %s', (value, options, text) => {
    expect(formatFraction(value, options)).toBe(text);
  });
});

describe('parseNumber', () => {
  it.each([
    ['0,50', ratio(1, 2)],
    ['0,5', ratio(1, 2)],
    ['1 1/2', ratio(3, 2)],
    ['3/2', ratio(3, 2)],
    ['2/4', ratio(1, 2)],
    ['1.234,5', ratio(2469, 2)],
    ['1234', ratio(1234)],
    ['1.000.000', ratio(1000000)],
    [`1${NNBSP}234`, ratio(1234)],
    ['1 234', ratio(1234)],
    ['−7', ratio(-7)],
    ['-7', ratio(-7)],
    ['−1 1/2', ratio(-3, 2)],
    ['07', ratio(7)],
  ])('%s', (text, value) => {
    expect(parseNumber(text)).toEqual(value);
  });

  it.each(['', ' ', 'abc', '1,', ',5', '1,2,3', '1.23', '1.2345', '12.34.567', '1/0', '1 1/0', '1/', '/2', '1.5', `1.234${NNBSP}567`, '1,5/2', '--3', '0.5'])('rejects %j', (text) => {
    expect(parseNumber(text)).toBeNull();
  });
});

describe('round trip parse(format(x)) = x', () => {
  const whole = fc.bigInt({ min: -(10n ** 15n), max: 10n ** 15n });
  const decimal = fc.tuple(whole, fc.integer({ min: 0, max: 9 })).map(([n, k]) => ratio(n, 10n ** BigInt(k)));
  const fraction = fc.tuple(whole, fc.bigInt({ min: 1n, max: 10n ** 6n })).map(([n, d]) => ratio(n, d));

  it('for decimals, in both thousands styles', () => {
    fc.assert(
      fc.property(decimal, fc.constantFrom('dot' as const, 'thin' as const), fc.integer({ min: 0, max: 4 }), (x, thousands, minDecimals) => {
        expect(parseNumber(formatNumber(x, { thousands, minDecimals }))).toEqual(x);
      }),
      { numRuns: 1000 },
    );
  });

  it('for fractions, plain and mixed', () => {
    fc.assert(
      fc.property(fraction, fc.boolean(), (x, mixed) => {
        expect(parseNumber(formatFraction(x, { mixed }))).toEqual(x);
      }),
      { numRuns: 1000 },
    );
  });

  it('agrees with an independent decimal reading', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 15n }), fc.integer({ min: 1, max: 6 }), (n, k) => {
        const plain = n.toString().padStart(k + 1, '0');
        const text = `${plain.slice(0, -k)},${plain.slice(-k)}`;
        expect(parseNumber(text)).toEqual(ratio(n, 10n ** BigInt(k)));
      }),
    );
  });
});
