// The parent screen at a glance: where the class is, today's play, and at most two
// skills worth practising. Everything else is folded underneath.

import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { gradeContent } from '../../app/curriculum.ts';
import { counts, isDue, progressBySkill, type SkillProgress } from '../../engine/adaptive.ts';
import type { AnswerLog, SkillId } from '../../engine/types.ts';
import { t, type UiKey } from '../../i18n.ts';
import { formatNumber } from '../../math-core/format.ts';
import { generatorById } from '../../math-core/generators/index.ts';
import { localDate } from '../../storage/schema.ts';
import { useUpdateSettings } from './useSettings.ts';

/** How many skills the card suggests. */
const SUGGESTED = 2;

/** A usual mistake first, the latest first; then what is due for review, the longest overdue first. */
export function worthPractising(progress: Iterable<SkillProgress>, today: string): SkillProgress[] {
  const all = [...progress];
  const mistakes = all.filter((p) => p.dominant).sort((a, b) => (b.lastDay ?? '').localeCompare(a.lastDay ?? ''));
  const due = all.filter((p) => !p.dominant && isDue(p, today)).sort((a, b) => a.dueDay!.localeCompare(b.dueDay!));
  return [...mistakes, ...due].slice(0, SUGGESTED);
}

export function TodaySection() {
  const { db, child, settings } = useApp();
  const update = useUpdateSettings();
  const [answers, setAnswers] = useState<AnswerLog[] | null>(null);

  useEffect(() => {
    void db.answers.where('childId').equals(child.id).toArray().then(setAnswers);
  }, [db, child.id]);

  const content = gradeContent(settings.grade);
  if (!answers || !content) return null;
  const today = localDate(Date.now());
  const unit = content.curriculum.units.find((u) => u.id === settings.upToUnit);
  const todays = answers.filter((a) => counts(a) && localDate(a.ts) === today);
  const helped = todays.filter((a) => !a.correct).length;
  const progress = progressBySkill(answers, (id) => generatorById(id)?.skill, localDate);
  const suggested = worthPractising(progress.values(), today);
  const titleOf = (id: SkillId) => content.graph.skills.find((s) => s.id === id)?.title ?? id;

  return (
    <section className="parent-card today">
      <h2>{t('parent.today.title')}</h2>
      <p>{unit ? t('parent.today.chapter', { unit: unit.title }) : t('parent.today.noChapter')}</p>
      <p>{todays.length === 0 ? t('parent.today.notPlayed') : t('parent.today.played', { n: formatNumber(todays.length), helped: formatNumber(helped) })}</p>
      <h3>{t('parent.today.practise')}</h3>
      {suggested.length === 0 ? (
        <p className="help">{t('parent.today.nothing')}</p>
      ) : (
        <ul className="skill-rows">
          {suggested.map((p) => (
            <li key={p.skill} className="skill-row">
              <strong>{titleOf(p.skill)}</strong>
              <p className="help">
                {p.dominant
                  ? t('parent.skills.dominant', { given: p.dominant.given, target: p.dominant.target, kind: t(`parent.code.${p.dominant.code}` as UiKey) })
                  : t('parent.today.due')}
              </p>
              {settings.focusSkill === p.skill ? (
                <p className="help">{t('parent.skills.focused')}</p>
              ) : (
                <button type="button" className="parent-button" onClick={() => void update({ focusSkill: p.skill })}>
                  {t('parent.skills.focus')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
