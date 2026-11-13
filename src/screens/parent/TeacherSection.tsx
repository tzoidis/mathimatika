// Observations to talk over with the teacher (PRD §8): only what has lasted, in plain
// words, never a diagnosis, always with the same careful sentence.

import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { teacherSignals, type Signal } from '../../engine/signals.ts';
import { t, type UiKey } from '../../i18n.ts';

export function TeacherSection() {
  const { db, child, settings } = useApp();
  const [signals, setSignals] = useState<Signal[] | null>(null);

  useEffect(() => {
    void db.answers
      .where('childId')
      .equals(child.id)
      .toArray()
      .then((all) => setSignals(teacherSignals(all)));
  }, [db, child.id]);

  if (signals === null || settings.grade > 2) return null;

  return (
    <section className="parent-card">
      <h2>{t('parent.section.teacher')}</h2>
      <p className="help">{t('parent.teacher.help')}</p>
      {signals.length === 0 ? (
        <p className="help">{t('parent.teacher.none')}</p>
      ) : (
        <>
          <ul className="teacher-list">
            {signals.map((s) => (
              <li key={s.kind}>{t(`parent.teacher.${s.kind}` as UiKey)}</li>
            ))}
          </ul>
          <p>{t('parent.teacher.note')}</p>
        </>
      )}
    </section>
  );
}
