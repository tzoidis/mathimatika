// The child's own place: a scene that fills up, item by item, and the garden of facts.

import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import workshop from '../../content/workshop.json';
import { t } from '../../i18n.ts';
import { formatNumber } from '../../math-core/format.ts';
import { buyItem, ownedItems } from '../../storage/progress.ts';
import { nextChoices } from '../../storage/workshop.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { HomeIcon, StarIcon } from '../../ui/Icons.tsx';
import { ITEM_ART, ITEM_PLACES, ItemPicture } from './art.tsx';
import { Garden } from './Garden.tsx';

const ITEM_IDS = workshop.items.map((i) => i.id);
const titleOf = (id: string) => workshop.items.find((i) => i.id === id)?.title ?? id;

export function Workshop({ onHome }: { onHome(): void }) {
  const app = useApp();
  const { db, child, audio } = app;
  const [owned, setOwned] = useState<string[] | null>(null);

  useEffect(() => {
    void ownedItems(db, child.id).then(setOwned);
  }, [db, child.id]);

  const choices = owned ? nextChoices(ITEM_IDS, owned, child.stars, workshop.price) : [];
  const canChoose = choices.length > 0;

  useEffect(() => {
    if (owned === null) return;
    void audio.play({ kind: 'instruction', key: canChoose ? 'workshop-choose' : 'workshop-hello' });
    return () => audio.stop();
    // once on arrival; after a choice the «it grows» clip plays instead
  }, [owned === null]);

  const choose = async (id: string) => {
    if (!(await buyItem(db, child.id, id, workshop.price))) return;
    setOwned(await ownedItems(db, child.id));
    await app.refresh();
    void audio.play({ kind: 'instruction', key: 'workshop-grows' });
  };

  if (owned === null) return <main className="screen" />;

  return (
    <main className="workshop">
      <div className="top-bar">
        <IconButton label={t('nav.home')} onClick={onHome}>
          <HomeIcon />
        </IconButton>
        <span className="star-count" aria-label={t('workshop.stars', { n: formatNumber(child.stars) })}>
          <StarIcon size={48} />
          <strong>{formatNumber(child.stars)}</strong>
        </span>
      </div>

      <div className="workshop-body">
        <svg className="workshop-scene" viewBox="0 0 1000 620" role="img" aria-label={t('workshop.scene', { n: formatNumber(owned.length) })}>
          <rect width="1000" height="430" fill="#fbe9c9" />
          <rect y="430" width="1000" height="190" fill="#e0c8a0" />
          <rect y="424" width="1000" height="10" fill="#b98a5a" />
          {owned.map((id) => {
            const place = ITEM_PLACES[id];
            return place ? (
              <g key={id} transform={`translate(${place.x} ${place.y}) scale(${place.scale})`}>
                {ITEM_ART[id]}
              </g>
            ) : null;
          })}
        </svg>

        {canChoose && (
          <div className="workshop-choices">
            {choices.map((id) => (
              <button key={id} type="button" className="workshop-choice" aria-label={titleOf(id)} onClick={() => void choose(id)}>
                <ItemPicture id={id} size={120} />
              </button>
            ))}
          </div>
        )}

        <Garden />
      </div>
    </main>
  );
}
