// Home activities (PRD §3): what needs real things (a ruler, water, a scale) is done at
// home, tied to its chapter, and the parent ticks it. Nothing is scored.

import { useApp } from '../../app/AppContext.tsx';
import { gradeContent } from '../../app/curriculum.ts';
import { reachedActivities } from '../../app/homeActivities.ts';
import { t } from '../../i18n.ts';
import { useUpdateSettings } from './useSettings.ts';

export function HomeSection() {
  const { settings } = useApp();
  const update = useUpdateSettings();
  const content = gradeContent(settings.grade);
  if (!content) return null;
  const activities = reachedActivities(settings.grade, content.curriculum, settings.upToUnit);

  const toggle = (id: string) => {
    const done = settings.homeDone.includes(id) ? settings.homeDone.filter((d) => d !== id) : [...settings.homeDone, id];
    void update({ homeDone: done });
  };

  return (
    <section className="parent-card">
      <h2>{t('parent.section.home')}</h2>
      <p className="help">{t('parent.home.help')}</p>
      {activities.length === 0 && <p className="help">{t('parent.home.empty')}</p>}
      <ul className="home-list">
        {activities.map((a) => {
          const done = settings.homeDone.includes(a.id);
          return (
            <li key={a.id} className="home-card">
              <div className="skill-head">
                <span className="skill-mark" aria-hidden>
                  {done ? '✓' : '○'}
                </span>
                <strong className="grow-text">{a.title}</strong>
                <span className="skill-state">{t('parent.home.chapter', { n: a.unit })}</span>
              </div>
              <p>{a.text}</p>
              <button type="button" className={`parent-button ${done ? 'selected' : ''}`} aria-pressed={done} onClick={() => toggle(a.id)}>
                {t('parent.home.done')}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
