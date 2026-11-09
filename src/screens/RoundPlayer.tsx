// Generates one round and records its answers. Answers are logged only for rounds
// that count (the placeholder does not).

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext.tsx';
import { availableGenerators, latestGenerators } from '../app/curriculum.ts';
import { mulberry32, newSeed } from '../engine/rng.ts';
import type { AnswerLog, Round, RoundKind } from '../engine/types.ts';
import { exerciseForRound } from '../exercises/registry.ts';
import { completeRound, recordAnswer } from '../storage/progress.ts';

export function RoundPlayer({ roundKind, onComplete }: { roundKind: RoundKind; onComplete(): void }) {
  const app = useApp();
  const { db, child, settings } = app;
  const generators = availableGenerators(settings.grade, settings.upToUnit);
  const entry = exerciseForRound(roundKind, generators);
  const [round, setRound] = useState<Round | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    const seed = newSeed();
    setRound({ ...entry.module.generate({ roundKind, level: 1, rng: mulberry32(seed), generators, fresh: latestGenerators(settings.grade, settings.upToUnit) }), seed });
    // generate once per mounted round (Session remounts per round via key)
  }, []);

  if (!round) return <div className="exercise-stage" />;
  const { Component } = entry.module;

  const onAnswer = (a: AnswerLog) => {
    if (!entry.countsForProgress) return;
    void recordAnswer(db, { ...a, childId: child.id }).catch((e) => console.error('recordAnswer', e));
  };

  const complete = () => {
    if (finished.current) return;
    finished.current = true;
    if (!entry.countsForProgress) return onComplete();
    void completeRound(db, child.id)
      .then(() => app.refresh())
      .finally(onComplete);
  };

  return <Component round={round} onAnswer={onAnswer} onComplete={complete} />;
}
