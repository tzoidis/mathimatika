// The skill map (PRD §8): per chapter, how each skill practised in the app is going.
// No overall score or grade anywhere; only first attempts count, never speed.

import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { gradeContent, latestGenerators } from '../../app/curriculum.ts';
import { dayNumber, progressBySkill, reasonFor, type Reason, type SkillProgress, type SkillState } from '../../engine/adaptive.ts';
import type { SkillId } from '../../engine/types.ts';
import { t, type UiKey } from '../../i18n.ts';
import { formatNumber } from '../../math-core/format.ts';
import { generatorById } from '../../math-core/generators/index.ts';
import { resetProgress } from '../../storage/progress.ts';
import { localDate } from '../../storage/schema.ts';
import { useUpdateSettings } from './useSettings.ts';

/** Shape as well as words: never colour alone (PRD §7). */
const STATE_MARK: Record<SkillState, string> = { notStarted: '○', practising: '◔', stabilising: '◑', mastered: '●' };

function reasonText(reason: Reason): string {
  switch (reason.kind) {
    case 'due':
      return reason.days === 1 ? t('parent.skills.reason.dueOne') : t('parent.skills.reason.due', { n: formatNumber(reason.days) });
    case 'later':
      return reason.days === 1 ? t('parent.skills.reason.tomorrow') : t('parent.skills.reason.later', { n: formatNumber(reason.days) });
    default:
      return t(`parent.skills.reason.${reason.kind}` as UiKey);
  }
}

function lastText(lastDay: string, today: string): string {
  const days = dayNumber(today) - dayNumber(lastDay);
  return days === 0 ? t('parent.skills.last.today') : days === 1 ? t('parent.skills.last.yesterday') : t('parent.skills.last.days', { n: formatNumber(days) });
}

function SkillRow({ title, progress, reason, focused, onFocus, today }: { title: string; progress: SkillProgress | undefined; reason: Reason; focused: boolean; onFocus(): void; today: string }) {
  const state = progress?.state ?? 'notStarted';
  return (
    <li className="skill-row">
      <div className="skill-head">
        <span className="skill-mark" aria-hidden>
          {STATE_MARK[state]}
        </span>
        <strong className="grow-text">{title}</strong>
        <span className="skill-state">{t(`parent.skills.state.${state}` as UiKey)}</span>
      </div>
      {progress && progress.attempts > 0 && (
        <>
          <p className="help">
            {t(`parent.skills.stage.${progress.stage}` as UiKey)} · {t('parent.skills.helped', { n: formatNumber(progress.helped), total: formatNumber(progress.attempts) })} ·{' '}
            {lastText(progress.lastDay!, today)}
          </p>
          {progress.dominant && (
            <p className="help">
              {t('parent.skills.dominant', { given: progress.dominant.given, target: progress.dominant.target, kind: t(`parent.code.${progress.dominant.code}` as UiKey) })}
            </p>
          )}
        </>
      )}
      <p className="help">{reasonText(reason)}</p>
      {focused ? (
        <p className="help">{t('parent.skills.focused')}</p>
      ) : (
        <button type="button" className="parent-button" onClick={onFocus}>
          {t('parent.skills.focus')}
        </button>
      )}
    </li>
  );
}

export function SkillMapSection() {
  const { db, child, settings } = useApp();
  const update = useUpdateSettings();
  const [progress, setProgress] = useState<Map<SkillId, SkillProgress> | null>(null);
  const [message, setMessage] = useState<UiKey | null>(null);

  const load = () =>
    void db.answers
      .where('childId')
      .equals(child.id)
      .toArray()
      .then((answers) => setProgress(progressBySkill(answers, (id) => generatorById(id)?.skill, localDate)));
  useEffect(load, [db, child.id]);

  const content = gradeContent(settings.grade);
  if (!content || !progress) return null;
  const today = localDate(Date.now());
  const last = content.curriculum.units.find((u) => u.id === settings.upToUnit);
  const current = new Set(latestGenerators(settings.grade, settings.upToUnit).map((g) => g.skill));
  const inApp = (id: SkillId) => (content.graph.skills.find((s) => s.id === id)?.generators.length ?? 0) > 0;
  const units = last ? content.curriculum.units.filter((u) => u.order <= last.order && u.skills.some(inApp)) : [];
  const titleOf = (id: SkillId) => content.graph.skills.find((s) => s.id === id)?.title ?? id;

  const reset = async () => {
    if (!window.confirm(t('parent.skills.reset.confirm'))) return;
    await resetProgress(db);
    setMessage('parent.skills.reset.done');
    load();
  };

  return (
    <section className="parent-card">
      <h2>{t('parent.section.skills')}</h2>
      <p className="help">{t('parent.skills.help')}</p>
      {units.length === 0 && <p>{t('parent.skills.none')}</p>}
      {units.map((unit, i) => (
        <details key={unit.id} open={i === units.length - 1}>
          <summary>{unit.title}</summary>
          <ul className="skill-rows">
            {unit.skills.filter(inApp).map((id) => (
              <SkillRow
                key={id}
                title={titleOf(id)}
                progress={progress.get(id)}
                reason={reasonFor(progress.get(id), { focus: settings.focusSkill === id, current: current.has(id), today })}
                focused={settings.focusSkill === id}
                onFocus={() => void update({ focusSkill: id })}
                today={today}
              />
            ))}
          </ul>
        </details>
      ))}
      <div className="field">
        <span className="help">{t('parent.skills.reset.help')}</span>
        <span className="field-row">
          <button type="button" className="parent-button" onClick={() => void reset()}>
            {t('parent.skills.reset')}
          </button>
        </span>
        {message && <p className="help">{t(message)}</p>}
      </div>
    </section>
  );
}
