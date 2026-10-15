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

function extensionSuffix(quality: ChordQuality, extensions: ChordExtension[]): string {
  if (extensions.includes(13)) {
    if (quality === 'maj7') return 'maj13'
    if (quality === 'min7') return 'm13'
    if (quality === 'dom7') return '13'
  }
  if (extensions.includes(11)) {
    if (quality === 'maj7') return 'maj11'
    if (quality === 'min7') return 'm11'
    if (quality === 'dom7') return '11'
  }
  if (extensions.includes(9)) {
    if (quality === 'maj7') return 'maj9'
    if (quality === 'min7') return 'm9'
    if (quality === 'dom7') return '9'
  }
  if (extensions.includes('add9')) {
    if (quality === 'maj6') return '69'
    return 'add9'
  }
  return QUALITY_SYMBOL[quality]
}

function alterationText(alts: ChordAlteration[]): string {
  return alts.join('')
}

/** Format a chord to a compact lead-sheet symbol. */
export function formatChord(chord: Chord): string {
  if (chord.symbol) {
    // Prefer original spelling when present (keeps user/input notation).
    return chord.symbol
  }
  const hasExt = chord.extensions.length > 0
  const qualityPart = hasExt
    ? extensionSuffix(chord.quality, chord.extensions)
    : QUALITY_SYMBOL[chord.quality]
  // When extensionSuffix already embeds quality (9/13/maj9…), don't double-prefix
  let body = `${formatRoot(chord.root)}${qualityPart}`
  if (hasExt && qualityPart === QUALITY_SYMBOL[chord.quality]) {
    // add9 etc. already fine
  }
  body += alterationText(chord.alterations)
  if (chord.bass) {
    body += `/${formatRoot(chord.bass)}`
  }
  return body
}

/** Always rebuild from structured fields (ignores stored symbol). */
export function formatChordCanonical(chord: Chord): string {
  const { symbol: _symbol, ...rest } = chord
  return formatChord(rest)
}
