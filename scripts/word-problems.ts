// Writes the golden word problems from the templates and the lexicon, with a readable
// copy for the parent in docs/. `--approve` records the parent's approval of exactly
// these problems; validate-content fails while the file and the approval differ.
//
//   node scripts/word-problems.ts            regenerate, keep the approval if unchanged
//   node scripts/word-problems.ts --approve  only after the parent has read docs/word-problems.md

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateGolden, goldenHash, type Lexicon, type TemplateFile } from '../src/math-core/wordProblems.ts';

const root = join(import.meta.dirname, '..');
const content = join(root, 'src', 'content');
const read = <T>(name: string): T => JSON.parse(readFileSync(join(content, name), 'utf8')) as T;

const templates = read<TemplateFile>('word-problems.json');
const problems = generateGolden(templates, read<Lexicon>('lexicon.json'));
const goldenPath = join(content, 'word-problems.golden.json');
let approvedHash: string | null = null;
try {
  approvedHash = (JSON.parse(readFileSync(goldenPath, 'utf8')) as { approvedHash: string | null }).approvedHash;
} catch {
  // first run
}
if (process.argv.includes('--approve')) approvedHash = goldenHash(problems);

writeFileSync(goldenPath, JSON.stringify({ approvedHash, problems }, null, 2) + '\n', 'utf8');

const lines = ['# Προβλήματα με λόγια: golden αρχείο', '', 'Αυτά ακριβώς θα ακούει και θα βλέπει το παιδί. Το κείμενο στην οθόνη έχει ψηφία· ο ήχος λέει τους αριθμούς ολογράφως.', ''];
for (const template of [...new Set(problems.map((p) => p.template))]) {
  lines.push(`## ${templates.templates.find((x) => x.id === template)?.title ?? template}`, '');
  for (const p of problems.filter((x) => x.template === template)) lines.push(`${p.id.split('-')[1]}. ${p.text} (απάντηση: ${p.answer})`);
  lines.push('');
}
writeFileSync(join(root, 'docs', 'word-problems.md'), lines.join('\n'), 'utf8');

const approved = approvedHash === goldenHash(problems);
console.log(`${problems.length} problems; ${approved ? 'approved' : 'NOT approved by the parent yet'}`);
