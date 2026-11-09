// The garden of facts. Only looked at: seeds, sprouts and flowers differ in shape as
// well as colour, and nothing about it mentions speed.

import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { availableGenerators } from '../../app/curriculum.ts';
import { factStages, type FactStage } from '../../engine/garden.ts';
import { t } from '../../i18n.ts';
import { availableFacts, factId, type Fact } from '../../math-core/facts.ts';
import { localDate } from '../../storage/schema.ts';

function Plant({ stage }: { stage: FactStage }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      {stage === 'seed' && <circle cx="16" cy="24" r="4" fill="#7c5a3a" />}
      {stage === 'sprout' && (
        <>
          <path d="M16 30 V14" stroke="#6aa35f" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 18 Q6 16 6 8 Q16 8 16 18 Z M16 16 Q26 14 26 6 Q16 6 16 16 Z" fill="#6aa35f" />
        </>
      )}
      {stage === 'flower' && (
        <>
          <path d="M16 30 V16" stroke="#6aa35f" strokeWidth="3" strokeLinecap="round" />
          <g fill="#d96a5a">
            <circle cx="16" cy="6" r="5" />
            <circle cx="8" cy="12" r="5" />
            <circle cx="24" cy="12" r="5" />
            <circle cx="11" cy="20" r="5" />
            <circle cx="21" cy="20" r="5" />
          </g>
          <circle cx="16" cy="13" r="4.5" fill="#f6c443" />
        </>
      )}
    </svg>
  );
}

/** A square bed: one row per first number, one column per second. */
function Bed({ facts, stages }: { facts: Fact[]; stages: Map<string, FactStage> }) {
  const rows = [...new Set(facts.map((f) => f.a))];
  const columns = Math.max(...facts.map((f) => f.b));
  return (
    <div className="garden-bed" style={{ gridTemplateColumns: `repeat(${columns}, 34px)` }}>
      {rows.flatMap((a) =>
        Array.from({ length: columns }, (_, i) => i + 1).map((b) => {
          const fact = facts.find((f) => f.a === a && f.b === b);
          return <span key={[a, b].join('-')} className="garden-cell">{fact && <Plant stage={stages.get(factId(fact)) ?? 'seed'} />}</span>;
        }),
      )}
    </div>
  );
}

export function Garden() {
  const { db, child, settings } = useApp();
  const [stages, setStages] = useState(new Map<string, FactStage>());

  useEffect(() => {
    void db.answers
      .where('[childId+exerciseId]')
      .equals([child.id, 'fluency'])
      .toArray()
      .then((answers) => setStages(factStages(answers, localDate)));
  }, [db, child.id]);

  const facts = availableFacts(availableGenerators(settings.grade, settings.upToUnit).map((g) => g.id));
  if (facts.length === 0) return null;
  const adds = facts.filter((f) => f.op === '+');
  const subs = facts.filter((f) => f.op === '-');

  return (
    <div className="garden" role="img" aria-label={t('garden.label')}>
      <Bed facts={adds} stages={stages} />
      {subs.length > 0 && <Bed facts={subs} stages={stages} />}
    </div>
  );
}
