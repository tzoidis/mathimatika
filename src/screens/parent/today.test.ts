import { describe, expect, it } from 'vitest';
import type { SkillProgress } from '../../engine/adaptive.ts';
import type { SkillId } from '../../engine/types.ts';
import { worthPractising } from './TodaySection.tsx';

const p = (skill: string, more: Partial<SkillProgress>): SkillProgress => ({
  skill: skill as SkillId,
  stage: 1,
  state: 'practising',
  attempts: 5,
  helped: 1,
  days: 3,
  lastDay: '2026-01-05',
  dueDay: '2026-01-20',
  dominant: null,
  ...more,
});

describe('the card at a glance', () => {
  it('suggests a usual mistake first, then what is longest overdue, two at most', () => {
    const mistake = p('a', { dominant: { code: 'OFF_BY_ONE', given: '4', target: '5' } });
    const due = p('b', { dueDay: '2026-01-08' });
    const overdue = p('c', { dueDay: '2026-01-02' });
    const later = p('d', {});
    expect(worthPractising([later, due, overdue, mistake], '2026-01-10').map((x) => x.skill)).toEqual(['a', 'c']);
    expect(worthPractising([later], '2026-01-10')).toEqual([]);
  });
});
