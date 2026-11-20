// The tune of the fluency round: each right answer adds a note, made by the device so
// there are no files. A device without Web Audio simply stays quiet.

/** A short original phrase, in hertz. */
export const MELODY_NOTES = [523.25, 659.25, 783.99, 880, 783.99, 659.25, 698.46, 587.33];
const FINISH_NOTES = [523.25, 659.25, 783.99, 1046.5];

const NOTE_SECONDS = 0.32;
const LOUDNESS = 0.18;
const FINISH_STEP_SECONDS = 0.14;

export interface Melody {
  /** call from a tap: browsers only allow sound that a tap started */
  unlock(): void;
  /** the note for the nth right answer */
  note(index: number): void;
  finish(): void;
}

export const noteAt = (index: number): number => MELODY_NOTES[index % MELODY_NOTES.length]!;

/**
 * One context for the whole app: browsers allow only a few at a time (Safari about four),
 * and an app left open for days plays many fluency rounds.
 */
let shared: AudioContext | null = null;

export function createMelody(): Melody {
  let context: AudioContext | null = null;

  const tone = (hz: number, delay: number) => {
    if (!context) return;
    // back from the background mid-round: the OS may have suspended it
    if (context.state !== 'running') void context.resume();
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = hz;
    gain.gain.setValueAtTime(LOUDNESS, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + NOTE_SECONDS);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + NOTE_SECONDS);
  };

  return {
    unlock() {
      try {
        shared ??= new AudioContext();
        context = shared;
        // also wakes a context the OS suspended while the app was in the background
        void context.resume();
      } catch {
        context = null;
      }
    },
    note: (index) => tone(noteAt(index), 0),
    finish: () => FINISH_NOTES.forEach((hz, i) => tone(hz, i * FINISH_STEP_SECONDS)),
  };
}
