import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './app/AppContext.tsx';
import { themeFor } from './app/theme.ts';
import { Home } from './screens/Home.tsx';
import { Parent } from './screens/parent/Parent.tsx';
import { Session } from './screens/Session.tsx';
import { Start } from './screens/Start.tsx';
import { ErrorBoundary } from './ui/ErrorBoundary.tsx';
import { Mascot } from './ui/Mascot.tsx';

type Screen = { name: 'start' } | { name: 'home' } | { name: 'session' } | { name: 'parent'; from: 'start' | 'home' };

function Screens() {
  const { settings } = useApp();
  const [screen, setScreen] = useState<Screen>({ name: 'start' });
  const home = () => setScreen({ name: 'home' });

  useEffect(() => {
    document.documentElement.dataset.band = themeFor(settings.grade);
  }, [settings.grade]);

  return (
    <div className={`app ${settings.leftHanded ? 'left-handed' : ''}`}>
      <ErrorBoundary onHome={home}>
        {screen.name === 'start' && <Start onGo={home} onParent={() => setScreen({ name: 'parent', from: 'start' })} />}
        {screen.name === 'home' && <Home onPlay={() => setScreen({ name: 'session' })} onParent={() => setScreen({ name: 'parent', from: 'home' })} />}
        {screen.name === 'session' && <Session onHome={home} />}
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
    >
      <Screens />
    </AppProvider>
  );
}
