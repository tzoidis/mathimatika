// The child's own place: a scene that fills up, item by item, and the garden of facts.
// When a room is full the child moves on to the next one (PRD §6: «μετακόμιση»); the
// rooms already filled stay there to visit with the arrows.

import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import workshop from '../../content/workshop.json';
import { t } from '../../i18n.ts';
import { formatNumber } from '../../math-core/format.ts';
import { buyItem, ownedItems } from '../../storage/progress.ts';
import { justMoved, openRooms, roomChoices } from '../../storage/workshop.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { HomeIcon, NextIcon, StarIcon } from '../../ui/Icons.tsx';
import { ITEM_ART, ITEM_PLACES } from './art.tsx';
import { Garden } from './Garden.tsx';
import { ROOM_ART, ROOM_PLACES, ROOM_SCENES } from './rooms.tsx';

const ART = { ...ITEM_ART, ...ROOM_ART };
const PLACES = { ...ITEM_PLACES, ...ROOM_PLACES };
const titleOf = (id: string) => workshop.items.find((i) => i.id === id)?.title ?? id;

export function ItemPicture({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      {ART[id]}
    </svg>
  );
}

export function Workshop({ onHome }: { onHome(): void }) {
  const app = useApp();
  const { db, child, audio } = app;
  const [owned, setOwned] = useState<string[] | null>(null);
  /** the room on screen; null shows the one being filled */
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    void ownedItems(db, child.id).then(setOwned);
  }, [db, child.id]);

  const { room, choices } = owned ? roomChoices(workshop.rooms, workshop.items, owned, child.stars) : { room: workshop.rooms[0]!, choices: [] };
  const rooms = owned ? openRooms(workshop.rooms, workshop.items, owned) : [];
  const shown = viewing ?? room.id;
  const canChoose = choices.length > 0 && shown === room.id;

  useEffect(() => {
    if (owned === null) return;
    const moved = owned.length > 0 && justMoved(workshop.rooms, workshop.items, owned);
    void audio.play({ kind: 'instruction', key: moved && choices.length > 0 ? 'workshop-move' : choices.length > 0 ? 'workshop-choose' : 'workshop-hello' });
    return () => audio.stop();
    // once on arrival; after a choice the «it grows» clip plays instead
  }, [owned === null]);

  const choose = async (id: string) => {
    if (!(await buyItem(db, child.id, id, room.price))) return;
    setOwned(await ownedItems(db, child.id));
    setViewing(null);
    await app.refresh();
    void audio.play({ kind: 'instruction', key: 'workshop-grows' });
  };

  if (owned === null) return <main className="screen" />;

  const index = rooms.findIndex((r) => r.id === shown);
  const inShown = owned.filter((id) => workshop.items.find((i) => i.id === id)?.room === shown);

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
        <div className="workshop-rooms">
          {rooms.length > 1 && (
            <span className="room-arrow room-arrow--back">
              <IconButton label={t('workshop.previousRoom')} onClick={() => setViewing(rooms[Math.max(0, index - 1)]!.id)}>
                <NextIcon />
              </IconButton>
            </span>
          )}
          <svg className="workshop-scene" viewBox="0 0 1000 620" role="img" aria-label={t('workshop.scene', { room: workshop.rooms.find((r) => r.id === shown)?.title ?? '', n: formatNumber(inShown.length) })}>
            {ROOM_SCENES[shown]}
            {inShown.map((id) => {
              const place = PLACES[id];
              return place ? (
                <g key={id} transform={`translate(${place.x} ${place.y}) scale(${place.scale})`}>
                  {ART[id]}
                </g>
              ) : null;
            })}
          </svg>
          {rooms.length > 1 && (
            <IconButton label={t('workshop.nextRoom')} onClick={() => setViewing(rooms[Math.min(rooms.length - 1, index + 1)]!.id)}>
              <NextIcon />
            </IconButton>
          )}
        </div>

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
