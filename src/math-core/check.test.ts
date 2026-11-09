import { describe, expect, it } from 'vitest';
import { check } from './check.ts';
import { ratio } from './rational.ts';

describe('check', () => {
  it.each([
    ['0,50', ratio(1, 2)],
    ['0,5', ratio(1, 2)],
    ['1/2', ratio(1, 2)],
    ['2/4', ratio(1, 2)],
    ['1 1/2', ratio(3, 2)],
    ['3/2', ratio(3, 2)],
    ['1,5', ratio(3, 2)],
    ['1.000', ratio(1000)],
    ['1000', ratio(1000)],
    ['007', ratio(7)],
  ])('accepts %s for its value', (input, answer) => {
    expect(check(input, answer, { equality: 'value' })).toEqual({ ok: true });
  });

  it.each([
    ['', ratio(5)],
    ['abc', ratio(5)],
    ['6', ratio(5)],
    ['0,51', ratio(1, 2)],
  ])('refuses «%s»', (input, answer) => {
    expect(check(input, answer, { equality: 'value' }).ok).toBe(false);
  });

  it('accepts an unsimplified fraction with a note, when simplest is asked for', () => {
    expect(check('2/4', ratio(1, 2), { equality: 'simplest' })).toEqual({ ok: true, note: 'notSimplified' });
    expect(check('1 2/4', ratio(3, 2), { equality: 'simplest' })).toEqual({ ok: true, note: 'notSimplified' });
    expect(check('1/2', ratio(1, 2), { equality: 'simplest' })).toEqual({ ok: true });
    expect(check('0,50', ratio(1, 2), { equality: 'simplest' })).toEqual({ ok: true });
  });

  it('wants the written form exactly, when exactForm is asked for', () => {
    expect(check('0,5', ratio(1, 2), { equality: 'exactForm' })).toEqual({ ok: true });
    expect(check('1/2', ratio(1, 2), { equality: 'exactForm' }).ok).toBe(false);
    expect(check('1/3', ratio(1, 3), { equality: 'exactForm' })).toEqual({ ok: true });
  });
});
