import type { StyleId } from '../style'
import type { ProgressionKind } from './types'

export type StyleGenerateHints = {
  /** Default progression kind when the style picker drives Generate. */
  defaultKind: ProgressionKind
  /** Suggested tempo for freshly generated charts. */
  suggestedTempoBpm: number
  /** Prefer flat spellings (bossa/latin often sit in flat keys). */
  preferSharps: boolean
  /** Title prefix for generated charts. */
  titlePrefix: string
}

const HINTS: Record<StyleId, StyleGenerateHints> = {
  'jazz-swing': {
    defaultKind: 'ii-v-i',
    suggestedTempoBpm: 120,
    preferSharps: true,
    titlePrefix: 'Swing',
  },
  bossa: {
    defaultKind: 'ii-v-i',
    suggestedTempoBpm: 140,
    preferSharps: false,
    titlePrefix: 'Bossa',
  },
  ballad: {
    defaultKind: 'minor-ii-v-i',
    suggestedTempoBpm: 72,
    preferSharps: true,
    titlePrefix: 'Ballad',
  },
  latin: {
    defaultKind: 'vamp',
    suggestedTempoBpm: 100,
    preferSharps: false,
    titlePrefix: 'Latin',
  },
}

export function styleGenerateHints(styleId: StyleId): StyleGenerateHints {
  return HINTS[styleId]
}

/** Kinds offered in the Generate UI (order is display order). */
export const PROGRESSION_KINDS: ProgressionKind[] = [
  'ii-v-i',
  'minor-ii-v-i',
  'turnaround',
  'blues',
  'vamp',
  'random',
]
