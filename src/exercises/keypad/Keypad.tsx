// A question answered with digits. The flow is Glossa's (PRD §6): a wrong answer just
// clears, with a gentle clip; after the second the answer is shown and the child still
// makes the right move. Only attempts 1 and 2 are recorded.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { numberRequest } from '../../audio/numberClips.ts';
import { t } from '../../i18n.ts';
import { formatNumber } from '../../math-core/format.ts';
import type { Say } from '../../math-core/generators/types.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { SpeakerIcon } from '../../ui/Icons.tsx';
import { NumPad } from '../../ui/NumPad.tsx';
import type { ExerciseProps } from '../types.ts';
import type { KeypadItem } from './generate.ts';
import { Scene } from './Scene.tsx';

const MAX_DIGITS = 3;

export function Keypad({ round, onAnswer, onComplete }: ExerciseProps) {
  const { audio } = useApp();
  const items = round.items as KeypadItem[];
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [attempt, setAttempt] = useState<1 | 2>(1);
  const [revealed, setRevealed] = useState(false);
  const item = items[index]!;

  const speech = useRef(0);
  const leaving = useRef(false);
  const shownAt = useRef(Date.now());
  const listened = useRef(false);

  /** Plays the parts in order; any newer speech or answer cuts it short. */
  const say = useCallback(
    async (parts: Say[]) => {
      const mine = ++speech.current;
      for (const part of parts) {
        if (speech.current !== mine) return;
        await audio.play('number' in part ? numberRequest(part.number) : { kind: 'instruction', key: part.instruction });
      }
    },
    [audio],
  );

  // PRD §7: in grades 1-2 every problem is read aloud by itself
  useEffect(() => {
    shownAt.current = Date.now();
    listened.current = false;
    void say(item.problem.say);
    return () => {
      speech.current++;
      audio.stop();
    };
  }, [audio, item, say]);

  const next = () => {
    leaving.current = false;
    if (index + 1 >= items.length) return onComplete();
    setIndex(index + 1);
    setInput('');
    setAttempt(1);
    setRevealed(false);
  };

  const submit = async () => {
    if (input === '' || leaving.current) return;
    speech.current++;
    const { problem, generator, praiseKey } = item;
    const verdict = generator.grade(problem, input);

    if (!revealed) {
      onAnswer({
        id: [round.seed, index, attempt].join('-'),
        childId: '',
        ts: Date.now(),
        exerciseId: problem.generatorId,
        itemId: problem.key,
        target: formatNumber(problem.answer),
        given: input,
        correct: verdict.ok,
        attempt,
        soundsRight: false,
        usedListen: listened.current,
        latencyMs: Date.now() - shownAt.current,
        position: index,
      });
    }

    setInput('');
    if (verdict.ok) {
      setInput(input);
      leaving.current = true;
      await audio.play({ kind: 'praise', key: attempt === 2 || revealed ? 'kept-trying' : praiseKey });
      next();
    } else if (revealed) {
      void audio.play({ kind: 'hint', key: 'hmm' });
    } else if (attempt === 1) {
      setAttempt(2);
      void audio.play({ kind: 'hint', key: verdict.hintId ?? 'hmm' });
    } else {
      setRevealed(true);
      void audio.play({ kind: 'hint', key: 'together' });
    }
  };

  const showingAnswer = revealed && input === '';
  const slot = <span className={`slot ${showingAnswer ? 'slot--shown' : ''}`}>{showingAnswer ? formatNumber(item.problem.answer) : input}</span>;

  return (
    <div className="keypad-round">
      <div className="keypad-top">
        <IconButton
          label={t('exercise.listen')}
          onClick={() => {
            listened.current = true;
            void say(item.problem.say);
          }}
        >
          <SpeakerIcon />
        </IconButton>
        <ol className="round-dots" aria-hidden>
          {items.map((_, i) => (
            <li key={i} className={i < index ? 'done' : i === index ? 'current' : ''} />
          ))}
        </ol>
      </div>
      <div className="keypad-body">
        <div className="keypad-question">
          <Scene scene={item.problem.scene} slot={slot} />
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
