import { describe, expect, it } from 'vitest';
import ui from '../content/ui.el.json';
import { MIN_ATTEMPTS, teacherSignals } from './signals.ts';
import type { AnswerLog } from './types.ts';

const DAY = 24 * 60 * 60 * 1000;
const JAN = new Date(2027, 0, 4).getTime();
const OCT = new Date(2026, 9, 5).getTime();

function answers(exerciseId: string, n: number, days: number, right: (i: number) => boolean, start = JAN, target = '3', given = '5'): AnswerLog[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i),
    childId: 'c',
    ts: start + Math.floor((i * days * DAY) / (n - 1)),
    exerciseId,
    itemId: 'x',
    target,
    given: right(i) ? target : given,
    correct: right(i),
    attempt: 1,
    soundsRight: false,
    usedListen: false,
    latencyMs: 1000,
    position: 0,
  }));
}

describe('observations for the teacher', () => {
  it('needs twenty attempts over three weeks', () => {
    expect(teacherSignals(answers('cmp.sign.to10', MIN_ATTEMPTS - 1, 30, () => false))).toEqual([]);
    expect(teacherSignals(answers('cmp.sign.to10', 30, 10, () => false))).toEqual([]);
    expect(teacherSignals(answers('cmp.sign.to10', 30, 25, () => false)).map((s) => s.kind)).toEqual(['compare']);
  });

  it('stays quiet once the child is getting better', () => {
    // wrong at first, right later: the later half is above 80%
    expect(teacherSignals(answers('cmp.sign.to10', 40, 30, (i) => i >= 20))).toEqual([]);
    // two in three right all along: an observation
    expect(teacherSignals(answers('cmp.sign.to10', 40, 30, (i) => i % 3 !== 0))).toHaveLength(1);
  });

  it('looks at seeing 1-4 at a glance only from January of the school year', () => {
    expect(teacherSignals(answers('subitize.to5', 30, 25, () => false, OCT))).toEqual([]);
    expect(teacherSignals(answers('subitize.to5', 30, 25, () => false, JAN)).map((s) => s.kind)).toEqual(['subitize']);
    // five is not one of 1-4
    expect(teacherSignals(answers('subitize.to5', 30, 25, () => false, JAN, '5', '4'))).toEqual([]);
  });

  it('counts only big misses on the line, and never asking for help', () => {
    expect(teacherSignals(answers('line.place.to20', 30, 25, () => false, JAN, '7', '8'))).toEqual([]);
    expect(teacherSignals(answers('line.place.to20', 30, 25, () => false, JAN, '7', '14')).map((s) => s.kind)).toEqual(['line']);
    const helped = answers('cmp.sign.to10', 30, 25, () => false).map((a) => ({ ...a, askedHelp: true as const }));
    expect(teacherSignals(helped)).toEqual([]);
  });

  it('never names a condition or a risk', () => {
    const texts = Object.entries(ui).filter(([k]) => k.startsWith('parent.teacher')).map(([, v]) => v);
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) expect(text).not.toMatch(/δυσαριθμ|δυσλεξ|κίνδυν|διάγνω|πρόβλημα/iu);
  });
});
