import { describe, expect, it } from 'vitest';
import { isTextAllowed, isWordAllowed, readingContext } from './allowedWords.ts';

const after = (letters: number) => readingContext(letters);
const ALL = 36;

describe('the allowed-words rule', () => {
  it('allows nothing before the first letter, not even sight words', () => {
    expect(isWordAllowed('είναι', after(0))).toBe(false);
    expect(isWordAllowed('να', after(0))).toBe(false);
  });

  it('follows the letters taught, in the book order', () => {
    expect(isWordAllowed('να', after(1))).toBe(false);
    expect(isWordAllowed('να', after(2))).toBe(true);
    expect(isWordAllowed('πίτα', after(5))).toBe(true);
    expect(isWordAllowed('μήλα', after(9))).toBe(false);
  });

  it('lets sight words through from their unit on', () => {
    expect(isWordAllowed('έχει', after(1))).toBe(true);
    expect(isWordAllowed('Έχει', after(1))).toBe(true);
  });

  it('keeps clusters locked until unit 4 unlocks them, whatever the letters', () => {
    expect(isWordAllowed('στο', after(9))).toBe(false);
    expect(isWordAllowed('στο', after(28))).toBe(true);
  });

  it('checks every word of a sentence, and lets numbers through', () => {
    expect(isTextAllowed('Η Άννα έχει 3 μήλα.', after(ALL))).toBe(true);
    expect(isTextAllowed('Η Άννα έχει 3 μήλα.', after(9))).toBe(false);
    expect(isTextAllowed('3 + 4 = 7', after(0))).toBe(true);
  });
});
