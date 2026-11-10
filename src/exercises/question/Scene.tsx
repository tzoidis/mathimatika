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
