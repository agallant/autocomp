/** Pitch class 0=C … 11=B (equal temperament). */
export type PitchClass = number

export type Accidental = -2 | -1 | 0 | 1 | 2

export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export type Root = {
  letter: NoteLetter
  accidental: Accidental
}

/**
 * Named chord qualities used in jazz/pop charts.
 * Extensions/alterations live in `Chord.alterations` / `extensions`.
 */
export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | 'dom7'
  | 'maj7'
  | 'min7'
  | 'dim7'
  | 'halfDim7'
  | 'aug7'
  | 'minMaj7'
  | 'dom7sus4'
  | 'maj6'
  | 'min6'

/** Alteration relative to the base quality (jazz shorthand). */
export type ChordAlteration =
  | 'b5'
  | '#5'
  | 'b9'
  | '#9'
  | '#11'
  | 'b13'
  | 'alt'

export type ChordExtension = 9 | 11 | 13 | 'add9'

export type Chord = {
  root: Root
  quality: ChordQuality
  extensions: ChordExtension[]
  alterations: ChordAlteration[]
  /** Slash-bass root, when present (e.g. C/E). */
  bass?: Root
  /** Original symbol text when parsed; useful for round-trip display. */
  symbol?: string
}

export type TimeSignature = {
  numerator: number
  denominator: number
}

/** One chord (or empty) occupying a span of beats inside a bar. */
export type ChordSlot = {
  chord: Chord | null
  durationBeats: number
}

export type Bar = {
  slots: ChordSlot[]
  /** Optional override; defaults to chart time signature. */
  timeSignature?: TimeSignature
  rehearsalMark?: string
}

export type Section = {
  id: string
  label: string
  bars: Bar[]
}

export type Chart = {
  /** Schema version for forward compatibility. */
  version: 1
  id: string
  title: string
  composer?: string
  /** Concert key as a root (tonal center for display / transpose later). */
  key: Root
  timeSignature: TimeSignature
  defaultTempoBpm: number
  /** Playback order of section ids (repeats allowed). */
  form: string[]
  sections: Section[]
  styleHint?: string
  notes?: string
}

export type ChartValidationIssue = {
  path: string
  message: string
}
