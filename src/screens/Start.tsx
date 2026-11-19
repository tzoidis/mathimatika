// «Πάμε!»: the tap that unlocks audio (browsers block sound before a gesture).
// No round is running here, so a waiting app update is applied on this screen.
// The parent usually sees this screen first, so the way to the settings is here in words.

import { useEffect } from 'react';
import { useApp } from '../app/AppContext.tsx';
import { installUpdate, useUpdateReady } from '../app/appUpdate.ts';
import { t } from '../i18n.ts';
import { LockIcon } from '../ui/Icons.tsx';
import { Mascot } from '../ui/Mascot.tsx';

export function Start({ onGo, onParent }: { onGo(): void; onParent(): void }) {
  const { audio, recheckVoice, settings } = useApp();
  // until the parent says where the class is, the rounds have no maths in them
  const firstRun = settings.upToUnit === null;
  const updateReady = useUpdateReady();

  useEffect(() => {
    if (updateReady) installUpdate();
  }, [updateReady]);

  return (
    <main className="screen screen--center start">
      <Mascot mood="happy" size={220} />
      <button
        type="button"
        className="go"
        onClick={() => {
          audio.unlock();
          recheckVoice();
          // played inside the tap: browsers allow sound only from a user gesture
          void audio.play({ kind: 'instruction', key: 'welcome' });
          onGo();
        }}
      >
        {t('start.go')}
      </button>
      <div className="parent-entry">
        {firstRun && (
          <div className="first-run">
            <strong>{t('start.firstRun.title')}</strong>
            <p>{t('start.firstRun.body')}</p>
          </div>
        )}
        <button type="button" className={`parent-button ${firstRun ? 'primary' : ''}`} onClick={onParent}>
          <LockIcon />
          {t('start.parent')}
        </button>
      </div>
    </main>
  );
}
