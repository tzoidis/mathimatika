// Word problems (PRD §9): text only from a template and the lexicon. Every form is
// written out in the lexicon; nothing here builds a Greek word. The problems the app
// plays are exactly the golden ones the parent approved, each recorded whole.
//
// Every object is neuter, so a number reads the same in any slot: no gender to agree.

import { mulberry32, randInt, pick } from '../engine/rng.ts';
import type { SkillId } from '../engine/types.ts';
import { numberToGreekWords } from './greekWords.ts';

/** twoStep: a come, b more come, c go away (the book's car park, ch. 50) */
export type Operation = 'add' | 'subtract' | 'missing' | 'twoStep' | 'multiply' | 'divide';

export interface Person {
  id: string;
  nom: string;
  to: string;
}

export interface LexObject {
  id: string;
  one: string;
  many: string;
  kind: string;
}

export interface Lexicon {
  people: Person[];
  objects: LexObject[];
}

export interface Template {
  id: string;
  /** for the parent's copy of the golden file */
  title: string;
  skill: string;
  operation: Operation;
  objects: string;
  a: [number, number];
  b: [number, number];
  /** the third number of a two-step problem */
  c?: [number, number];
  /** the units must cross ten: 14 − 5, never 15 − 4 */
  bridge?: boolean;
  result: [number, number];
  text: string;
}

export interface TemplateFile {
  versions: number;
  templates: Template[];
}

export interface WordProblem {
  id: string;
  template: string;
  skill: SkillId;
  operation: Operation;
  a: number;
  b: number;
  /** only in a two-step problem */
  c?: number;
  answer: number;
  /** the pictures: the first object for a, the second (if any) for b */
  objects: string[];
  /** on screen, with digits */
  text: string;
  /** what the clip says, numbers as words */
  speech: string;
}

export function answerOf(operation: Operation, a: number, b: number, c = 0): number {
  switch (operation) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'missing':
      return b - a;
    case 'twoStep':
      return a + b - c;
    case 'multiply':
      return a * b;
    case 'divide':
      return a / b;
  }
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('el') + s.slice(1);

interface Choice {
  person: Person;
  other: Person;
  object: LexObject;
  object2: LexObject;
  a: number;
  b: number;
  c: number;
}

/** In a subtraction that must cross ten, the units of a are fewer than b. */
const crossesTen = (t: Template, a: number, b: number) => !t.bridge || (t.operation === 'subtract' ? b > a % 10 : (a % 10) + b >= 10);

function render(template: string, c: Choice, spoken: boolean): string {
  // «σε 3 φίλους» is said «σε τρεις φίλους»: {b:macc}
  const number = (n: number, form?: string) => (!spoken ? String(n) : form === 'macc' ? numberToGreekWords(n, 'm', 'acc') : numberToGreekWords(n, 'n', 'nom'));
  const filled = template.replace(/\{(\w+)(?::(\w+))?\}/g, (slot, name: string, form?: string) => {
    switch (name) {
      case 'a':
        return number(c.a, form);
      case 'b':
        return number(c.b, form);
      case 'c':
        return number(c.c, form);
      case 'P':
        return c.person.nom;
      case 'Q':
        return c.other.to;
      case 'O':
      case 'O2': {
        const o = name === 'O' ? c.object : c.object2;
        if (form === 'many') return o.many;
        return (form === 'a' ? c.a : c.b) === 1 ? o.one : o.many;
      }
      default:
        throw new Error(`unknown slot ${slot}`);
    }
  });
  // a capital at the start of every sentence: «η Άννα» opens one as «Η Άννα»
  return filled.replace(/(^|[.;!]\s+)(\p{Ll})/gu, (_m, before: string, letter: string) => before + capitalize(letter));
}

/** A stable id for a template, to seed its own random stream. */
function seedOf(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0;
  return h;
}

export const goldenHash = (problems: readonly WordProblem[]): string => seedOf(JSON.stringify(problems)).toString(16);

const MAX_TRIES = 5000;

/** The golden versions of every template: deterministic, so the file can be checked. */
export function generateGolden(file: TemplateFile, lexicon: Lexicon): WordProblem[] {
  const problems: WordProblem[] = [];
  for (const t of file.templates) {
    const rng = mulberry32(seedOf(t.id));
    const objects = lexicon.objects.filter((o) => o.kind === t.objects);
    const seen = new Set<string>();
    for (let tries = 0; seen.size < file.versions && tries < MAX_TRIES; tries++) {
      const a = randInt(t.a[0], t.a[1], rng);
      const b = randInt(t.b[0], t.b[1], rng);
      const third = t.c ? randInt(t.c[0], t.c[1], rng) : 0;
      const answer = answerOf(t.operation, a, b, third);
      if (!Number.isInteger(answer) || answer < t.result[0] || answer > t.result[1] || !crossesTen(t, a, b)) continue;
      const person = pick(lexicon.people, rng);
      const other = pick(lexicon.people.filter((p) => p !== person), rng);
      const object = pick(objects, rng);
      const object2 = pick(objects.filter((o) => o !== object), rng);
      const key = [a, b, third, object.id].join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      const choice = { person, other, object, object2, a, b, c: third };
      problems.push({
        id: [t.id, String(seen.size).padStart(2, '0')].join('-'),
        template: t.id,
        skill: t.skill as SkillId,
        operation: t.operation,
        a,
        b,
        ...(t.c ? { c: third } : {}),
        answer,
        objects: t.text.includes('{O2') ? [object.id, object2.id] : [object.id],
        text: render(t.text, choice, false),
        speech: render(t.text, choice, true),
      });
    }
    if (seen.size < file.versions) throw new Error(`${t.id}: only ${seen.size} different versions`);
  }
  return problems;
}
