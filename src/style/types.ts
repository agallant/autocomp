import type { Bar, Chart, Chord } from '../music'

export type StyleVoice = 'bass' | 'piano' | 'drums'

/** One synthesized hit relative to the start of a bar (or beat). */
export type StyleNote = {
  voice: StyleVoice
  /** MIDI note number for pitched voices; drum kit uses convention codes. */
  midi: number
  /** Offset from the bar downbeat in beats (0 = beat 1). */
  startBeat: number
  /** Duration in beats. */
  durationBeats: number
  /** 0–1 velocity. */
  velocity: number
  /** Drum instrument when voice === 'drums'. */
  drum?: 'kick' | 'snare' | 'hat' | 'ride' | 'clave'
}

export type StyleBarContext = {
  chart: Chart
  /** 0-based index into the expanded form. */
  barIndex: number
  bar: Bar
  /** Chord sounding at the start of each beat (length = beatsPerBar). */
  beatChords: Array<Chord | null>
  /** First chord of the following bar (for approach tones), if any. */
  nextBarChord: Chord | null
  beatsPerBar: number
}

export type StyleEngine = {
  id: string
  label: string
  /** Realize accompaniment notes for one bar. */
  realizeBar: (ctx: StyleBarContext) => StyleNote[]
}
