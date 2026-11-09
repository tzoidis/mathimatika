// Prints the number clips as JSON for generate.py, which is in Python and must
// not keep its own copy of the Greek forms.

import { numberClips } from '../../src/audio/numberClips.ts';

process.stdout.write(JSON.stringify(numberClips()));
