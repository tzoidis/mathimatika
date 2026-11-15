// Where the child is in the session: a star for each of the three rounds, filled once
// played, and a dot for each question of this one. Filled and hollow, not colour alone.

import { ROUNDS_PER_SESSION } from '../engine/session.ts';
import { StarIcon } from './Icons.tsx';

export function RoundProgress({ round, question, questions }: { round: number; question: number; questions: number }) {
  return (
    <div className="round-progress" aria-hidden>
      <span className="round-stars">
        {Array.from({ length: ROUNDS_PER_SESSION }, (_, i) => (
          <StarIcon key={i} size={36} hollow={i >= round} />
        ))}
      </span>
      <ol className="round-dots">
        {Array.from({ length: questions }, (_, i) => (
          <li key={i} className={i < question ? 'done' : i === question ? 'current' : ''} />
        ))}
      </ol>
    </div>
  );
}
