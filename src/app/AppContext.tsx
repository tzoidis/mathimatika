// App-wide services: database, settings, audio.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createBrowserAudioService, type AudioService, type VoiceInfo } from '../audio/AudioService.ts';
import { bundledUrl } from '../audio/bundled.ts';
import { ensureChild, openDb, type MathDb } from '../storage/db.ts';
import { DEFAULT_CHILD_ID, type Child, type Settings } from '../storage/schema.ts';

export interface App {
  db: MathDb;
  audio: AudioService;
  child: Child;
  settings: Settings;
  voice: VoiceInfo | null;
  /** re-read child and settings after a write */
  refresh(): Promise<void>;
  /** look for the local voice again (call after the first tap: iOS may only list voices then) */
  recheckVoice(): void;
}

const AppContext = createContext<App | null>(null);

export function useApp(): App {
  const app = useContext(AppContext);
  if (!app) throw new Error('useApp outside AppProvider');
  return app;
}

interface Loaded {
  db: MathDb;
  audio: AudioService;
  child: Child;
  settings: Settings;
  voice: VoiceInfo | null;
}

export interface AppProviderProps {
  children: ReactNode;
  /** tests and the smoke test inject their own */
  audio?: AudioService;
  dbName?: string;
  fallback: ReactNode;
}

// All audio is produced at build time, so no parent recordings exist (PRD §9).
const noRecording = async () => undefined;

export function AppProvider({ children, audio, dbName, fallback }: AppProviderProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await openDb(dbName ? { name: dbName } : {});
      const settings = await ensureChild(db);
      const child = (await db.children.get(DEFAULT_CHILD_ID))!;
      const service = audio ?? createBrowserAudioService(noRecording, bundledUrl);
      if (!cancelled) setLoaded({ db, audio: service, child, settings, voice: null });
      const voice = await service.voice();
      if (!cancelled) setLoaded((l) => l && { ...l, voice });
    })();
    return () => {
      cancelled = true;
    };
  }, [audio, dbName]);

  const refresh = useCallback(async () => {
    if (!loaded) return;
    const [child, settings] = await Promise.all([loaded.db.children.get(DEFAULT_CHILD_ID), loaded.db.settings.get(DEFAULT_CHILD_ID)]);
    setLoaded((l) => l && { ...l, child: child ?? l.child, settings: settings ?? l.settings });
  }, [loaded]);

  const recheckVoice = useCallback(() => {
    if (!loaded) return;
    void loaded.audio.voice().then((voice) => setLoaded((l) => l && (l.voice?.name === voice?.name ? l : { ...l, voice })));
  }, [loaded]);

  const app = useMemo<App | null>(() => (loaded ? { ...loaded, refresh, recheckVoice } : null), [loaded, refresh, recheckVoice]);

  if (!app) return <>{fallback}</>;
  return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
}
