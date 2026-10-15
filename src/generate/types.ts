import type { Root } from '../music'
import type { StyleId } from '../style'

/** Built-in progression shapes the generator can emit. */
export type ProgressionKind =
  | 'ii-v-i'
  | 'minor-ii-v-i'
  | 'turnaround'
  | 'blues'
  | 'vamp'

/** Deterministic reharmonization transforms for selected bars. */
export type ReharmMode = 'ii-before-v' | 'tritone-sub'

export type GenerateProgressionOptions = {
  kind: ProgressionKind
  /** Tonic of the progression (chart key). */
  key: Root
  styleId: StyleId
  /** Prefer sharps when spelling non-diatonic roots; defaults to the style hint. */
  preferSharps?: boolean
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
