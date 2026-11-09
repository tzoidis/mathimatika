// Home: one big button starts the session. The Workshop joins it in ΜΘ5.

import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext.tsx';
import { t } from '../i18n.ts';
import { getDailyTime } from '../storage/db.ts';
import { IconButton } from '../ui/IconButton.tsx';
import { LockIcon, NextIcon } from '../ui/Icons.tsx';
import { Mascot } from '../ui/Mascot.tsx';

export function Home({ onPlay, onParent }: { onPlay(): void; onParent(): void }) {
  const { db, child, settings, audio } = useApp();
  const [limitReached, setLimitReached] = useState<boolean | null>(null);

  useEffect(() => {
    void getDailyTime(db, child.id).then((ms) => setLimitReached(ms >= settings.dailyLimitMinutes * 60_000));
  }, [db, child.id, settings.dailyLimitMinutes]);

  useEffect(() => {
    if (!limitReached) return;
    void audio.play({ kind: 'instruction', key: 'see-you-tomorrow' });
    return () => audio.stop();
  }, [limitReached, audio]);

  if (limitReached === null) return <main className="screen" />;

  return (
    <main className="screen home">
      <div className="top-bar">
        <button type="button" className="parent-lock" aria-label={t('nav.parent')} onClick={onParent}>
          <LockIcon />
        </button>
      </div>
      {limitReached ? (
        <div className="screen--center grow">
          <Mascot mood="encouraging" size={240} />
        </div>
      ) : (
        <div className="home-body">
          <Mascot mood="happy" size={200} />
          <IconButton label={t('nav.play')} variant="primary" onClick={onPlay}>
            <NextIcon />
          </IconButton>
        </div>
      )}
    </main>
  );
}
