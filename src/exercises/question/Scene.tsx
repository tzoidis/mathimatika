// What the question looks like, apart from whatever the child answers with.

import { useEffect, useState, type ReactNode } from 'react';
import { t } from '../../i18n.ts';
import { numberLine } from '../../manipulatives/numberLine.tsx';
import { RodsPicture } from '../../manipulatives/rods.tsx';
import { formatNumber } from '../../math-core/format.ts';
import type { Scene as SceneData } from '../../math-core/generators/types.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { ReplayIcon } from '../../ui/Icons.tsx';
import { ObjectPicture } from './objects.tsx';
import { PatternItem, ShapePicture } from './shapes.tsx';
import type { UiKey } from '../../i18n.ts';

const FRAME_SIZE = 10;
const SCATTER_CELLS = 24;

/** The PRD says about 2 s; on the tablet the parent found that too short. Never shown, and nothing depends on it (PRD §7). */
const GLANCE_MS = 4000;

export function Dots({ n, hollow = 0 }: { n: number; hollow?: number }) {
  return (
    <div className="dots">
      {Array.from({ length: n + hollow }, (_, i) => (
        <span key={i} className={`dot ${i >= n ? 'dot--hollow' : ''}`} />
      ))}
    </div>
  );
}

/** Full frames first, as in the book: 13 is a full frame and 3 more. */
function TenFrames({ n }: { n: number }) {
  const frames = Math.ceil(n / FRAME_SIZE);
  return (
    <div className={`ten-frames ${frames > 2 ? 'ten-frames--compact' : ''}`}>
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} className="ten-frame">
          {Array.from({ length: FRAME_SIZE }, (_, i) => (
            <span key={i} className="frame-cell">
              {f * FRAME_SIZE + i < n && <span className="dot" />}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Scattered({ cells }: { cells: number[] }) {
  const filled = new Set(cells);
  return (
    <div className="scatter">
      {Array.from({ length: SCATTER_CELLS }, (_, i) => (
        <span key={i} className="scatter-cell">
          {filled.has(i) && <span className="dot" />}
        </span>
      ))}
    </div>
  );
}

/** Shown for a moment, then gone until the child asks to see it again. */
function Glance({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), GLANCE_MS);
    return () => clearTimeout(timer);
  }, [visible]);
  return (
    <div className="glance">
      {visible ? (
        children
      ) : (
        <IconButton label={t('exercise.showAgain')} onClick={() => setVisible(true)}>
          <ReplayIcon />
        </IconButton>
      )}
    </div>
  );
}

/** A collection as the book groups it: full tens, a five, single ones. */
function Groups({ groups }: { groups: number[] }) {
  return (
    <div className="groups-picture">
      {groups.map((size, i) =>
        size === 1 ? (
          <span key={i} className="dot" />
        ) : (
          <div key={i} className={`ten-frame ${size === FRAME_SIZE ? '' : 'ten-frame--five'}`}>
            {Array.from({ length: size }, (_, k) => (
              <span key={k} className="frame-cell">
                <span className="dot" />
              </span>
            ))}
          </div>
        ),
      )}
    </div>
  );
}

/** a + b on two frames: b fills the first frame up to ten, the rest goes on the second. */
function BridgeFrames({ a, b }: { a: number; b: number }) {
  return (
    <div className="ten-frames ten-frames--row">
      {[0, 1].map((f) => (
        <div key={f} className="ten-frame">
          {Array.from({ length: FRAME_SIZE }, (_, i) => {
            const n = f * FRAME_SIZE + i;
            return <span key={i} className="frame-cell">{n < a + b && <span className={`dot ${n >= a ? 'dot--second' : ''}`} />}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

/** a − b on two frames: the second frame empties first, then the rest of b comes off the ten. */
function TakeAwayFrames({ a, b }: { a: number; b: number }) {
  return (
    <div className="ten-frames ten-frames--row">
      {[0, 1].map((f) => (
        <div key={f} className="ten-frame">
          {Array.from({ length: FRAME_SIZE }, (_, i) => {
            const n = f * FRAME_SIZE + i;
            return <span key={i} className="frame-cell">{n < a && <span className={`dot ${n >= a - b ? 'dot--hollow' : ''}`} />}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

/** A number past five as the book's fingers and abacus show it: a five and some more. */
function FiveAndMore({ n }: { n: number }) {
  return (
    <div className="five-and-more">
      <div className="ten-frame ten-frame--five">
        {Array.from({ length: 5 }, (_, k) => (
          <span key={k} className="frame-cell">
            <span className="dot" />
          </span>
        ))}
      </div>
      {n > 5 && <Dots n={n - 5} />}
    </div>
  );
}

/** One of the equal groups: a frame for five and ten, a little box for the rest. */
function Group({ k }: { k: number }) {
  return (
    <div className={`ten-frame group-box group-box--${k}`}>
      {Array.from({ length: k }, (_, i) => (
        <span key={i} className="frame-cell">
          <span className="dot" />
        </span>
      ))}
    </div>
  );
}

/** «5 + 5 + 5 = □» */
function RepeatedSum({ n, k, slot }: { n: number; k: number; slot: ReactNode }) {
  return (
    <div className="expression expression--long">
      {Array.from({ length: n }, (_, i) => [...(i > 0 ? [<span key={`p${i}`}>+</span>] : []), <span key={i}>{formatNumber(k)}</span>]).flat()}
      <span>=</span>
      {slot}
    </div>
  );
}

/** An object with paper clips laid end to end under it, from its left edge. */
function Measured({ length, clips, object }: { length: number; clips: number; object: number }) {
  return (
    <div className="measured">
      <div className={`measured-object measured-object--${object}`} style={{ width: `calc(${length} * var(--clip))` }} role="img" aria-label={t(`measure.object.${object}` as UiKey)} />
      <div className="clips">
        {Array.from({ length: clips }, (_, i) => (
          <span key={i} className="clip" aria-label={t('measure.clip')} />
        ))}
      </div>
    </div>
  );
}

function Note({ value, faded = false, second = false }: { value: number; faded?: boolean; second?: boolean }) {
  return (
    <span className={`note ${faded ? 'note--faded' : ''} ${second ? 'note--second' : ''}`}>
      <strong>{formatNumber(value)}</strong>
      <small>{t('coin.note')}</small>
    </span>
  );
}

/** Things to share, in rows of five or (level 3) spread about; empty plates under them. */
function ShareTable({ total, plates, scattered }: { total: number; plates: number; scattered: boolean }) {
  // a fixed spread, so the same problem always looks the same
  const cells = new Set(Array.from({ length: total }, (_, i) => (i * 7 + 3) % SCATTER_CELLS));
  return (
    <div className="share-table">
      {scattered ? (
        <div className="scatter">
          {Array.from({ length: SCATTER_CELLS }, (_, i) => (
            <span key={i} className="scatter-cell">
              {cells.has(i) && <ObjectPicture id="cookie" />}
            </span>
          ))}
        </div>
      ) : (
        <div className="share-items">
          {Array.from({ length: total }, (_, i) => (
            <ObjectPicture key={i} id="cookie" />
          ))}
        </div>
      )}
      <div className="plates">
        {Array.from({ length: plates }, (_, i) => (
          <span key={i} className="plate" role="img" aria-label={t('share.plate')} />
        ))}
      </div>
    </div>
  );
}

function Coin({ value, unit }: { value: number; unit: 'euro' | 'cent' }) {
  return (
    <span className="coin">
      <strong>{formatNumber(value)}</strong>
      <small>{t(unit === 'euro' ? 'coin.euro' : 'coin.cent')}</small>
    </span>
  );
}

function StoryPictures({ scene }: { scene: Extract<SceneData, { kind: 'story' }> }) {
  const [first, second = first] = scene.objects as [string, string?];
  const row = (id: string, n: number, faded: (i: number) => boolean) => (
    <div className="story-row">
      {Array.from({ length: n }, (_, i) => (
        <ObjectPicture key={i} id={id} faded={faded(i)} />
      ))}
    </div>
  );
  switch (scene.operation) {
    case 'add':
      return (
        <div className="story-pictures">
          {row(first, scene.a, () => false)}
          {row(second, scene.b, () => false)}
        </div>
      );
    case 'subtract':
      return <div className="story-pictures">{row(first, scene.a, (i) => i >= scene.a - scene.b)}</div>;
    case 'missing':
      return <div className="story-pictures">{row(first, scene.b, (i) => i >= scene.a)}</div>;
    case 'multiply':
      // a groups of b
      return <div className="story-pictures story-pictures--groups">{Array.from({ length: scene.a }, (_, g) => <div key={g} className="story-group">{row(first, scene.b, () => false)}</div>)}</div>;
    case 'divide':
      return <div className="story-pictures">{row(first, scene.a, () => false)}</div>;
    case 'twoStep': {
      // the last c of all of them have gone
      const gone = scene.c ?? 0;
      return (
        <div className="story-pictures">
          {row(first, scene.a, (i) => i >= scene.a + scene.b - gone)}
          {row(first, scene.b, (i) => scene.a + i >= scene.a + scene.b - gone)}
        </div>
      );
    }
  }
}

export function Scene({ scene, slot, answerOnLine, readable = false }: { scene: SceneData; slot: ReactNode; answerOnLine: boolean; readable?: boolean }) {
  switch (scene.kind) {
    case 'count':
      return (
        <div className="scene">
          {scene.arrangement === 'frames' && <TenFrames n={scene.n} />}
          {scene.arrangement === 'rows' && <Dots n={scene.n} />}
          {scene.arrangement === 'scattered' && <Scattered cells={scene.cells} />}
          <div className="expression">{slot}</div>
        </div>
      );

    case 'subitize':
      return (
        <div className="scene">
          <Glance>{scene.arrangement === 'frames' ? <TenFrames n={scene.n} /> : <Dots n={scene.n} />}</Glance>
          <div className="expression">{slot}</div>
        </div>
      );

    case 'put':
      return (
        <div className="scene">
          <div className="expression big-number">{formatNumber(scene.n)}</div>
        </div>
      );

    case 'line': {
      if (answerOnLine) {
        return (
          <div className="scene">
            <div className="expression big-number">{formatNumber(scene.target)}</div>
          </div>
        );
      }
      const View = numberLine.View;
      return (
        <div className="scene scene--wide">
          <View state={{ max: scene.max, labels: scene.labels, at: scene.mark }} onChange={() => undefined} readOnly />
          <div className="expression">{slot}</div>
        </div>
      );
    }

    case 'jar':
      return (
        <div className="scene">
          <Glance>
            <div className="jar">
              {Array.from({ length: SCATTER_CELLS }, (_, i) => (
                <span key={i} className="scatter-cell">
                  {scene.cells.includes(i) && <span className="dot" />}
                </span>
              ))}
            </div>
          </Glance>
        </div>
      );

    case 'balance':
      return (
        <div className="scene">
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>+</span>
            {slot}
            <span>=</span>
            <span>{formatNumber(scene.total)}</span>
          </div>
        </div>
      );

    case 'missing':
      return (
        <div className="scene">
          {scene.dots && <Dots n={scene.a} hollow={scene.total - scene.a} />}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>+</span>
            {slot}
            <span>=</span>
            <span>{formatNumber(scene.total)}</span>
          </div>
        </div>
      );

    case 'sub':
      return (
        <div className="scene">
          {scene.dots && <Dots n={scene.a - scene.b} hollow={scene.b} />}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>−</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'whichSign':
      return (
        <div className="scene">
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            {slot}
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            <span>{formatNumber(scene.result)}</span>
          </div>
        </div>
      );

    case 'floor':
      return (
        <div className="scene">
          <div className="building">
            {Array.from({ length: scene.floors }, (_, i) => scene.floors - i).map((f) => (
              <div key={f} className={`floor ${f === scene.floor ? 'floor--lit' : ''}`} />
            ))}
            <div className="ground" />
          </div>
          <div className="expression">
            {slot}
            <span>{t('floor.suffix')}</span>
          </div>
        </div>
      );

    case 'coins':
      return (
        <div className="scene">
          <div className="coins">
            {scene.coins.map((coin, i) => (
              <Coin key={i} value={coin} unit={scene.unit} />
            ))}
          </div>
          <div className="expression">{slot}</div>
        </div>
      );

    case 'exchange':
      return (
        <div className="scene">
          <div className="expression">
            <Coin value={scene.coin} unit={scene.unit} />
            <span>=</span>
            {slot}
            <Coin value={1} unit={scene.unit} />
          </div>
        </div>
      );

    case 'quantity':
    case 'heavier':
    case 'whichShape':
    case 'lengths':
    case 'regroup':
    case 'week':
      return <div className="scene" />;

    case 'groups':
      return (
        <div className="scene">
          <Groups groups={scene.groups} />
          <div className="expression">{slot}</div>
        </div>
      );

    case 'rods':
      return (
        <div className="scene">
          <RodsPicture tens={scene.tens} units={scene.units} cubesFirst={scene.cubesFirst} />
          <div className="expression">{slot}</div>
        </div>
      );

    case 'build':
      return (
        <div className="scene">
          <div className="expression big-number">{formatNumber(scene.n)}</div>
        </div>
      );

    case 'calc': {
      const units = scene.a % FRAME_SIZE;
      // taking more cubes than there are: one rod is already broken, as the child would
      const broken = scene.op === -1 && scene.b > units;
      return (
        <div className="scene">
          {scene.picture && (
            <RodsPicture
              tens={Math.floor(scene.a / FRAME_SIZE) - (broken ? 1 : 0)}
              units={units + (broken ? FRAME_SIZE : 0)}
              extra={scene.op === 1 ? scene.b : 0}
              faded={scene.op === -1 ? scene.b : 0}
            />
          )}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>{scene.op === 1 ? '+' : '−'}</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );
    }

    case 'inverse':
      return (
        <div className="scene">
          <div className="expression expression--given">
            <span>{formatNumber(scene.a)}</span>
            <span>+</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            <span>{formatNumber(scene.a + scene.b)}</span>
          </div>
          <div className="expression">
            <span>{formatNumber(scene.a + scene.b)}</span>
            <span>−</span>
            <span>{formatNumber(scene.taken)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'subBridge':
      return (
        <div className="scene">
          {scene.frames && <TakeAwayFrames a={scene.a} b={scene.b} />}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>−</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'fives':
      return (
        <div className="scene">
          {scene.picture && (
            <div className="dot-groups">
              <FiveAndMore n={scene.a} />
              <FiveAndMore n={scene.b} />
            </div>
          )}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>+</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'neighbour':
      return (
        <div className="scene">
          <div className="expression odometer">
            {scene.direction === -1 && slot}
            <span className="odometer-number">{formatNumber(scene.n)}</span>
            {scene.direction === 1 && slot}
          </div>
        </div>
      );

    case 'times':
      return (
        <div className="scene">
          {scene.show < 3 && (
            <div className="groups-picture">
              {Array.from({ length: scene.n }, (_, i) => (
                <Group key={i} k={scene.k} />
              ))}
            </div>
          )}
          {scene.show === 2 ? <div className="expression">{slot}</div> : <RepeatedSum n={scene.n} k={scene.k} slot={slot} />}
        </div>
      );

    case 'measure':
      return (
        <div className="scene">
          <div className="measure-picture">
            <Measured length={scene.length} clips={scene.length + scene.extra} object={scene.object} />
            {scene.other !== null && <Measured length={scene.other} clips={scene.other} object={(scene.object + 1) % 3} />}
          </div>
          <div className="expression">{slot}</div>
        </div>
      );

    case 'tensCalc': {
      const notesA = scene.a / FRAME_SIZE;
      const notesB = scene.b / FRAME_SIZE;
      return (
        <div className="scene">
          {scene.notes && (
            <div className="notes">
              {Array.from({ length: notesA }, (_, i) => (
                <Note key={i} value={FRAME_SIZE} faded={scene.op === -1 && i >= notesA - notesB} />
              ))}
              {scene.op === 1 && Array.from({ length: notesB }, (_, i) => <Note key={notesA + i} value={FRAME_SIZE} second />)}
            </div>
          )}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>{scene.op === 1 ? '+' : '−'}</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );
    }

    case 'tenStep':
      return (
        <div className="scene">
          <div className="expression">
            <span className="odometer-number">{formatNumber(scene.n)}</span>
            <span>{scene.direction === 1 ? '+' : '−'}</span>
            <span>{formatNumber(FRAME_SIZE)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'wallet':
      return (
        <div className="scene">
          <div className="notes">
            {scene.notes.map((v, i) => (
              <Note key={i} value={v} />
            ))}
            {scene.coins.map((v, i) => (
              <Coin key={`c${i}`} value={v} unit="euro" />
            ))}
          </div>
          <div className="expression">{slot}</div>
        </div>
      );

    case 'share':
      return (
        <div className="scene">
          <ShareTable total={scene.total} plates={scene.plates} scattered={scene.scattered} />
          <div className="expression">{slot}</div>
        </div>
      );

    case 'countShapes':
      return (
        <div className="scene">
          <div className="shapes-field">
            {scene.shapes.map((s, i) => (
              <ShapePicture key={i} shape={s} size={96} />
            ))}
          </div>
          <div className="expression">{slot}</div>
        </div>
      );

    case 'pattern':
      return (
        <div className="scene">
          <div className="pattern-row">
            {scene.sequence.map((item, i) => (item === -1 ? <span key={i} className="pattern-gap" /> : <PatternItem key={i} item={item} size={64} />))}
          </div>
        </div>
      );

    case 'commute':
      return (
        <div className="scene">
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>+</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            <span>{formatNumber(scene.b)}</span>
            <span>+</span>
            {slot}
          </div>
        </div>
      );

    case 'sentence':
      return (
        <div className="scene">
          <div className="dot-groups">
            <Dots n={scene.a} />
            <Dots n={scene.b} />
          </div>
        </div>
      );

    case 'match':
      return (
        <div className="scene">
          <div className="match">
            <div className="match-row">
              {Array.from({ length: scene.have }, (_, i) => (
                <ObjectPicture key={i} id="kitten" />
              ))}
            </div>
            <div className={`match-row ${scene.spread ? 'match-row--spread' : ''}`}>
              {Array.from({ length: scene.give }, (_, i) => (
                <ObjectPicture key={i} id="cookie" />
              ))}
            </div>
          </div>
          <div className="expression">{slot}</div>
        </div>
      );

    case 'addMany':
      return (
        <div className="scene">
          {scene.dots && (
            <div className="dot-groups">
              {scene.terms.map((n, i) => (
                <Dots key={i} n={n} />
              ))}
            </div>
          )}
          <div className="expression">
            {scene.terms.flatMap((n, i) => [...(i > 0 ? [<span key={`plus${i}`}>+</span>] : []), <span key={i}>{formatNumber(n)}</span>])}
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'bridge':
      return (
        <div className="scene">
          {scene.frames && <BridgeFrames a={scene.a} b={scene.b} />}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>+</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'story':
      return (
        <div className="scene">
          {readable && <p className="story-text">{scene.text}</p>}
          {scene.pictures && <StoryPictures scene={scene} />}
          <div className="expression">{slot}</div>
        </div>
      );

    case 'compare':
      return (
        <div className="scene">
          {scene.dots && (
            <div className="dot-groups">
              <Dots n={scene.a} />
              <Dots n={scene.b} />
            </div>
          )}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            {slot}
            <span>{formatNumber(scene.b)}</span>
          </div>
        </div>
      );

    case 'add':
      return (
        <div className="scene">
          {scene.dots && (
            <div className="dot-groups">
              <Dots n={scene.a} />
              <Dots n={scene.b} />
            </div>
          )}
          <div className="expression">
            <span>{formatNumber(scene.a)}</span>
            <span>+</span>
            <span>{formatNumber(scene.b)}</span>
            <span>=</span>
            {slot}
          </div>
        </div>
      );

    case 'house': {
      const known = (
        <div className="room">
          <span>{formatNumber(scene.known)}</span>
        </div>
      );
      const missing = <div className="room">{slot}</div>;
      return (
        <div className="scene">
          {scene.dots && <Dots n={scene.known} hollow={scene.whole - scene.known} />}
          <div className="house">
            <div className="house-roof">
              <span>{formatNumber(scene.whole)}</span>
            </div>
            <div className="house-rooms">
              {scene.missingOnRight ? known : missing}
              {scene.missingOnRight ? missing : known}
            </div>
          </div>
        </div>
      );
    }
  }
}
