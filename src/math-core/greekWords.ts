// Numbers as Greek words, for the voice (PRD §7, §9): TTS and clips read numbers
// correctly only as words with the right gender («τρία μήλα», «τρεις γάτες»). Every
// form is written out in content/numberWords.json; none is derived by rule.

import words from '../content/numberWords.json' with { type: 'json' };

export type Gender = 'm' | 'f' | 'n';
export type GrammaticalCase = 'nom' | 'gen' | 'acc';

type Inflected = Record<GrammaticalCase, Record<Gender, string>>;
type Entry = string | Inflected;

const MAX = 10n ** 12n;

const form = (entry: Entry, gender: Gender, gramCase: GrammaticalCase): string => (typeof entry === 'string' ? entry : entry[gramCase][gender]);

const small = words.small as Record<string, Entry>;
const tens = words.tens as Record<string, string>;
const hundreds = words.hundreds as Record<string, Entry>;

/** 1 to 999, agreeing with its noun. */
function underThousand(n: number, gender: Gender, gramCase: GrammaticalCase): string[] {
  const parts: string[] = [];
  const h = n - (n % 100);
  const rest = n % 100;
  if (h === 100) parts.push(rest === 0 ? words.hundred.exact : words.hundred.before);
  else if (h > 0) parts.push(form(hundreds[h]!, gender, gramCase));
  if (rest === 0) return parts;
  if (rest < 20) {
    parts.push(form(small[rest]!, gender, gramCase));
  } else {
    parts.push(tens[rest - (rest % 10)]!);
    if (rest % 10 > 0) parts.push(form(small[rest % 10]!, gender, gramCase));
  }
  return parts;
}

/** A count of millions or billions: the count is neuter, like the noun. */
function scale(count: number, noun: { one: Record<GrammaticalCase, string>; many: Record<GrammaticalCase, string> }, gramCase: GrammaticalCase): string[] {
  return [...underThousand(count, 'n', gramCase), count === 1 ? noun.one[gramCase] : noun.many[gramCase]];
}

/**
 * numberToGreekWords(3, 'f') is «τρεις», (3, 'n') is «τρία», (201, 'f', 'acc') is
 * «διακόσιες μία». The gender is the noun's; «χιλιάδες» takes a feminine count
 * and «εκατομμύρια» a neuter one, whatever the noun. Whole numbers below 10^12.
 */
export function numberToGreekWords(value: bigint | number, gender: Gender = 'n', gramCase: GrammaticalCase = 'nom'): string {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new RangeError('only whole numbers have words here');
  const big = BigInt(value);
  if (big === 0n) return words.zero;
  const abs = big < 0n ? -big : big;
  if (abs >= MAX) throw new RangeError('number too large');

  const billions = Number(abs / 10n ** 9n);
  const millions = Number((abs / 10n ** 6n) % 1000n);
  const thousands = Number((abs / 1000n) % 1000n);
  const rest = Number(abs % 1000n);

  const parts: string[] = [];
  if (big < 0n) parts.push(words.minus);
  if (billions > 0) parts.push(...scale(billions, words.billion, gramCase));
  if (millions > 0) parts.push(...scale(millions, words.million, gramCase));
  if (thousands === 1) parts.push(form(words.oneThousand, gender, gramCase));
  else if (thousands > 1) parts.push(...underThousand(thousands, 'f', gramCase), words.thousands[gramCase]);
  if (rest > 0) parts.push(...underThousand(rest, gender, gramCase));
  return parts.join(' ');
}
