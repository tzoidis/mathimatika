// The child's own place: a scene that fills up, item by item, and the garden of facts.
// When a room is full the child moves on to the next one (PRD §6: «μετακόμιση»); the
// rooms already filled stay there to visit with the arrows. The goal is the hedgehog's
// great festival: the path at the top shows how far it is, each full room is celebrated,
// and the last one brings the festival. The things in it answer a tap.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { usePlayTime } from '../../app/playTime.ts';
import { createMelody } from '../../audio/melody.ts';
import workshop from '../../content/workshop.json';
import { t } from '../../i18n.ts';
import { formatNumber } from '../../math-core/format.ts';
import { buyItem, ownedItems } from '../../storage/progress.ts';
import { festivalDone, filledBy, nextChoices, openRooms, roomChoices, roomProgress } from '../../storage/workshop.ts';
import { useUpdateSettings } from '../parent/useSettings.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { HomeIcon, NextIcon, StarIcon } from '../../ui/Icons.tsx';
import { Mascot } from '../../ui/Mascot.tsx';
import { BALLOONS, GARLAND, ITEM_ART, ITEM_PLACES } from './art.tsx';
import { Garden } from './Garden.tsx';
import { isReaction, REACTION_MS, REACTION_TUNES } from './react.ts';
import { ROOM_ART, ROOM_PLACES, ROOM_SCENES } from './rooms.tsx';

const ART = { ...ITEM_ART, ...ROOM_ART };
const PLACES = { ...ITEM_PLACES, ...ROOM_PLACES };
const titleOf = (id: string) => workshop.items.find((i) => i.id === id)?.title ?? id;
const reactionOf = (id: string) => {
  const kind = workshop.items.find((i) => i.id === id)?.react;
  return isReaction(kind) ? kind : 'hop';
};
/** remembered in settings.seenDemos, like the first-time demos of the exercises */
const TAP_HINT = 'workshop-tap';
/** after its clip, a celebration stays this long before the new room shows */
const CELEBRATE_AFTER_MS = 2500;

/** The way to the festival: one stop per room, then the balloons. Pictures only. */
function GoalPath({ owned }: { owned: readonly string[] }) {
  const progress = roomProgress(workshop.rooms, workshop.items, owned);
  const current = progress.findIndex((p) => p.owned < p.total);
  const done = festivalDone(workshop.items, owned);
  return (
    <ol className="goal-path" role="img" aria-label={t('workshop.goal', { n: formatNumber(progress.filter((p) => p.owned === p.total).length), total: formatNumber(progress.length) })}>
      {workshop.rooms.map((room, i) => {
        const p = progress[i]!;
        const state = p.owned === p.total ? 'done' : i === current ? 'now' : 'later';
        const fill = { '--goal-fill': String(p.owned / p.total) } as CSSProperties;
        return (
          <li key={room.id} className={`goal-stop goal-stop--${state}`} style={state === 'now' ? fill : undefined}>
            <ItemPicture id={room.badge} size={44} />
          </li>
        );
      })}
      <li className={`goal-stop goal-stop--festival ${done ? 'goal-stop--done' : 'goal-stop--later'}`}>
        <svg width={44} height={44} viewBox="0 0 200 200" aria-hidden>
          {BALLOONS}
        </svg>
      </li>
    </ol>
  );
}

/** A full room: balloons, a happy hedgehog and its clip; the last room is the festival itself. */
function Celebration({ room, onDone }: { room: string; onDone(): void }) {
  const festival = room === workshop.rooms[workshop.rooms.length - 1]!.id;
  return (
    <button type="button" className={`celebration ${festival ? 'celebration--festival' : ''}`} aria-label={t('workshop.celebrate')} onClick={onDone}>
      {Array.from({ length: festival ? 9 : 5 }, (_, i) => (
        <svg key={i} className={`celebration-balloon celebration-balloon--${i}`} width={120} height={120} viewBox="0 0 200 200" aria-hidden>
          {BALLOONS}
        </svg>
      ))}
      <Mascot mood="happy" size={220} />
    </button>
  );
}

export function ItemPicture({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      {ART[id]}
    </svg>
  );
}

export function Workshop({ onHome }: { onHome(): void }) {
  const app = useApp();
  const { db, child, audio, settings } = app;
  const updateSettings = useUpdateSettings();
  const [owned, setOwned] = useState<string[] | null>(null);
  /** the room on screen; null shows the one being filled */
  const [viewing, setViewing] = useState<string | null>(null);
  /** the room just filled, being celebrated */
  const [celebrating, setCelebrating] = useState<string | null>(null);
  /** the thing that answers a tap, and a count so a second tap starts it again */
  const [reacting, setReacting] = useState<{ id: string; n: number } | null>(null);
  const melody = useRef<ReturnType<typeof createMelody> | null>(null);
  // a place to play counts toward the day's time too
  usePlayTime();

  useEffect(() => {
    void ownedItems(db, child.id).then(setOwned);
  }, [db, child.id]);

  const { room, choices } = owned ? roomChoices(workshop.rooms, workshop.items, owned, child.stars) : { room: workshop.rooms[0]!, choices: [] };
  const rooms = owned ? openRooms(workshop.rooms, workshop.items, owned) : [];
  const shown = viewing ?? room.id;
  const canChoose = choices.length > 0 && shown === room.id;
  // not enough stars yet: the next two things, pale, and how many stars are still missing
  const upcoming =
    owned && choices.length === 0 && shown === room.id
      ? nextChoices(
          workshop.items.filter((i) => i.room === room.id).map((i) => i.id),
          owned,
          room.price,
          room.price,
        )
      : [];

  useEffect(() => {
    if (owned === null) return;
    // the first visit tells the goal; once something is there, how to play with it (once)
    const tapHint = owned.length > 0 && !settings.seenDemos.includes(TAP_HINT);
    if (tapHint) void updateSettings({ seenDemos: [...settings.seenDemos, TAP_HINT] });
    void audio.play({ kind: 'instruction', key: owned.length === 0 ? 'workshop-goal' : tapHint ? TAP_HINT : choices.length > 0 ? 'workshop-choose' : 'workshop-hello' });
    return () => audio.stop();
    // once on arrival; after a choice the «it grows» clip plays instead
  }, [owned === null]);

  const endCelebration = () => {
    setCelebrating(null);
    setViewing(null);
  };

  const choose = async (id: string) => {
    if (!owned || !(await buyItem(db, child.id, id, room.price))) return;
    const filled = filledBy(workshop.items, owned, id);
    // the full room stays on screen while it is celebrated; then the new one shows
    if (filled) setViewing(filled);
    setOwned(await ownedItems(db, child.id));
    await app.refresh();
    if (!filled) {
      setViewing(null);
      void audio.play({ kind: 'instruction', key: 'workshop-grows' });
      return;
    }
    setCelebrating(filled);
    melody.current ??= createMelody();
    melody.current.unlock();
    melody.current.finish();
    await audio.play({ kind: 'instruction', key: ['room-done', filled].join('-') });
    await new Promise((resolve) => setTimeout(resolve, CELEBRATE_AFTER_MS));
    endCelebration();
  };

  /** A tap on a thing in the scene: it moves and answers with a few notes. */
  const react = (id: string) => {
    melody.current ??= createMelody();
    melody.current.unlock();
    melody.current.tune(REACTION_TUNES[reactionOf(id)]);
    setReacting((r) => ({ id, n: (r?.n ?? 0) + 1 }));
  };

  useEffect(() => {
    if (!reacting) return;
    const timer = setTimeout(() => setReacting(null), REACTION_MS);
    return () => clearTimeout(timer);
  }, [reacting]);

  if (owned === null) return <main className="screen" />;

  const index = rooms.findIndex((r) => r.id === shown);
  const festival = festivalDone(workshop.items, owned);
  const inShown = owned.filter((id) => workshop.items.find((i) => i.id === id)?.room === shown);

  return (
    <main className="workshop fit-light">
      <div className="top-bar">
        <IconButton label={t('nav.home')} onClick={onHome}>
          <HomeIcon />
        </IconButton>
        <GoalPath owned={owned} />
        <span className="star-count" aria-label={t('workshop.stars', { n: formatNumber(child.stars) })}>
          <StarIcon size={48} />
          <strong>{formatNumber(child.stars)}</strong>
        </span>
      </div>

      <div className="workshop-body">
        <div className="workshop-rooms">
          {/* an arrow only where there is a room to go to; the space stays so the scene does not jump */}
          {rooms.length > 1 &&
            (index > 0 ? (
              <span className="room-arrow room-arrow--back">
                <IconButton label={t('workshop.previousRoom')} onClick={() => setViewing(rooms[index - 1]!.id)}>
                  <NextIcon />
                </IconButton>
              </span>
            ) : (
              <span className="icon-button-space" aria-hidden />
            ))}
          <svg className="workshop-scene" viewBox="0 0 1000 620" role="img" aria-label={t('workshop.scene', { room: workshop.rooms.find((r) => r.id === shown)?.title ?? '', n: formatNumber(inShown.length) })}>
            {ROOM_SCENES[shown]}
            {festival && GARLAND}
            {inShown.map((id) => {
              const place = PLACES[id];
              const active = reacting?.id === id;
              return place ? (
                <g key={id} transform={`translate(${place.x} ${place.y}) scale(${place.scale})`}>
                  <g key={active ? reacting.n : 0} className={active ? ['workshop-thing react react--', reactionOf(id)].join('') : 'workshop-thing'} onClick={() => react(id)}>
                    {/* the whole box answers a tap, not only the painted lines */}
                    <rect width="200" height="200" fill="transparent" />
                    {ART[id]}
                  </g>
                </g>
              ) : null;
            })}
          </svg>
          {rooms.length > 1 &&
            (index < rooms.length - 1 ? (
              <IconButton label={t('workshop.nextRoom')} onClick={() => setViewing(rooms[index + 1]!.id)}>
                <NextIcon />
              </IconButton>
            ) : (
              <span className="icon-button-space" aria-hidden />
            ))}
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

        {upcoming.length > 0 && (
          <div className="workshop-upcoming" role="img" aria-label={room.price - child.stars === 1 ? t('workshop.missingOne') : t('workshop.missing', { n: formatNumber(room.price - child.stars) })}>
            <div className="workshop-choices">
              {upcoming.map((id) => (
                <span key={id} className="workshop-choice workshop-choice--later">
                  <ItemPicture id={id} size={120} />
                </span>
              ))}
            </div>
            <span className="workshop-stars-needed">
              {Array.from({ length: room.price }, (_, i) => (
                <StarIcon key={i} size={44} hollow={i >= child.stars} />
              ))}
            </span>
          </div>
        )}

        <Garden />
      </div>
      {celebrating && <Celebration room={celebrating} onDone={endCelebration} />}
    </main>
  );
}
