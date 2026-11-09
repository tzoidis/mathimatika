// One session: 3 rounds, breaks, daily time limit (PRD §6).

import { useEffect, useReducer } from 'react';
import { useApp } from '../app/AppContext.tsx';
import { sessionReducer, startSession } from '../engine/session.ts';
import { t } from '../i18n.ts';
import { addDailyTime } from '../storage/db.ts';
import { IconButton } from '../ui/IconButton.tsx';
import { HomeIcon, StarIcon } from '../ui/Icons.tsx';
import { Mascot } from '../ui/Mascot.tsx';
import { BreakView } from './BreakView.tsx';
import { RoundPlayer } from './RoundPlayer.tsx';

const TICK_MS = 15_000;

export function Session({ onHome }: { onHome(): void }) {
  const { db, child, settings, audio } = useApp();
  const [state, dispatch] = useReducer(sessionReducer, undefined, startSession);
  const { phase } = state;

  // Count play time while the app is visible; stored, so a reload does not reset it.
  useEffect(() => {
    const limitMs = settings.dailyLimitMinutes * 60_000;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void addDailyTime(db, child.id, TICK_MS).then((total) => {
        if (total >= limitMs) dispatch({ type: 'limitReached' });
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [db, child.id, settings.dailyLimitMinutes]);

  useEffect(() => {
    if (phase.kind !== 'done') return;
    void audio.play({ kind: 'instruction', key: phase.reason === 'limit' ? 'see-you-tomorrow' : 'round-complete' });
    return () => audio.stop();
  }, [phase, audio]);

  switch (phase.kind) {
    case 'play':
      return (
        <main className="screen session">
          <RoundPlayer key={state.round} roundKind={phase.roundKind} onComplete={() => dispatch({ type: 'roundComplete' })} />
        </main>
      );

    case 'break':
      return (
        <main className="screen screen--center">
          <BreakView onContinue={() => dispatch({ type: 'continue' })} />
        </main>
      );

    case 'done':
      return (
        <main className="screen screen--center done">
          <Mascot mood={phase.reason === 'limit' ? 'encouraging' : 'happy'} size={220} />
          {phase.reason === 'complete' && (
            <div className="stars-row">
              {state.played.map((_, i) => (
                <StarIcon key={i} size={72} />
              ))}
            </div>
          )}
          <IconButton label={t('nav.home')} variant="primary" onClick={onHome}>
            <HomeIcon />
          </IconButton>
        </main>
      );
  }
}
