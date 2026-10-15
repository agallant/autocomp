import { formatRoot } from './pitch'
import type { Chord, ChordAlteration, ChordExtension, ChordQuality } from './types'

const QUALITY_SYMBOL: Record<ChordQuality, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  dom7: '7',
  maj7: 'maj7',
  min7: 'm7',
  dim7: 'dim7',
  halfDim7: 'm7b5',
  aug7: 'aug7',
  minMaj7: 'mMaj7',
  dom7sus4: '7sus4',
  maj6: '6',
  min6: 'm6',
}

/**
 * Collapse tertian extensions to a single top degree so format/parse round-trip.
 * Tone stacking still expands 11→9+11 and 13→9+11+13 in chordTones.
 */
export function normalizeExtensions(extensions: ChordExtension[]): ChordExtension[] {
  const set = new Set(extensions)
  if (set.has(13)) return [13]
  if (set.has(11)) return [11]
  if (set.has(9)) return set.has('add9') ? [9, 'add9'] : [9]
  if (set.has('add9')) return ['add9']
  return []
}

function extensionSuffix(quality: ChordQuality, extensions: ChordExtension[]): string {
  const normalized = normalizeExtensions(extensions)
  if (normalized.includes(13)) {
    if (quality === 'maj7') return 'maj13'
    if (quality === 'min7') return 'm13'
    if (quality === 'dom7') return '13'
  }
  if (normalized.includes(11)) {
    if (quality === 'maj7') return 'maj11'
    if (quality === 'min7') return 'm11'
    if (quality === 'dom7') return '11'
  }
  if (normalized.includes(9) && !normalized.includes('add9')) {
    if (quality === 'maj7') return 'maj9'
    if (quality === 'min7') return 'm9'
    if (quality === 'dom7') return '9'
  }
  if (normalized.includes('add9')) {
    if (quality === 'maj6') return '69'
    // Preserve base quality then append add9 (e.g. m7add9)
    return `${QUALITY_SYMBOL[quality]}add9`
  }
  return QUALITY_SYMBOL[quality]
}

function alterationText(alts: ChordAlteration[]): string {
  return alts.join('')
}

/** Format a chord to a compact lead-sheet symbol. */
export function formatChord(chord: Chord): string {
  if (chord.symbol) {
    return chord.symbol
  }
  return formatChordCanonical(chord)
}

/** Always rebuild from structured fields (ignores stored symbol). */
export function formatChordCanonical(chord: Chord): string {
  const extensions = normalizeExtensions(chord.extensions)
  const hasExt = extensions.length > 0
  const qualityPart = hasExt
    ? extensionSuffix(chord.quality, extensions)
    : QUALITY_SYMBOL[chord.quality]
  let body = `${formatRoot(chord.root)}${qualityPart}`
  body += alterationText(chord.alterations)
  if (chord.bass) {
    body += `/${formatRoot(chord.bass)}`
  }
  return body
}
