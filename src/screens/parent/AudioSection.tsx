// Sound status: the device voice, any clip missing, and a button to hear one.

import { useApp } from '../../app/AppContext.tsx';
import { bundledKeys } from '../../audio/bundled.ts';
import { requiredRecordings } from '../../audio/recordings.ts';
import { t } from '../../i18n.ts';

export function AudioSection() {
  const { audio, voice } = useApp();
  const bundled = new Set(bundledKeys());
  const missing = requiredRecordings().filter((r) => !bundled.has(r.key)).length;

  return (
    <section className="parent-card">
      <h2>{t('parent.section.audio')}</h2>
      <p>{voice ? t('parent.audio.voice', { name: `${voice.name} (${voice.lang})` }) : t('parent.audio.noVoice')}</p>
      <p className={missing ? 'warn-text' : ''}>{missing ? t('parent.audio.missing', { n: missing }) : t('parent.audio.complete')}</p>
      <button
        type="button"
        className="parent-button"
        onClick={() => {
          audio.unlock();
          void audio.play({ kind: 'instruction', key: 'welcome' });
        }}
      >
        {t('parent.audio.test')}
      </button>
    </section>
  );
}
