// What the question looks like, apart from whatever the child answers with.

import { useEffect, useState, type ReactNode } from 'react';
import { t } from '../../i18n.ts';
import { numberLine } from '../../manipulatives/numberLine.tsx';
import { formatNumber } from '../../math-core/format.ts';
import type { Scene as SceneData } from '../../math-core/generators/types.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { ReplayIcon } from '../../ui/Icons.tsx';

const FRAME_SIZE = 10;
const SCATTER_CELLS = 24;

/** Long enough to see, too short to count. Never shown, and nothing depends on it (PRD §7). */
const GLANCE_MS = 2000;

function Dots({ n, hollow = 0 }: { n: number; hollow?: number }) {
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
    <div className="ten-frames">
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

export function Scene({ scene, slot, answerOnLine }: { scene: SceneData; slot: ReactNode; answerOnLine: boolean }) {
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
