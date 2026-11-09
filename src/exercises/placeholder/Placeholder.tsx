// ΜΘ0: the empty round. One big star; each tap plays a praise clip and moves on,
// so a whole 3 × 5 session can be heard end to end on the tablet.

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { t } from '../../i18n.ts';
import { StarIcon } from '../../ui/Icons.tsx';
import { Mascot } from '../../ui/Mascot.tsx';
import type { ExerciseProps } from '../types.ts';
import type { PlaceholderItem } from './generate.ts';

export function Placeholder({ round, onComplete }: ExerciseProps) {
  const { audio } = useApp();
  const items = round.items as PlaceholderItem[];
  const [index, setIndex] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    void audio.play({ kind: 'instruction', key: 'placeholder-tap' });
    return () => audio.stop();
  }, [audio]);

  const tap = async () => {
    if (busy.current) return;
    busy.current = true;
    await audio.play({ kind: 'praise', key: items[index]!.praiseKey });
    busy.current = false;
    if (index + 1 < items.length) setIndex(index + 1);
    else onComplete();
  };

  return (
    <div className="exercise-stage">
      <Mascot mood="happy" size={160} />
      <button type="button" className="placeholder-star" aria-label={t('placeholder.tap')} onClick={() => void tap()}>
        <StarIcon size={150} />
      </button>
      <ol className="round-dots" aria-hidden>
        {items.map((_, i) => (
          <li key={i} className={i < index ? 'done' : i === index ? 'current' : ''} />
        ))}
      </ol>
    </div>
  );
}
