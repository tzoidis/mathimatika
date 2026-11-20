// Play time counts toward the daily limit wherever the child plays: the rounds and the
// Workshop. Counted while the app is visible, in ticks, plus the seconds since the last
// tick when the screen closes; stored, so a reload does not reset it.

import { useEffect, useRef } from 'react';
import { addDailyTime } from '../storage/db.ts';
import { useApp } from './AppContext.tsx';

const TICK_MS = 15_000;

/** Counts play time while mounted; `onTotal` hears today's total after each tick. */
export function usePlayTime(onTotal?: (totalMs: number) => void): void {
  const { db, child } = useApp();
  const listener = useRef(onTotal);
  listener.current = onTotal;

  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      last = Date.now();
      if (document.visibilityState !== 'visible') return;
      void addDailyTime(db, child.id, TICK_MS).then((total) => listener.current?.(total));
    }, TICK_MS);
    return () => {
      clearInterval(id);
      const rest = Math.min(TICK_MS, Date.now() - last);
      if (document.visibilityState === 'visible' && rest > 0) void addDailyTime(db, child.id, rest);
    };
  }, [db, child.id]);
}
