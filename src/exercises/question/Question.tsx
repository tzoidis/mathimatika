// One question, answered with digits, a manipulative or a choice of tiles. The flow is
// Glossa's (PRD §6): a wrong answer just clears, with a gentle clip; after the second
// the answer is shown and the child still makes the right move. Only attempts 1 and 2
// are recorded.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { useUpdateSettings } from '../../screens/parent/useSettings.ts';
import { numberRequest } from '../../audio/numberClips.ts';
import { t } from '../../i18n.ts';
import { isTextAllowed, readingContext } from '../../engine/reading/allowedWords.ts';
import { balance } from '../../manipulatives/balance.tsx';
import type { Manipulative } from '../../manipulatives/types.ts';
import { numberLine } from '../../manipulatives/numberLine.tsx';
import { rods } from '../../manipulatives/rods.tsx';
import type { UiKey } from '../../i18n.ts';
import { tenFrame } from '../../manipulatives/tenFrame.tsx';
import { formatNumber } from '../../math-core/format.ts';
import type { AnswerMode, Choice, Problem, Say, Scene as SceneData } from '../../math-core/generators/types.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { CheckIcon, SpeakerIcon } from '../../ui/Icons.tsx';
import { NumPad } from '../../ui/NumPad.tsx';
import type { ExerciseProps } from '../types.ts';
import type { QuestionItem } from './generate.ts';
import { Dots, Scene } from './Scene.tsx';
import { ObjectPicture } from './objects.tsx';

const MAX_DIGITS = 3;

/** How long each step of a first-time demo stays on screen. */
const DEMO_STEP_MS = 800;

function ManipulativeAnswer<S, C>({
  manipulative,
  config,
  revealed,
  demo,
  onDemoDone,
  onSubmit,
}: {
  manipulative: Manipulative<S, C>;
  config: C;
  revealed: boolean;
  demo: boolean;
  onDemoDone(): void;
  onSubmit(input: string): void;
}) {
  const { audio } = useApp();
  const [state, setState] = useState(() => manipulative.init(config));
  const [demoState, setDemoState] = useState<S | null>(null);
  const { View } = manipulative;

  useEffect(() => {
    if (!demo) return;
    let cancelled = false;
    void (async () => {
      await audio.play({ kind: 'instruction', key: 'worked-example' });
      for (const step of manipulative.demo(config)) {
        if (cancelled) return;
        setDemoState(step);
        await new Promise((resolve) => setTimeout(resolve, DEMO_STEP_MS));
      }
      if (cancelled) return;
      setDemoState(null);
      await audio.play({ kind: 'instruction', key: 'twin-problem' });
      if (!cancelled) onDemoDone();
    })();
    return () => {
      cancelled = true;
    };
    // once per manipulative: the first time it appears
  }, []);

  if (demo) {
    return (
      <div className="manipulative-answer">
        <View state={demoState ?? manipulative.init(config)} onChange={() => undefined} readOnly />
      </div>
    );
  }

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

function GroupAnswer({ scene, choices, correct, revealed, onSubmit }: { scene: Extract<SceneData, { kind: 'quantity' }>; choices: Choice[]; correct: string; revealed: boolean; onSubmit(input: string): void }) {
  const counts = [scene.left, scene.right];
  const sides = ['left', 'right'] as const;
  return (
    <div className="groups">
      {choices.map((c, i) => (
        <button key={c.value} type="button" className={`group-tile ${scene.bigSide === sides[i] ? 'group-tile--big' : ''} ${revealed && String(c.value) === correct ? 'choice-tile--shown' : ''}`} onClick={() => onSubmit(String(c.value))}>
          <Dots n={counts[i]!} />
        </button>
      ))}
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

/** The scale itself is the answer: tap the pan with the heavier thing. */
function HeavierAnswer({ scene, correct, revealed, onSubmit }: { scene: Extract<SceneData, { kind: 'heavier' }>; correct: string; revealed: boolean; onSubmit(input: string): void }) {
  const pan = (side: 'left' | 'right', id: string, value: number) => (
    <button
      type="button"
      aria-label={t('scale.pan')}
      className={`scale-pan scale-pan--${side} ${scene.heavy === side ? 'scale-pan--down' : 'scale-pan--up'} ${scene.bigSide === side ? 'scale-pan--big' : ''} ${revealed && String(value) === correct ? 'choice-tile--shown' : ''}`}
      onClick={() => onSubmit(String(value))}
    >
      <ObjectPicture id={id} />
    </button>
  );
  return (
    <div className={`scale scale--${scene.heavy}`}>
      <div className="scale-beam" />
      <div className="scale-post" />
      {pan('left', scene.left, -1)}
      {pan('right', scene.right, 1)}
    </div>
  );
}

/** The week as seven cards from Monday; a name is written only if the child can read it. */
function WeekAnswer({ scene, correct, revealed, readable, onSubmit }: { scene: Extract<SceneData, { kind: 'week' }>; correct: string; revealed: boolean; readable(text: string): boolean; onSubmit(input: string): void }) {
  return (
    <div className="week" role="group" aria-label={t('week.label')}>
      {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
        const name = t(`day.${day}` as UiKey);
        const today = scene.marked && day === scene.today;
        return (
          <button key={day} type="button" aria-label={name} className={`week-day week-day--${day} ${today ? 'week-day--today' : ''} ${revealed && String(day) === correct ? 'choice-tile--shown' : ''}`} onClick={() => onSubmit(String(day))}>
            {today && <span className="week-sun" aria-label={t('week.today')} />}
            {readable(name) && <span className="week-name">{name}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** How an answer is written down: the sign for a choice, the number otherwise. */
const labelOf = (problem: Problem, input: string) => problem.choices?.find((c) => String(c.value) === input)?.label ?? input;
const rightInput = (problem: Problem) => (problem.choices ? String(problem.answer.n) : formatNumber(problem.answer));

const MANIPULATIVE_MODES: AnswerMode[] = ['tenFrame', 'numberLine', 'balance', 'rods', 'regroup'];

export function Question({ round, onAnswer, onComplete }: ExerciseProps) {
  const { audio, settings } = useApp();
  const updateSettings = useUpdateSettings();
  const [seenDemos, setSeenDemos] = useState(settings.seenDemos);
  const items = round.items as QuestionItem[];
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [attempt, setAttempt] = useState<1 | 2>(1);
  const [revealed, setRevealed] = useState(false);
  /** bumped after a wrong answer, so a manipulative starts over */
  const [tries, setTries] = useState(0);
  const item = items[index]!;
  const { problem } = item;
  const demoing = MANIPULATIVE_MODES.includes(problem.answerMode) && !seenDemos.includes(problem.answerMode);

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
        await audio.play('number' in part ? numberRequest(part.number, part.gender) : 'clip' in part ? { kind: 'problem', key: part.clip } : { kind: 'instruction', key: part.instruction });
      }
    },
    [audio],
  );

  // PRD §7: in grades 1-2 every problem is read aloud by itself
  useEffect(() => {
    if (demoing) return;
    shownAt.current = Date.now();
    listened.current = false;
    void say(item.problem.say);
    return () => {
      speech.current++;
      audio.stop();
    };
  }, [audio, item, say, demoing]);

  const demoDone = () => {
    const seen = [...seenDemos, problem.answerMode];
    setSeenDemos(seen);
    void updateSettings({ seenDemos: seen });
  };

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
        ...(!verdict.ok && verdict.code ? { code: verdict.code } : {}),
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
  const manipulativeKey = [index, tries, demoing].join('-');
  const manipulativeProps = { revealed, demo: demoing, onDemoDone: demoDone, onSubmit: (a: string) => void submit(a) };

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
        {answerMode !== 'group' && (
          <div className="keypad-question">
            <Scene key={index} scene={scene} slot={slot} answerOnLine={answerMode === 'numberLine'} readable={scene.kind === 'story' && isTextAllowed(scene.text, readingContext(settings.upToPosition))} />
          </div>
        )}
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
        {answerMode === 'group' && scene.kind === 'quantity' && problem.choices && <GroupAnswer scene={scene} choices={problem.choices} correct={rightInput(problem)} revealed={revealed} onSubmit={(a) => void submit(a)} />}
        {answerMode === 'tenFrame' && scene.kind === 'put' && (
          <ManipulativeAnswer key={manipulativeKey} manipulative={tenFrame} config={{ frames: scene.frames, target: scene.n }} {...manipulativeProps} />
        )}
        {answerMode === 'numberLine' && (scene.kind === 'line' || scene.kind === 'jar') && (
          <ManipulativeAnswer
            key={manipulativeKey}
            manipulative={numberLine}
            config={scene.kind === 'line' ? { max: scene.max, labels: scene.labels, mark: scene.mark, target: scene.target } : { max: scene.max, labels: 'all', mark: null, target: scene.n }}
            {...manipulativeProps}
          />
        )}
        {answerMode === 'heavier' && scene.kind === 'heavier' && <HeavierAnswer scene={scene} correct={rightInput(problem)} revealed={revealed} onSubmit={(a) => void submit(a)} />}
        {answerMode === 'week' && scene.kind === 'week' && (
          <WeekAnswer scene={scene} correct={rightInput(problem)} revealed={revealed} readable={(text) => isTextAllowed(text, readingContext(settings.upToPosition))} onSubmit={(a) => void submit(a)} />
        )}
        {answerMode === 'rods' && scene.kind === 'build' && (
          <ManipulativeAnswer key={manipulativeKey} manipulative={rods} config={{ mode: 'build', target: scene.n, tens: 0, units: 0 }} {...manipulativeProps} />
        )}
        {answerMode === 'regroup' && scene.kind === 'regroup' && (
          <ManipulativeAnswer key={manipulativeKey} manipulative={rods} config={{ mode: 'regroup', target: scene.tens * 10 + scene.units, tens: scene.tens, units: scene.units }} {...manipulativeProps} />
        )}
        {answerMode === 'balance' && scene.kind === 'balance' && <ManipulativeAnswer key={manipulativeKey} manipulative={balance} config={{ a: scene.a, total: scene.total }} {...manipulativeProps} />}
      </div>
    </div>
  );
}
