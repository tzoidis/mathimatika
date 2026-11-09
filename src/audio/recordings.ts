// The clips the app needs. Instructions and praise are a closed set and are never
// spoken by the device voice; numbers and joined phrases may fall back to it (PRD §9).

import audio from '../content/audio.json' with { type: 'json' };
import { normalizeText } from '../engine/text.ts';

export type AudioKind = 'instruction' | 'praise' | 'hint' | 'number' | 'phrase';

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
  ];
}

export function praiseKeys(): string[] {
  return audio.praise.map((_, i) => String(i + 1));
}
