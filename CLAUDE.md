# Mathimatika

Offline PWA for practising primary-school maths (grades 1-6), following the class book unit by unit. Sibling of Glossa (`C:\Code\Glossa`). The spec is `docs/PRD – Παιχνίδι Μαθηματικών Δημοτικού (Α'–ΣΤ').md`; read the relevant section before changing behaviour. Where it is silent, the decisions of the Glossa PRD apply.

## Commands

- `npm run dev` – Vite dev server
- `npm run dev:lan` – dev server reachable from the tablet on the home Wi-Fi (plain http: no secure-context APIs without a fallback)
- `npm test` – Vitest (`npm run test:watch` for watch mode)
- `npm run validate-content` – checks `src/content/*.json` (runs in CI)
- `npm run typecheck` – `tsc -b`
- `npm run build` – typecheck + production build
- `npm run ci` – everything CI runs, in order
- `npm run build && npm run preview` – production build with the service worker (the dev server has no service worker)
- `bash scripts/icons/render.sh` – re-renders the PNG app icons from `public/icon.svg` with headless Edge
- `python scripts/generate-audio/generate.py` – makes the clips that are missing or whose text changed, with the ElevenLabs voice «Eleni» (same voice and settings as Glossa). `--dry-run` lists them and spends nothing. Run it after changing a phrase in `audio.json` or a form in `numberWords.json`.

Node ≥ 22.18 (scripts in `scripts/` run as plain `.ts` via Node type stripping, so use only erasable TS syntax there).

## Rules

- **`C:\Code\Glossa` is read-only here.** Read it as a model and copy what fits; never change a file in it.
- **The ElevenLabs key lives only in `.env` (or the PC's `~/.elevenlabs-key`), never in the app or in git.** The app never calls ElevenLabs.
- **No network calls in app code.** No `fetch`, XHR, WebSocket, external URLs, analytics or cookies. `src/repoRules.test.ts` enforces this.
- **No new dependency without the user's approval.** The stack is the one of Glossa (Vite, React, TypeScript, Dexie, vite-plugin-pwa, Vitest, `fake-indexeddb` for tests). `fast-check` is approved by the PRD for ΜΘ1; add each only in the milestone that needs it.
- **NFC everywhere.** Content files must already be NFC (`validate-content` checks).
- **No Greek text hardcoded outside `src/content/`.** UI strings go in `src/content/ui.el.json` and are read with `t()` from `src/i18n.ts`. Test files are exempt. `src/repoRules.test.ts` enforces this.
- **Never an `<input>` for numbers**, for the child or the parent: use `src/ui/NumPad.tsx`, so the system keyboard never opens.
- **In `math-core` no float, `parseFloat`, `toFixed`, `Intl` or `Math.random`.** Everything goes through `Rational` and `formatNumber`. `math-core` has no React.
- **No string with a number built by template literal;** always `formatNumber`.
- **Every new generator comes with** property tests, an independent check of the answer, detectors and their simulators.
- **Problem text only from template + lexicon.** A change to a golden file needs the parent's approval.
- **Every manipulative implements `Manipulative`,** with tap instead of drag and targets ≥ 96px.
- **Nothing visible about time or speed, anywhere.** No timers, streaks, leaderboards; never the word «λάθος» in audio, no red X, no shaking.
- Instructions and praise always ship as clips in one voice (Eleni). Device TTS is only a fallback for numbers and joined phrases, only with a local `el-GR` voice.
- In grades 1-2 every problem is read aloud automatically and «listen» does **not** count as help: the opposite of Glossa (PRD §7).

## Deliberate differences from the PRD text

- Clips live in `src/audio/files/<kind>/<key>.mp3`, not `public/audio/` (PRD §9): Vite hashes them, they are precached, and `src/audio/bundled.test.ts` fails on a missing one. Decided with the user at ΜΘ0.
- `src/` also has `app/` (context, theme, updates), `storage/` (Dexie) and `ui/`, which the PRD's folder list omits.

## PWA

- vite-plugin-pwa, `registerType: 'prompt'`: a new version waits and is applied only on the start screen or from the parent screen (`src/app/appUpdate.ts`), never mid-round.
- Everything is precached, including bundled clips; `base: './'` so the build works at a domain root or a subpath.
- `navigator.storage.persist()` runs at startup when installed.
- Hosted at https://tzoidis.github.io/mathimatika/ (repo `tzoidis/mathimatika`, public). Every push to `main` runs CI and, if it passes, deploys `dist/` to GitHub Pages.
- **Same origin as Glossa** (`tzoidis.github.io`): IndexedDB names (`mathimatika`, `mathimatika-backups`) and any future storage key must never collide with Glossa's. The manifest has its own `id`.
- Manual tablet checks: `docs/tablet-checklist.md`.

## Conventions

- The pure session flow is `src/engine/session.ts`: 3 fixed rounds (warm-up, workshop, mix) × 5 questions, no station choice in grades 1-2.
- `src/exercises/registry.ts` decides what a round plays; until ΜΘ3 it is `placeholder`, which writes no answers or stars (`countsForProgress: false`).
- `AnswerLog` has the same shape as Glossa's (PRD §9). Exercises leave `childId` empty; the session fills it.
- Theme is data per age band: `src/app/theme.ts` sets `<html data-band>`, and the tokens are in `src/index.css`. Only `early` exists so far.
- Number words: every form is written out in `src/content/numberWords.json` (Greek stays out of code); `numberToGreekWords` only assembles them. `numberRequest(n, gender, case)` picks the clip; 0-100 have clips, anything else falls back to the local voice.
- `AudioService.ts` is deliberately identical to Glossa's so a fix can be carried over. Parent recordings are not used: `getRecording` always returns nothing.
- Migrations are append-only; `openDb` snapshots before upgrading. Tables for the review queue (ΜΘ6) and the world (ΜΘ5) are added in those milestones.
- `src/content/audio-catalog.json` records what each clip was made from; `validate-content` fails if a phrase changed without its clip.

## Layout

```
src/
  content/       ui.el.json, audio.json, audio-catalog.json; later curriculum, book-map, lexicon, templates
  engine/        session, rng, shared types; later adaptive and review
  audio/         AudioService (+ mock), clip list, bundled files
  math-core/     Rational, formatNumber/parseNumber, numberToGreekWords; later generators, detectors. No React
  manipulatives/ (ΜΘ4) ten frame, number line, cubes, balance
  exercises/     one folder per mechanism
  screens/       Start, Home, Session, Parent
  storage/       Dexie db, migrations, backup
  app/ ui/       context, theme, updates; shared components
scripts/         validate-content.ts, generate-audio/, icons/
```

## Milestones (PRD §10)

ΜΘ0 skeleton, CI, audio, empty 3 × 5 session · ΜΘ1 `math-core`, number clips · ΜΘ2 skill graph, book map, `validate-content` · ΜΘ3 keypad, `check`, 3 generators · ΜΘ4 manipulatives, remaining MVP generators · ΜΘ5 fluency, Workshop · ΜΘ6 adaptive, review queue, skill map · ΜΘ7 word problems · ΜΘ8+ one per grade.
