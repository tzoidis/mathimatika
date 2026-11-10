// The musical chain (PRD §6): every right answer adds a note and the next question comes
// at once; after a miss the tune just waits. The child picks the pace, and no time is
// ever shown. Latency is recorded silently, like everywhere else.

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { createMelody } from '../../audio/melody.ts';
import { numberRequest } from '../../audio/numberClips.ts';
import { t } from '../../i18n.ts';
import { factAnswer, factId, gradeFact, type Fact } from '../../math-core/facts.ts';
import { formatNumber } from '../../math-core/format.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { HareIcon, SpeakerIcon, TurtleIcon } from '../../ui/Icons.tsx';
import { NumPad } from '../../ui/NumPad.tsx';
import type { ExerciseProps } from '../types.ts';

const MAX_DIGITS = 2;
const PAUSE_MS = { turtle: 1500, hare: 500 } as const;
type Tempo = keyof typeof PAUSE_MS;

const FINISH_MS = 900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function Fluency({ round, onAnswer, onComplete }: ExerciseProps) {
  const { audio } = useApp();
  const facts = round.items as Fact[];
  const [tempo, setTempo] = useState<Tempo | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [attempt, setAttempt] = useState<1 | 2>(1);
  const [revealed, setRevealed] = useState(false);
  const melody = useRef(createMelody());
  const speech = useRef(0);
  const leaving = useRef(false);
  const shownAt = useRef(Date.now());
  const listened = useRef(false);
  const fact = facts[index]!;

  useEffect(() => {
    void audio.play({ kind: 'instruction', key: 'tempo-choose' });
    return () => audio.stop();
  }, [audio]);

  const read = async (f: Fact) => {
    const mine = ++speech.current;
    const parts = [numberRequest(f.a), { kind: 'instruction', key: f.op === '+' ? 'and' : 'minus' } as const, numberRequest(f.b)];
    for (const part of parts) {
      if (speech.current !== mine) return;
      await audio.play(part);
    }
  };

  useEffect(() => {
    if (tempo === null) return;
    shownAt.current = Date.now();
    listened.current = false;
    void read(fact);
    return () => {
      speech.current++;
    };
  }, [tempo, index]);

  const submit = async () => {
    if (input === '' || leaving.current || tempo === null) return;
    speech.current++;
    audio.stop();
    const verdict = gradeFact(fact, input);
    const target = formatNumber(factAnswer(fact));

    if (!revealed) {
      onAnswer({
        id: [round.seed, index, attempt].join('-'),
        childId: '',
        ts: Date.now(),
        exerciseId: 'fluency',
        itemId: factId(fact),
        target,
        given: input,
        correct: verdict.ok,
        ...(!verdict.ok && verdict.code ? { code: verdict.code } : {}),
        attempt,
        soundsRight: false,
        usedListen: listened.current,
        latencyMs: Date.now() - shownAt.current,
        position: index,
      });
    }

    if (verdict.ok) {
      leaving.current = true;
      melody.current.note(index);
      if (index + 1 >= facts.length) {
        await wait(PAUSE_MS.hare);
        melody.current.finish();
        await wait(FINISH_MS);
        return onComplete();
      }
      await wait(PAUSE_MS[tempo]);
      leaving.current = false;
      setIndex(index + 1);
      setInput('');
      setAttempt(1);
      setRevealed(false);
      return;
    }

    setInput('');
    if (revealed) return;
    if (attempt === 1) {
      setAttempt(2);
      void audio.play({ kind: 'hint', key: verdict.hintId ?? 'hmm' });
    } else {
      setRevealed(true);
      void audio.play({ kind: 'hint', key: 'together' });
    }
  };

  if (tempo === null) {
    const pick = (chosen: Tempo) => {
      melody.current.unlock();
      setTempo(chosen);
    };
    return (
      <div className="tempo-choice">
        <button type="button" className="tempo-tile" aria-label={t('fluency.turtle')} onClick={() => pick('turtle')}>
          <TurtleIcon />
        </button>
        <button type="button" className="tempo-tile" aria-label={t('fluency.hare')} onClick={() => pick('hare')}>
          <HareIcon />
        </button>
      </div>
    );
  }

  const showingAnswer = revealed && input === '';
  return (
    <div className="keypad-round">
      <div className="keypad-top">
        <IconButton
          label={t('exercise.listen')}
          onClick={() => {
            listened.current = true;
            void read(fact);
          }}
        >
          <SpeakerIcon />
        </IconButton>
        <ol className="round-dots" aria-hidden>
          {facts.map((_, i) => (
            <li key={i} className={i < index ? 'done' : i === index ? 'current' : ''} />
          ))}
        </ol>
      </div>
      <div className="keypad-body">
        <div className="keypad-question">
          <div className="scene">
            <div className="expression">
              <span>{formatNumber(fact.a)}</span>
              <span>{fact.op === '+' ? '+' : '−'}</span>
              <span>{formatNumber(fact.b)}</span>
              <span>=</span>
              <span className={`slot ${showingAnswer ? 'slot--shown' : ''}`}>{showingAnswer ? formatNumber(factAnswer(fact)) : input}</span>
            </div>
          </div>
        </div>
        <NumPad
          onDigit={(d) => {
            if (!leaving.current) setInput((v) => (v.length < MAX_DIGITS ? v + d : v));
          }}
          onDelete={() => {
            if (!leaving.current) setInput((v) => v.slice(0, -1));
          }}
          onOk={() => void submit()}
        />
      </div>
    </div>
  );
}
