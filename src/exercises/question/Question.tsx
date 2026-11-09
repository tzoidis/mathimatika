// One question, answered with digits, a manipulative or a choice of tiles. The flow is
// Glossa's (PRD §6): a wrong answer just clears, with a gentle clip; after the second
// the answer is shown and the child still makes the right move. Only attempts 1 and 2
// are recorded.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { numberRequest } from '../../audio/numberClips.ts';
import { t } from '../../i18n.ts';
import type { Manipulative } from '../../manipulatives/types.ts';
import { numberLine } from '../../manipulatives/numberLine.tsx';
import { tenFrame } from '../../manipulatives/tenFrame.tsx';
import { formatNumber } from '../../math-core/format.ts';
import type { Choice, Problem, Say } from '../../math-core/generators/types.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { CheckIcon, SpeakerIcon } from '../../ui/Icons.tsx';
import { NumPad } from '../../ui/NumPad.tsx';
import type { ExerciseProps } from '../types.ts';
import type { QuestionItem } from './generate.ts';
import { Scene } from './Scene.tsx';

const MAX_DIGITS = 3;

function ManipulativeAnswer<S, C>({ manipulative, config, revealed, onSubmit }: { manipulative: Manipulative<S, C>; config: C; revealed: boolean; onSubmit(input: string): void }) {
  const [state, setState] = useState(() => manipulative.init(config));
  const { View } = manipulative;
  return (
    <div className="manipulative-answer">
      <View state={state} onChange={setState} readOnly={false} highlight={revealed ? manipulative.highlightOf(manipulative.showSolution(config)) : undefined} />
      <IconButton
        label={t('numpad.ok')}
        variant="primary"
        onClick={() => {
          const input = manipulative.read(state);
          if (input !== null) onSubmit(input);
        }}
      >
        <CheckIcon />
      </IconButton>
    </div>
  );
}

function ChoiceAnswer({ choices, correct, revealed, onSubmit }: { choices: Choice[]; correct: string; revealed: boolean; onSubmit(input: string): void }) {
  return (
    <div className="choices">
      {choices.map((c) => (
        <button key={c.label} type="button" className={`choice-tile ${revealed && String(c.value) === correct ? 'choice-tile--shown' : ''}`} onClick={() => onSubmit(String(c.value))}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

/** How an answer is written down: the sign for a choice, the number otherwise. */
const labelOf = (problem: Problem, input: string) => problem.choices?.find((c) => String(c.value) === input)?.label ?? input;
const rightInput = (problem: Problem) => (problem.choices ? String(problem.answer.n) : formatNumber(problem.answer));

export function Question({ round, onAnswer, onComplete }: ExerciseProps) {
  const { audio } = useApp();
  const items = round.items as QuestionItem[];
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [attempt, setAttempt] = useState<1 | 2>(1);
  const [revealed, setRevealed] = useState(false);
  /** bumped after a wrong answer, so a manipulative starts over */
  const [tries, setTries] = useState(0);
  const item = items[index]!;
  const { problem } = item;

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
    setTries(0);
  };

  const submit = async (answer: string) => {
    if (answer === '' || leaving.current) return;
    speech.current++;
    const verdict = item.generator.grade(problem, answer);

    if (!revealed) {
      onAnswer({
        id: [round.seed, index, attempt].join('-'),
        childId: '',
        ts: Date.now(),
        exerciseId: problem.generatorId,
        itemId: problem.key,
        target: labelOf(problem, rightInput(problem)),
        given: labelOf(problem, answer),
        correct: verdict.ok,
        attempt,
        soundsRight: false,
        usedListen: listened.current,
        latencyMs: Date.now() - shownAt.current,
        position: index,
      });
    }

    if (verdict.ok) {
      setInput(answer);
      leaving.current = true;
      await audio.play({ kind: 'praise', key: attempt === 2 || revealed ? 'kept-trying' : item.praiseKey });
      next();
      return;
    }
    setInput('');
    setTries((n) => n + 1);
    if (revealed) {
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
  const shown = showingAnswer ? labelOf(problem, rightInput(problem)) : labelOf(problem, input);
  const slot = <span className={`slot ${showingAnswer ? 'slot--shown' : ''}`}>{shown}</span>;
  const { scene, answerMode } = problem;

  return (
    <div className="keypad-round">
      <div className="keypad-top">
        <IconButton
          label={t('exercise.listen')}
          onClick={() => {
            listened.current = true;
            void say(problem.say);
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
          <Scene key={index} scene={scene} slot={slot} answerOnLine={answerMode === 'numberLine'} />
        </div>
        {answerMode === 'keypad' && (
          <NumPad
            onDigit={(d) => {
              if (!leaving.current) setInput((v) => (v.length < MAX_DIGITS ? v + d : v));
            }}
            onDelete={() => {
              if (!leaving.current) setInput((v) => v.slice(0, -1));
            }}
            onOk={() => void submit(input)}
          />
        )}
        {answerMode === 'choice' && problem.choices && <ChoiceAnswer choices={problem.choices} correct={rightInput(problem)} revealed={revealed} onSubmit={(a) => void submit(a)} />}
        {answerMode === 'tenFrame' && scene.kind === 'put' && (
          <ManipulativeAnswer key={[index, tries].join('-')} manipulative={tenFrame} config={{ frames: scene.frames, target: scene.n }} revealed={revealed} onSubmit={(a) => void submit(a)} />
        )}
        {answerMode === 'numberLine' && scene.kind === 'line' && (
          <ManipulativeAnswer key={[index, tries].join('-')} manipulative={numberLine} config={{ max: scene.max, labels: scene.labels, mark: scene.mark, target: scene.target }} revealed={revealed} onSubmit={(a) => void submit(a)} />
        )}
      </div>
    </div>
  );
}
