// Checks src/content/*.json (runs in CI). «Every skill has a generator» (PRD §9) cannot
// hold until the remaining generators exist (ΜΘ4); until then a named one must be real.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { numberClips } from '../src/audio/numberClips.ts';
import { validateCurriculum } from '../src/engine/curriculum.ts';
import type { Curriculum, SkillGraph } from '../src/engine/types.ts';
import { GENERATORS } from '../src/math-core/generators/index.ts';
import { generateGolden, goldenHash, type Lexicon, type TemplateFile, type WordProblem } from '../src/math-core/wordProblems.ts';

const root = join(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content');
const errors: string[] = [];

interface CatalogEntry {
  text: string;
}

const read = <T>(name: string): T => JSON.parse(readFileSync(join(contentDir, name), 'utf8')) as T;

for (const name of readdirSync(contentDir).filter((f) => f.endsWith('.json'))) {
  const text = readFileSync(join(contentDir, name), 'utf8');
  if (text !== text.normalize('NFC')) errors.push(`${name}: not NFC`);
  JSON.parse(text);
}

const ui = read<Record<string, unknown>>('ui.el.json');
for (const [key, value] of Object.entries(ui)) {
  if (typeof value !== 'string' || value.trim() === '') errors.push(`ui.el.json: ${key} is not text`);
}

const audio = read<{ instructions: Record<string, string>; praise: string[]; strategyPraise: Record<string, string>; hints: Record<string, string> }>('audio.json');
const catalog = read<Record<string, CatalogEntry>>('audio-catalog.json');
const clips: [string, string][] = [
  ...Object.entries(audio.instructions).map(([key, text]): [string, string] => [`instruction/${key}`, text]),
  ...audio.praise.map((text, i): [string, string] => [`praise/${i + 1}`, text]),
  ...Object.entries(audio.strategyPraise).map(([key, text]): [string, string] => [`praise/${key}`, text]),
  ...Object.entries(audio.hints).map(([key, text]): [string, string] => [`hint/${key}`, text]),
  ...numberClips().map(({ key, text }): [string, string] => [`number/${key}`, text]),
  ...read<{ problems: WordProblem[] }>('word-problems.golden.json').problems.map((p): [string, string] => [`problem/${p.id}`, p.speech]),
];

// PRD §6: at least 15 different praises; never these words to the child
const MIN_PRAISES = 15;
if (audio.praise.length + Object.keys(audio.strategyPraise).length < MIN_PRAISES) errors.push(`fewer than ${MIN_PRAISES} praises`);
const BANNED = /λάθος|αποτυχ|έξυπν/iu;
for (const [clip, text] of clips) if (BANNED.test(text)) errors.push(`${clip}: says something the child must never hear: ${text}`);
for (const [clip, text] of clips) {
  if (!existsSync(join(root, 'src', 'audio', 'files', `${clip}.mp3`))) errors.push(`${clip}: no mp3 file`);
  if (catalog[clip]?.text !== text) errors.push(`${clip}: the clip was not made from this text (run scripts/generate-audio/generate.py)`);
}

const graphFiles = readdirSync(contentDir).filter((f) => /^skills\.\d\.json$/.test(f));
if (graphFiles.length === 0) errors.push('no skill graph');
let skillCount = 0;
for (const name of graphFiles) {
  const mapName = name.replace('skills', 'book-map');
  if (!existsSync(join(contentDir, mapName))) {
    errors.push(`${name}: no ${mapName}`);
    continue;
  }
  const graph = read<SkillGraph>(name);
  skillCount += graph.skills.length;
  errors.push(...validateCurriculum(graph, read<Curriculum>(mapName), GENERATORS).map((e) => `${name}: ${e}`));
}

// PRD §9: the golden file is what the templates make, and the parent approved exactly it
const golden = read<{ approvedHash: string | null; problems: WordProblem[] }>('word-problems.golden.json');
const regenerated = generateGolden(read<TemplateFile>('word-problems.json'), read<Lexicon>('lexicon.json'));
if (JSON.stringify(regenerated) !== JSON.stringify(golden.problems)) errors.push('word-problems.golden.json: out of date (run node scripts/word-problems.ts)');
if (golden.approvedHash !== goldenHash(golden.problems)) errors.push('word-problems.golden.json: not approved by the parent (docs/word-problems.md, then node scripts/word-problems.ts --approve)');

// PRD §3: a home activity belongs to a chapter of the book
for (const name of readdirSync(contentDir).filter((f) => /^home\.\d\.json$/.test(f))) {
  const units = read<Curriculum>(name.replace('home', 'book-map')).units.map((u) => u.id);
  const activities = read<{ activities: { id: string; unit: string }[] }>(name).activities;
  if (new Set(activities.map((a) => a.id)).size !== activities.length) errors.push(`${name}: an id appears twice`);
  for (const a of activities) if (!units.includes(a.unit)) errors.push(`${name}: ${a.id} is in no chapter of the book`);
}

const letters = read<{ units: { graphemes: string[] }[] }>('letters.json').units.flatMap((u) => u.graphemes);
if (letters.length === 0) errors.push('letters.json: no letters');
if (new Set(letters).size !== letters.length) errors.push('letters.json: a letter appears twice');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`content ok: ${clips.length} clips, ${skillCount} skills, ${letters.length} letters, ${Object.keys(ui).length} ui strings`);
