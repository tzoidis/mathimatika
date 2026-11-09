// «Up to which chapter» and «reads up to letter» (PRD §8).

import { useApp } from '../../app/AppContext.tsx';
import { gradeContent, LETTER_UNITS } from '../../app/curriculum.ts';
import { skillAvailability } from '../../engine/curriculum.ts';
import type { SkillId, Unit } from '../../engine/types.ts';
import { t } from '../../i18n.ts';
import { useUpdateSettings } from './useSettings.ts';

/** Units under their headings, keeping book order. */
function bySection(units: Unit[]): [string, Unit[]][] {
  const sections = new Map<string, Unit[]>();
  for (const unit of units) sections.set(unit.section, [...(sections.get(unit.section) ?? []), unit]);
  return [...sections];
}

export function BookSection() {
  const { settings } = useApp();
  const update = useUpdateSettings();
  const content = gradeContent(settings.grade);
  if (!content) return null;

  const { graph, curriculum } = content;
  const { available, blocked } = skillAvailability(graph, curriculum, settings.upToUnit);
  const titleOf = (id: SkillId) => graph.skills.find((s) => s.id === id)?.title ?? id;

  return (
    <section className="parent-card">
      <h2>{t('parent.section.book')}</h2>
      <p className="help">{t('parent.book.help', { book: curriculum.book })}</p>
      <select className="book-select" value={settings.upToUnit ?? ''} onChange={(e) => void update({ upToUnit: e.target.value || null })}>
        <option value="">{t('parent.book.none')}</option>
        {bySection(curriculum.units).map(([section, units]) => (
          <optgroup key={section} label={section}>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {blocked.map(({ id, missing }) => (
        <p key={id} className="warn-text">
          {t('parent.book.blocked', { skill: titleOf(id), missing: missing.map(titleOf).join(', ') })}
        </p>
      ))}
      <p>{t('parent.book.available', { n: available.length, total: graph.skills.length })}</p>
      {available.length > 0 && (
        <details>
          <summary>{t('parent.book.list')}</summary>
          <ul className="skill-list">
            {available.map((id) => (
              <li key={id}>{titleOf(id)}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function LettersSection() {
  const { settings } = useApp();
  const update = useUpdateSettings();
  if (settings.grade > 2) return null;

  const position = settings.upToPosition;
  const setPosition = (p: number) => void update({ upToPosition: p });
  let taughtBefore = 0;

  return (
    <section className="parent-card">
      <h2>{t('parent.section.letters')}</h2>
      <p className="help">{t('parent.letters.help')}</p>
      <button type="button" className={`parent-button ${position === 0 ? 'selected' : ''}`} aria-pressed={position === 0} onClick={() => setPosition(0)}>
        {t('parent.letters.none')}
      </button>
      {LETTER_UNITS.map((unit) => {
        const start = taughtBefore;
        taughtBefore += unit.graphemes.length;
        return (
          <div key={unit.title} className="unit-row">
            <span className="unit-title">{unit.title}</span>
            <div className="letter-chips">
              {unit.graphemes.map((g, k) => {
                const p = start + k + 1;
                return (
                  <button
                    key={g}
                    type="button"
                    className={`letter-chip ${p <= position ? 'taught' : ''} ${p === position ? 'selected' : ''}`}
                    aria-pressed={p === position}
                    onClick={() => setPosition(p)}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
