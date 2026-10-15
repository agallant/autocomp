import type { StyleVoice } from '../style'

/** Pulses (ticks) per quarter note for Standard MIDI File export. */
export const MIDI_PPQ = 480

/** GM channel (0-based) for each accompaniment voice. */
export const VOICE_CHANNEL: Record<StyleVoice, number> = {
  bass: 0,
  piano: 1,
  drums: 9,
}

/** GM program numbers for pitched voices (drums use the kit on ch. 10). */
export const VOICE_PROGRAM: Record<Exclude<StyleVoice, 'drums'>, number> = {
  bass: 32, // Acoustic Bass
  piano: 0, // Acoustic Grand Piano
}

/** Style note placed on an absolute beat timeline from the form start. */
export type AbsoluteMidiNote = {
  voice: StyleVoice
  midi: number
  /** Absolute start in beats from the first downbeat. */
  startBeat: number
  durationBeats: number
  /** 0–1 velocity. */
  velocity: number
}
