// Service worker and app updates (PRD §7, §8). A new version is downloaded in the
// background but applied only on the start screen, on arriving home, or from the
// parent screen, never in the middle of a round. An installed app may stay open in
// the background for weeks, so it also looks for a new version each time it comes back.

import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

let updateReady = false;
let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();

export function startServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  applyUpdate = registerSW({
    onNeedRefresh() {
      updateReady = true;
      listeners.forEach((l) => l());
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !updateReady) void registration.update().catch(() => undefined);
      });
    },
  });
}

/** True once a new version is waiting. */
export const isUpdateReady = (): boolean => updateReady;

export function useUpdateReady(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => updateReady,
  );
}

/** Installs the waiting version and reloads. Call only where no round is running. */
export function installUpdate(): void {
  void applyUpdate?.(true);
}

export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** PRD §7: once installed, ask the browser never to evict our data. */
export async function persistIfInstalled(installed: boolean): Promise<boolean | null> {
  if (!installed || !navigator.storage?.persist) return null;
  return (await navigator.storage.persisted()) || navigator.storage.persist();
}
