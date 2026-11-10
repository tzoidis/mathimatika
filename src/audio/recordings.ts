// The clips the app needs. Instructions, praise and hints are a closed set and are
// never spoken by the device voice; numbers and joined phrases may fall back to it (PRD §9).

import audio from '../content/audio.json' with { type: 'json' };
import { normalizeText } from '../engine/text.ts';
import golden from '../content/word-problems.golden.json' with { type: 'json' };
import { numberClips } from './numberClips.ts';

export type AudioKind = 'instruction' | 'praise' | 'hint' | 'number' | 'phrase' | 'problem';

/** Kinds that may fall back to the local TTS voice. */
export const TTS_KINDS: ReadonlySet<AudioKind> = new Set(['number', 'phrase']);

export function audioKey(kind: AudioKind, key: string): string {
  return `${kind}/${normalizeText(key)}`;
}

export interface RequiredRecording {
  key: string;
  kind: AudioKind;
  text: string;
}

export function requiredRecordings(): RequiredRecording[] {
  return [
    ...Object.entries(audio.instructions).map(([id, text]) => ({ key: audioKey('instruction', id), kind: 'instruction' as const, text })),
    ...audio.praise.map((text, i) => ({ key: audioKey('praise', String(i + 1)), kind: 'praise' as const, text })),
    ...Object.entries(audio.strategyPraise).map(([id, text]) => ({ key: audioKey('praise', id), kind: 'praise' as const, text })),
    ...Object.entries(audio.hints).map(([id, text]) => ({ key: audioKey('hint', id), kind: 'hint' as const, text })),
    ...numberClips().map(({ key, text }) => ({ key: audioKey('number', key), kind: 'number' as const, text })),
    // word problems are recorded whole, exactly as the parent approved them
    ...golden.problems.map((p) => ({ key: audioKey('problem', p.id), kind: 'problem' as const, text: p.speech })),
  ];
}

/** The general praise, for a correct answer with no particular strategy to name. */
export function praiseKeys(): string[] {
  return audio.praise.map((_, i) => String(i + 1));
}
