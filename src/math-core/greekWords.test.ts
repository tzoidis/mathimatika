import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { numberToGreekWords as w, type Gender, type GrammaticalCase } from './greekWords.ts';

describe('numberToGreekWords', () => {
  it.each<[number, Gender, GrammaticalCase, string]>([
    [0, 'n', 'nom', 'μηδέν'],
    [1, 'n', 'nom', 'ένα'],
    [1, 'f', 'nom', 'μία'],
    [1, 'm', 'nom', 'ένας'],
    [1, 'm', 'acc', 'έναν'],
    [1, 'm', 'gen', 'ενός'],
    [1, 'f', 'gen', 'μίας'],
    [2, 'f', 'nom', 'δύο'],
    [3, 'n', 'nom', 'τρία'],
    [3, 'f', 'nom', 'τρεις'],
    [3, 'm', 'acc', 'τρεις'],
    [3, 'n', 'gen', 'τριών'],
    [4, 'n', 'nom', 'τέσσερα'],
    [4, 'f', 'nom', 'τέσσερις'],
    [4, 'f', 'gen', 'τεσσάρων'],
    [7, 'n', 'nom', 'επτά'],
    [8, 'n', 'nom', 'οκτώ'],
    [9, 'n', 'nom', 'εννέα'],
    [11, 'f', 'nom', 'έντεκα'],
    [12, 'f', 'nom', 'δώδεκα'],
    [13, 'n', 'nom', 'δεκατρία'],
    [13, 'f', 'nom', 'δεκατρείς'],
    [14, 'n', 'nom', 'δεκατέσσερα'],
    [14, 'm', 'nom', 'δεκατέσσερις'],
    [16, 'n', 'nom', 'δεκαέξι'],
    [17, 'n', 'nom', 'δεκαεπτά'],
    [19, 'n', 'nom', 'δεκαεννέα'],
    [20, 'n', 'nom', 'είκοσι'],
    [21, 'n', 'nom', 'είκοσι ένα'],
    [21, 'f', 'nom', 'είκοσι μία'],
    [21, 'm', 'acc', 'είκοσι έναν'],
    [33, 'f', 'nom', 'τριάντα τρεις'],
    [34, 'n', 'nom', 'τριάντα τέσσερα'],
    [90, 'n', 'nom', 'ενενήντα'],
    [100, 'n', 'nom', 'εκατό'],
    [100, 'f', 'nom', 'εκατό'],
    [101, 'n', 'nom', 'εκατόν ένα'],
    [101, 'f', 'nom', 'εκατόν μία'],
    [120, 'n', 'nom', 'εκατόν είκοσι'],
    [200, 'n', 'nom', 'διακόσια'],
    [200, 'f', 'nom', 'διακόσιες'],
    [200, 'm', 'nom', 'διακόσιοι'],
    [200, 'm', 'acc', 'διακόσιους'],
    [201, 'f', 'nom', 'διακόσιες μία'],
    [305, 'n', 'nom', 'τριακόσια πέντε'],
    [1000, 'n', 'nom', 'χίλια'],
    [1000, 'f', 'nom', 'χίλιες'],
    [1000, 'm', 'nom', 'χίλιοι'],
    [1100, 'f', 'nom', 'χίλιες εκατό'],
    [1234, 'n', 'nom', 'χίλια διακόσια τριάντα τέσσερα'],
    [2000, 'n', 'nom', 'δύο χιλιάδες'],
    [3000, 'n', 'nom', 'τρεις χιλιάδες'],
    [3000, 'n', 'gen', 'τριών χιλιάδων'],
    [4001, 'n', 'nom', 'τέσσερις χιλιάδες ένα'],
    [21000, 'n', 'nom', 'είκοσι μία χιλιάδες'],
    [100000, 'n', 'nom', 'εκατό χιλιάδες'],
    [120000, 'n', 'nom', 'εκατόν είκοσι χιλιάδες'],
    [200000, 'n', 'nom', 'διακόσιες χιλιάδες'],
    [1000000, 'n', 'nom', 'ένα εκατομμύριο'],
    [1000000, 'f', 'nom', 'ένα εκατομμύριο'],
    [1000000, 'n', 'gen', 'ενός εκατομμυρίου'],
    [3000000, 'f', 'nom', 'τρία εκατομμύρια'],
    [1001000, 'n', 'nom', 'ένα εκατομμύριο χίλια'],
    [2000000000, 'n', 'nom', 'δύο δισεκατομμύρια'],
    [-3, 'n', 'nom', 'μείον τρία'],
    [-10, 'n', 'nom', 'μείον δέκα'],
  ])('%d %s %s is %s', (n, gender, gramCase, text) => {
    expect(w(n, gender, gramCase)).toBe(text);
  });

  it('refuses a float and numbers it has no words for', () => {
    expect(() => w(1.5)).toThrow(RangeError);
    expect(() => w(10n ** 12n)).toThrow(RangeError);
  });

  // An independent reader: turns the words back into the number, without using the
  // code or the content file above, so a mistake in either shows up here.
  const VALUES: Record<string, number> = {
    μηδέν: 0, ένα: 1, ένας: 1, έναν: 1, μία: 1, ενός: 1, μίας: 1, δύο: 2, τρία: 3, τρεις: 3, τριών: 3, τέσσερα: 4, τέσσερις: 4, τεσσάρων: 4, πέντε: 5, έξι: 6, επτά: 7, οκτώ: 8, εννέα: 9,
    δέκα: 10, έντεκα: 11, δώδεκα: 12, δεκατρία: 13, δεκατρείς: 13, δεκατριών: 13, δεκατέσσερα: 14, δεκατέσσερις: 14, δεκατεσσάρων: 14, δεκαπέντε: 15, δεκαέξι: 16, δεκαεπτά: 17, δεκαοκτώ: 18, δεκαεννέα: 19,
    είκοσι: 20, τριάντα: 30, σαράντα: 40, πενήντα: 50, εξήντα: 60, εβδομήντα: 70, ογδόντα: 80, ενενήντα: 90, εκατό: 100, εκατόν: 100,
  };
  const HUNDREDS: [string, number][] = [['διακ', 200], ['τριακ', 300], ['τετρακ', 400], ['πεντακ', 500], ['εξακ', 600], ['επτακ', 700], ['οκτακ', 800], ['εννιακ', 900]];

  function read(text: string): number {
    let total = 0;
    let group = 0;
    for (const word of text.split(' ')) {
      if (word in VALUES) group += VALUES[word]!;
      else if (word.startsWith('χίλι') || word === 'χιλίων') total += 1000;
      else if (word.startsWith('χιλιάδ')) {
        total += group * 1000;
        group = 0;
      } else {
        const hundred = HUNDREDS.find(([stem]) => word.startsWith(stem));
        if (!hundred) throw new Error(`unknown word ${word}`);
        group += hundred[1];
      }
    }
    return total + group;
  }

  it('says every number from 0 to 999.999 so that it reads back the same, in every gender and case', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999999 }), fc.constantFrom<Gender>('m', 'f', 'n'), fc.constantFrom<GrammaticalCase>('nom', 'gen', 'acc'), (n, gender, gramCase) => {
        const text = w(n, gender, gramCase);
        expect(read(text)).toBe(n);
        expect(text).toBe(text.normalize('NFC'));
        expect(text).not.toMatch(/\s{2}|^\s|\s$/);
      }),
      { numRuns: 5000 },
    );
  });

  it('covers 0-100 in full', () => {
    for (let n = 0; n <= 100; n++) for (const g of ['m', 'f', 'n'] as const) expect(read(w(n, g, 'nom'))).toBe(n);
  });

  it('agrees in gender only where Greek does: numbers ending in 1, 3 or 4', () => {
    for (let n = 0; n <= 100; n++) {
      const varies = n % 10 === 1 ? n !== 11 : n % 10 === 3 || n % 10 === 4;
      expect(w(n, 'n') !== w(n, 'f')).toBe(varies);
    }
  });
});
