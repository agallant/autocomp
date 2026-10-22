import type { Root } from '../music'
import type { StyleId } from '../style'

/** Built-in progression shapes the generator can emit. */
export type ProgressionKind =
  | 'ii-v-i'
  | 'minor-ii-v-i'
  | 'turnaround'
  | 'blues'
  | 'vamp'
  | 'random'

/** Deterministic reharmonization transforms for selected bars. */
export type ReharmMode = 'ii-before-v' | 'tritone-sub'

export type GenerateProgressionOptions = {
  kind: ProgressionKind
  /** Tonic of the progression (chart key). */
  key: Root
  styleId: StyleId
  /** Prefer sharps when spelling non-diatonic roots; defaults to the style hint. */
  preferSharps?: boolean
  /** Full-random only: bar count (8 / 12 / 16). */
  barCount?: number
  /** Full-random only: chords per bar (1 or 2). */
  chordDensity?: 1 | 2
  /** Full-random only: probability of major mode (0–1). */
  majorBias?: number
  /** Full-random only: prefer ii–V gravity when packing bars. */
  preferIiV?: boolean
}

export type ProgressionDescriptor = {
  id: ProgressionKind
  label: string
  blurb: string
}

export type ReharmDescriptor = {
  id: ReharmMode
  label: string
  blurb: string
}
