// Checks src/content/*.json (runs in CI). ΜΘ2 adds the skill graph and book maps.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

const audio = read<{ instructions: Record<string, string>; praise: string[] }>('audio.json');
const catalog = read<Record<string, CatalogEntry>>('audio-catalog.json');
const clips: [string, string][] = [
  ...Object.entries(audio.instructions).map(([key, text]): [string, string] => [`instruction/${key}`, text]),
  ...audio.praise.map((text, i): [string, string] => [`praise/${i + 1}`, text]),
];
for (const [clip, text] of clips) {
  if (!existsSync(join(root, 'src', 'audio', 'files', `${clip}.mp3`))) errors.push(`${clip}: no mp3 file`);
  if (catalog[clip]?.text !== text) errors.push(`${clip}: the clip was not made from this text (run scripts/generate-audio/generate.py)`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`content ok: ${clips.length} clips, ${Object.keys(ui).length} ui strings`);
