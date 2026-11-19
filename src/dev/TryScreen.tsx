// Development only: plays one exercise at one stage, so a change can be checked in the
// browser without playing through a session. Opened with ?try=<generator id>&level=1|2|3
// on `npm run dev`; it is not in the production build. Answers are not written anywhere.

import { useState } from 'react';
import { praiseKeys } from '../audio/recordings.ts';
import { mulberry32, newSeed } from '../engine/rng.ts';
import type { Level, Round } from '../engine/types.ts';
import type { QuestionItem } from '../exercises/question/generate.ts';
import { Question } from '../exercises/question/Question.tsx';
import { GENERATORS, generatorById } from '../math-core/generators/index.ts';

const QUESTIONS = 5;

function roundOf(id: string, level: Level, seed: number): Round {
  const generator = generatorById(id)!;
  const rng = mulberry32(seed);
  const used = new Set<string>();
  const keys = praiseKeys();
  const items: QuestionItem[] = Array.from({ length: QUESTIONS }, (_, i) => {
    const problem = generator.produce({ rng, level }, used);
    used.add(problem.key);
    return { problem, generator, level, praiseKey: problem.praise ?? keys[i % keys.length]! };
  });
  return { id: ['try', id, seed].join('-'), exerciseId: 'question', seed, level, items };
}

/** The exercise and stage asked for in the address, if it names one. */
export function tryRequest(search: string): { id: string; level: Level; seed: number } | null {
  const params = new URLSearchParams(search);
  const id = params.get('try');
  if (id === null) return null;
  const level = Number(params.get('level') ?? '1');
  const seed = Number(params.get('seed') ?? newSeed());
  return { id, level: (level === 2 || level === 3 ? level : 1) as Level, seed: Number.isFinite(seed) ? seed : newSeed() };
}

export default function TryScreen({ search }: { search: string }) {
  const request = tryRequest(search)!;
  const [seed, setSeed] = useState(request.seed);

  if (!generatorById(request.id)) {
    return (
      <main className="screen">
        <ul>
          {GENERATORS.map((g) => (
            <li key={g.id}>
              {[1, 2, 3].map((level) => (
                <a key={level} href={'?' + new URLSearchParams({ try: g.id, level: String(level) }).toString()} style={{ marginRight: 12 }}>
                  {g.id} {level}
                </a>
              ))}
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <main className="screen session" data-try={request.id}>
      <Question key={seed} round={roundOf(request.id, request.level, seed)} onAnswer={() => undefined} onComplete={() => setSeed(seed + 1)} roundIndex={0} />
    </main>
  );
}
