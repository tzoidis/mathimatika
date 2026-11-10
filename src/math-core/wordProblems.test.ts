import { describe, expect, it } from 'vitest';
import golden from '../content/word-problems.golden.json';
import lexicon from '../content/lexicon.json';
import templates from '../content/word-problems.json';
import { isTextAllowed, LETTER_UNITS, readingContext } from '../engine/reading/allowedWords.ts';
import { GOLDEN_PROBLEMS } from './generators/story.ts';
import { answerOf, generateGolden, type Lexicon, type TemplateFile, type WordProblem } from './wordProblems.ts';

const problems = golden.problems as WordProblem[];
const ALL_LETTERS = LETTER_UNITS.reduce((n, u) => n + u.graphemes.length, 0);

describe('the golden word problems', () => {
  it('are exactly what the templates make, every time', () => {
    const once = generateGolden(templates as TemplateFile, lexicon as Lexicon);
    expect(generateGolden(templates as TemplateFile, lexicon as Lexicon)).toEqual(once);
    expect(once).toEqual(problems);
  });

  it('are 20 different versions of each template', () => {
    for (const t of templates.templates) {
      const versions = problems.filter((p) => p.template === t.id);
      expect(versions).toHaveLength(templates.versions);
      expect(new Set(versions.map((p) => p.text)).size).toBe(versions.length);
    }
  });

  it('have answers that the numbers in the text give, within the template range', () => {
    for (const p of problems) {
      const t = templates.templates.find((x) => x.id === p.template)!;
      const numbers = (p.text.match(/\d+/g) ?? []).map(Number);
      expect(numbers.sort((x, y) => x - y)).toEqual([p.a, p.b].sort((x, y) => x - y));
      expect(answerOf(p.operation, p.a, p.b)).toBe(p.answer);
      expect(p.answer).toBeGreaterThanOrEqual(t.result[0]!);
      expect(p.answer).toBeLessThanOrEqual(t.result[1]!);
    }
  });

  it('say every number in words and leave no slot unfilled', () => {
    for (const p of problems) {
      expect(p.speech).not.toMatch(/\d|\{|\}/);
      expect(p.text).not.toMatch(/\{|\}/);
      expect(p.text).toBe(p.text.normalize('NFC'));
      expect(p.text.charAt(0)).toBe(p.text.charAt(0).toLocaleUpperCase('el'));
    }
  });

  it('use the singular for one and the plural for more', () => {
    const join = problems.filter((p) => p.template === 'join');
    for (const p of join) {
      const object = lexicon.objects.find((o) => o.id === p.objects[0])!;
      expect(p.text).toContain(['έχει', p.a, (p.a === 1 ? object.one : object.many) + '.'].join(' '));
    }
    expect(problems.find((p) => p.id === 'join-03')?.text).toBe('Η Άννα έχει 1 μήλο. Παίρνει 3 ακόμα. Πόσα μήλα έχει τώρα;');
  });

  it('are hidden as text until the child can read them, and shown once every letter is taught', () => {
    for (const p of problems) {
      expect(isTextAllowed(p.text, readingContext(0))).toBe(false);
      expect(isTextAllowed(p.text, readingContext(ALL_LETTERS)), p.text).toBe(true);
    }
  });

  it('are what the generators play', () => {
    expect(GOLDEN_PROBLEMS).toEqual(problems);
  });
});
