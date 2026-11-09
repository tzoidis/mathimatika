// Break between rounds. The Workshop items arrive in ΜΘ5.

import { useEffect } from 'react';
import { useApp } from '../app/AppContext.tsx';
import { t } from '../i18n.ts';
import { IconButton } from '../ui/IconButton.tsx';
import { NextIcon } from '../ui/Icons.tsx';
import { Mascot } from '../ui/Mascot.tsx';

export function BreakView({ onContinue }: { onContinue(): void }) {
  const { audio } = useApp();

  useEffect(() => {
    void audio.play({ kind: 'instruction', key: 'break' });
    return () => audio.stop();
  }, [audio]);

  return (
    <div className="break">
      <Mascot mood="happy" size={180} />
      <IconButton label={t('nav.next')} variant="primary" onClick={onContinue}>
        <NextIcon />
      </IconButton>
    </div>
  );
}
