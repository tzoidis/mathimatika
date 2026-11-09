import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // relative paths: the same build works at a domain root or a subpath (GitHub Pages)
  base: './',
  plugins: [
    react(),
    VitePWA({
      // never swap versions on its own: the app applies an update only on the start
      // screen or from the parent screen, never in the middle of a round
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        // its own identity: Glossa is installed from the same origin (tzoidis.github.io)
        id: '/mathimatika/',
        name: 'Μαθηματικά',
        short_name: 'Μαθηματικά',
        lang: 'el',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fdf8ee',
        theme_color: '#2563a8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // everything the app needs offline, including bundled recordings
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2,mp3,m4a,aac,ogg,webm,wav}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    // property tests sweep every generator × level × seed
    testTimeout: 30_000,
  },
});
