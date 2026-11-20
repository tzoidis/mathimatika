// The child's screens are laid out for a tablet and checked at 1024×768 and 768×1024.
// A smaller screen, down to a phone, shows the same layout scaled down as a whole (CSS
// zoom), so nothing has to be laid out twice and nothing spills off the edge. Larger
// screens are never scaled up. The parent's screens are documents and are not scaled.
//
// Two scales: `fit` for the questions, which need a whole tablet, and `fit-light` for the
// simple screens (home, break, end, Workshop), which fit in far less and so keep bigger buttons.

import { useEffect } from 'react';

interface Size {
  w: number;
  h: number;
}

/** The smallest screen each kind of layout is checked at, per orientation. */
const QUESTION = { landscape: { w: 1024, h: 768 }, portrait: { w: 768, h: 1024 } };
const LIGHT = { landscape: { w: 640, h: 560 }, portrait: { w: 360, h: 560 } };

function scaleFor(ref: { landscape: Size; portrait: Size }, width: number, height: number): number {
  const r = height > width ? ref.portrait : ref.landscape;
  return Math.min(1, width / r.w, height / r.h);
}

/** How much to scale a question for a screen of this size: 1 on a tablet, about 0.5 on a phone. */
export const fitScale = (width: number, height: number) => scaleFor(QUESTION, width, height);

/** The same for the simple screens. */
export const fitLightScale = (width: number, height: number) => scaleFor(LIGHT, width, height);

/** Keeps --fit, --fit-light and the scaled sizes on <html> in step with the screen. */
export function useFit() {
  useEffect(() => {
    const root = document.documentElement;
    const set = (name: string, scale: number, w: number, h: number) => {
      root.style.setProperty(`--${name}`, String(scale));
      root.style.setProperty(`--${name}-w`, String(w / scale) + 'px');
      root.style.setProperty(`--${name}-h`, String(h / scale) + 'px');
    };
    const update = () => {
      // the layout viewport: unlike innerWidth, it does not grow when something spills over
      const w = root.clientWidth;
      const h = root.clientHeight;
      set('fit', fitScale(w, h), w, h);
      set('fit-light', fitLightScale(w, h), w, h);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
}
