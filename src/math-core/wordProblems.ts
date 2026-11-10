// Word problems (PRD §9): text only from a template and the lexicon. Every form is
// written out in the lexicon; nothing here builds a Greek word. The problems the app
// plays are exactly the golden ones the parent approved, each recorded whole.
//
// Every object is neuter, so a number reads the same in any slot: no gender to agree.

import { mulberry32, randInt, pick } from '../engine/rng.ts';
import type { SkillId } from '../engine/types.ts';
import { numberToGreekWords } from './greekWords.ts';

export type Operation = 'add' | 'subtract' | 'missing';

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
  answer: number;
  /** the pictures: the first object for a, the second (if any) for b */
  objects: string[];
  /** on screen, with digits */
  text: string;
  /** what the clip says, numbers as words */
  speech: string;
}

export const answerOf = (operation: Operation, a: number, b: number): number => (operation === 'add' ? a + b : operation === 'subtract' ? a - b : b - a);

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('el') + s.slice(1);

interface Choice {
  person: Person;
  other: Person;
  object: LexObject;
  object2: LexObject;
  a: number;
  b: number;
}

function render(template: string, c: Choice, spoken: boolean): string {
  const number = (n: number) => (spoken ? numberToGreekWords(n, 'n', 'nom') : String(n));
  const filled = template.replace(/\{(\w+)(?::(\w+))?\}/g, (slot, name: string, form?: string) => {
    switch (name) {
      case 'a':
        return number(c.a);
      case 'b':
        return number(c.b);
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
      const answer = answerOf(t.operation, a, b);
      if (answer < t.result[0] || answer > t.result[1]) continue;
      const person = pick(lexicon.people, rng);
      const other = pick(lexicon.people.filter((p) => p !== person), rng);
      const object = pick(objects, rng);
      const object2 = pick(objects.filter((o) => o !== object), rng);
      const key = [a, b, object.id].join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      const choice = { person, other, object, object2, a, b };
      problems.push({
        id: [t.id, String(seen.size).padStart(2, '0')].join('-'),
        template: t.id,
        skill: t.skill as SkillId,
        operation: t.operation,
        a,
        b,
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
