// One session: 3 rounds, breaks, daily time limit (PRD §6).

import { useEffect, useReducer } from 'react';
import { useApp } from '../app/AppContext.tsx';
import { sessionReducer, startSession } from '../engine/session.ts';
import { t } from '../i18n.ts';
import { usePlayTime } from '../app/playTime.ts';
import { IconButton } from '../ui/IconButton.tsx';
import { HomeIcon, StarIcon, WorkshopIcon } from '../ui/Icons.tsx';
import { Mascot } from '../ui/Mascot.tsx';
import { BreakView } from './BreakView.tsx';
import { RoundPlayer } from './RoundPlayer.tsx';

export function Session({ onHome, onWorkshop }: { onHome(): void; onWorkshop(): void }) {
  const { settings, audio } = useApp();
  const [state, dispatch] = useReducer(sessionReducer, undefined, startSession);
  const { phase } = state;

  // the current round finishes, then the session ends (engine/session.ts)
  usePlayTime((total) => {
    if (total >= settings.dailyLimitMinutes * 60_000) dispatch({ type: 'limitReached' });
  });

  useEffect(() => {
    if (phase.kind !== 'done') return;
    void audio.play({ kind: 'instruction', key: phase.reason === 'limit' ? 'see-you-tomorrow' : 'round-complete' });
    return () => audio.stop();
  }, [phase, audio]);

  switch (phase.kind) {
    case 'play':
      return (
        <main className="screen session fit">
          <RoundPlayer key={state.round} roundIndex={state.round} roundKind={phase.roundKind} onComplete={() => dispatch({ type: 'roundComplete' })} />
        </main>
      );

    case 'break':
      return (
        <main className="screen screen--center fit-light">
          <BreakView onContinue={() => dispatch({ type: 'continue' })} />
        </main>
      );

    case 'done':
      return <SessionDone reason={phase.reason} stars={state.played.length} onHome={onHome} onWorkshop={onWorkshop} />;
  }
}

/** The end of a session: a star per round played, or only the hedgehog when the day's time is up. */
export function SessionDone({ reason, stars, onHome, onWorkshop }: { reason: 'complete' | 'limit'; stars: number; onHome(): void; onWorkshop(): void }) {
  return (
    <main className="screen screen--center done fit-light">
      <Mascot mood={reason === 'limit' ? 'encouraging' : 'happy'} size={220} />
      {reason === 'complete' && (
        <div className="stars-row">
          {Array.from({ length: stars }, (_, i) => (
            <StarIcon key={i} size={72} />
          ))}
        </div>
      )}
      <div className="done-actions">
        <IconButton label={t('nav.home')} onClick={onHome}>
          <HomeIcon />
        </IconButton>
        <IconButton label={t('nav.workshop')} variant="primary" onClick={onWorkshop}>
          <WorkshopIcon />
        </IconButton>
      </div>
    </main>
  );
}
