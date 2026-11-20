import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './app/AppContext.tsx';
import { useFit } from './app/fit.ts';
import { themeFor } from './app/theme.ts';
import { Home } from './screens/Home.tsx';
import { Parent } from './screens/parent/Parent.tsx';
import { Session } from './screens/Session.tsx';
import { Start } from './screens/Start.tsx';
import { StorageFailed } from './screens/StorageFailed.tsx';
import { Workshop } from './screens/workshop/Workshop.tsx';
import { ErrorBoundary } from './ui/ErrorBoundary.tsx';
import { Mascot } from './ui/Mascot.tsx';

// development only: one exercise at one stage (src/dev/TryScreen.tsx); not in the production build
const TryScreen = import.meta.env.DEV ? lazy(() => import('./dev/TryScreen.tsx')) : null;
const trying = import.meta.env.DEV && new URLSearchParams(location.search).has('try');

type Screen = { name: 'start' } | { name: 'home' } | { name: 'session' } | { name: 'workshop' } | { name: 'parent'; from: 'start' | 'home' } | { name: 'try' };

function Screens() {
  const { settings } = useApp();
  const [screen, setScreen] = useState<Screen>(trying ? { name: 'try' } : { name: 'start' });
  const home = () => setScreen({ name: 'home' });
  useFit();

  useEffect(() => {
    document.documentElement.dataset.band = themeFor(settings.grade);
  }, [settings.grade]);

  return (
    <div className={`app ${settings.leftHanded ? 'left-handed' : ''}`}>
      <ErrorBoundary onHome={home}>
        {screen.name === 'start' && <Start onGo={home} onParent={() => setScreen({ name: 'parent', from: 'start' })} />}
        {screen.name === 'home' && <Home onPlay={() => setScreen({ name: 'session' })} onWorkshop={() => setScreen({ name: 'workshop' })} onParent={() => setScreen({ name: 'parent', from: 'home' })} />}
        {screen.name === 'session' && <Session onHome={home} onWorkshop={() => setScreen({ name: 'workshop' })} />}
        {screen.name === 'workshop' && <Workshop onHome={home} />}
        {screen.name === 'try' && TryScreen && (
          <Suspense fallback={null}>
            <TryScreen search={location.search} />
          </Suspense>
        )}
        {/* back to «Πάμε!» when opened there: its tap is what unlocks the sound */}
        {screen.name === 'parent' && <Parent onClose={() => (screen.from === 'start' ? setScreen({ name: 'start' }) : home())} />}
      </ErrorBoundary>
    </div>
  );
}

export function App() {
  return (
    <AppProvider
      fallback={
        <main className="screen screen--center">
          <Mascot mood="thinking" />
        </main>
      }
      failed={<StorageFailed />}
    >
      <Screens />
    </AppProvider>
  );
}
