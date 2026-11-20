// The device does not let the app store anything (private browsing, storage blocked, a
// full device). The parent is the one who can fix it, so this screen speaks to them.

import { t } from '../i18n.ts';
import { Mascot } from '../ui/Mascot.tsx';

export function StorageFailed() {
  return (
    <main className="screen screen--center start">
      <Mascot mood="thinking" />
      <div className="first-run">
        <strong>{t('start.failed.title')}</strong>
        <p>{t('start.failed.body')}</p>
      </div>
      <button type="button" className="parent-button primary" onClick={() => location.reload()}>
        {t('start.failed.retry')}
      </button>
    </main>
  );
}
