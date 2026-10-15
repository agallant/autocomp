import { parseRoot } from './pitch'
import type {
  Chord,
  ChordAlteration,
  ChordExtension,
  ChordQuality,
  Root,
} from './types'

export class ChordParseError extends Error {
  readonly symbol: string

  constructor(symbol: string, message: string) {
    super(`Invalid chord "${symbol}": ${message}`)
    this.name = 'ChordParseError'
    this.symbol = symbol
  }
}

type QualityParse = {
  quality: ChordQuality
  extensions: ChordExtension[]
  alterations: ChordAlteration[]
}

/**
 * Map quality token (after root) to structured quality.
 * Order matters: longer / more specific tokens first.
 */
const QUALITY_TABLE: Array<{ token: string; result: QualityParse }> = [
  { token: 'maj13', result: { quality: 'maj7', extensions: [13], alterations: [] } },
  { token: 'maj11', result: { quality: 'maj7', extensions: [11], alterations: [] } },
  { token: 'maj9', result: { quality: 'maj7', extensions: [9], alterations: [] } },
  { token: 'maj7', result: { quality: 'maj7', extensions: [], alterations: [] } },
  { token: 'ma7', result: { quality: 'maj7', extensions: [], alterations: [] } },
  { token: 'Δ13', result: { quality: 'maj7', extensions: [13], alterations: [] } },
  { token: 'Δ9', result: { quality: 'maj7', extensions: [9], alterations: [] } },
  { token: 'Δ7', result: { quality: 'maj7', extensions: [], alterations: [] } },
  { token: 'Δ', result: { quality: 'maj7', extensions: [], alterations: [] } },
  { token: 'M13', result: { quality: 'maj7', extensions: [13], alterations: [] } },
  { token: 'M9', result: { quality: 'maj7', extensions: [9], alterations: [] } },
  { token: 'M7', result: { quality: 'maj7', extensions: [], alterations: [] } },
  { token: 'minMaj7', result: { quality: 'minMaj7', extensions: [], alterations: [] } },
  { token: 'mMaj7', result: { quality: 'minMaj7', extensions: [], alterations: [] } },
  { token: 'mM7', result: { quality: 'minMaj7', extensions: [], alterations: [] } },
  { token: 'm13', result: { quality: 'min7', extensions: [13], alterations: [] } },
  { token: 'm11', result: { quality: 'min7', extensions: [11], alterations: [] } },
  { token: 'm9', result: { quality: 'min7', extensions: [9], alterations: [] } },
  { token: 'm7b5', result: { quality: 'halfDim7', extensions: [], alterations: [] } },
  { token: 'm7♭5', result: { quality: 'halfDim7', extensions: [], alterations: [] } },
  { token: 'min7', result: { quality: 'min7', extensions: [], alterations: [] } },
  { token: 'mi7', result: { quality: 'min7', extensions: [], alterations: [] } },
  { token: 'm7', result: { quality: 'min7', extensions: [], alterations: [] } },
  { token: 'm6', result: { quality: 'min6', extensions: [], alterations: [] } },
  { token: 'min', result: { quality: 'min', extensions: [], alterations: [] } },
  { token: 'mi', result: { quality: 'min', extensions: [], alterations: [] } },
  { token: 'm', result: { quality: 'min', extensions: [], alterations: [] } },
  { token: '-7', result: { quality: 'min7', extensions: [], alterations: [] } },
  { token: '-', result: { quality: 'min', extensions: [], alterations: [] } },
  { token: 'dim7', result: { quality: 'dim7', extensions: [], alterations: [] } },
  { token: 'dim', result: { quality: 'dim', extensions: [], alterations: [] } },
  { token: 'o7', result: { quality: 'dim7', extensions: [], alterations: [] } },
  { token: 'ø7', result: { quality: 'halfDim7', extensions: [], alterations: [] } },
  { token: 'ø', result: { quality: 'halfDim7', extensions: [], alterations: [] } },
  { token: 'o', result: { quality: 'dim', extensions: [], alterations: [] } },
  { token: 'aug7', result: { quality: 'aug7', extensions: [], alterations: [] } },
  { token: 'aug', result: { quality: 'aug', extensions: [], alterations: [] } },
  { token: '+7', result: { quality: 'aug7', extensions: [], alterations: [] } },
  { token: '+', result: { quality: 'aug', extensions: [], alterations: [] } },
  { token: '7sus4', result: { quality: 'dom7sus4', extensions: [], alterations: [] } },
  { token: '7sus', result: { quality: 'dom7sus4', extensions: [], alterations: [] } },
  { token: 'sus2', result: { quality: 'sus2', extensions: [], alterations: [] } },
  { token: 'sus4', result: { quality: 'sus4', extensions: [], alterations: [] } },
  { token: 'sus', result: { quality: 'sus4', extensions: [], alterations: [] } },
  { token: '13', result: { quality: 'dom7', extensions: [13], alterations: [] } },
  { token: '11', result: { quality: 'dom7', extensions: [11], alterations: [] } },
  { token: '9', result: { quality: 'dom7', extensions: [9], alterations: [] } },
  { token: '7', result: { quality: 'dom7', extensions: [], alterations: [] } },
  { token: '69', result: { quality: 'maj6', extensions: ['add9'], alterations: [] } },
  { token: '6/9', result: { quality: 'maj6', extensions: ['add9'], alterations: [] } },
  { token: '6', result: { quality: 'maj6', extensions: [], alterations: [] } },
  { token: 'add9', result: { quality: 'maj', extensions: ['add9'], alterations: [] } },
  { token: 'maj', result: { quality: 'maj', extensions: [], alterations: [] } },
  { token: 'ma', result: { quality: 'maj', extensions: [], alterations: [] } },
]

const ALTERATION_TOKENS: Array<{ token: string; alt: ChordAlteration }> = [
  { token: 'alt', alt: 'alt' },
  { token: 'b13', alt: 'b13' },
  { token: '♭13', alt: 'b13' },
  { token: '#11', alt: '#11' },
  { token: '♯11', alt: '#11' },
  { token: 'b9', alt: 'b9' },
  { token: '♭9', alt: 'b9' },
  { token: '#9', alt: '#9' },
  { token: '♯9', alt: '#9' },
  { token: 'b5', alt: 'b5' },
  { token: '♭5', alt: 'b5' },
  { token: '#5', alt: '#5' },
  { token: '♯5', alt: '#5' },
]

function assertBalancedParens(text: string, symbol: string): void {
  let depth = 0
  for (const ch of text) {
    if (ch === '(') depth += 1
    if (ch === ')') {
      depth -= 1
      if (depth < 0) throw new ChordParseError(symbol, 'unbalanced parentheses')
    }
  }
  if (depth !== 0) throw new ChordParseError(symbol, 'unbalanced parentheses')
}

function splitSlash(symbol: string): { body: string; bass: Root | null } {
  const idx = symbol.lastIndexOf('/')
  if (idx <= 0) return { body: symbol, bass: null }

  // Exempt only the slash inside a trailing "6/9" quality, not a later bass slash.
  // e.g. "C6/9" → no bass; "C6/9/E" → bass E, body C6/9
  const before = symbol.slice(0, idx)
  const bassText = symbol.slice(idx + 1)
  if (before.endsWith('6') && bassText.startsWith('9')) {
    // This slash is the 6/9 separator (possibly with more after "9")
    const afterNine = bassText.slice(1)
    if (afterNine === '') {
      return { body: symbol, bass: null }
    }
    if (afterNine.startsWith('/')) {
      const realBassText = afterNine.slice(1)
      const bass = parseRoot(realBassText)
      if (!bass || formatRootLength(bass) !== realBassText.length) {
        return { body: symbol, bass: null }
      }
      return { body: `${before}/9`, bass }
    }
  }

  const bass = parseRoot(bassText)
  if (!bass || formatRootLength(bass) !== bassText.length) {
    return { body: symbol, bass: null }
  }
  return { body: before, bass }
}

function formatRootLength(root: Root): number {
  const acc =
    root.accidental === 2 || root.accidental === -2
      ? 2
      : root.accidental === 0
        ? 0
        : 1
  return 1 + acc
}

function parseQualityTail(tail: string, symbol: string): QualityParse {
  if (tail === '' || tail === 'maj' || tail === 'ma') {
    return { quality: 'maj', extensions: [], alterations: [] }
  }

  assertBalancedParens(tail, symbol)

  let rest = tail
  let quality: ChordQuality = 'maj'
  const extensions: ChordExtension[] = []
  const alterations: ChordAlteration[] = []
  let matchedQuality = false

  for (const entry of QUALITY_TABLE) {
    if (rest.startsWith(entry.token)) {
      quality = entry.result.quality
      extensions.push(...entry.result.extensions)
      alterations.push(...entry.result.alterations)
      rest = rest.slice(entry.token.length)
      matchedQuality = true
      break
    }
  }

  if (!matchedQuality && (rest.startsWith('−') || rest.startsWith('–'))) {
    quality = 'min'
    rest = rest.slice(1)
    matchedQuality = true
    if (rest.startsWith('7')) {
      quality = 'min7'
      rest = rest.slice(1)
    }
  }

  if (!matchedQuality && rest.length > 0) {
    throw new ChordParseError(symbol, `unknown quality "${tail}"`)
  }

  if (quality === 'min' && rest.startsWith('7')) {
    quality = 'min7'
    rest = rest.slice(1)
  }

  // Optional add9 after a quality (e.g. m7add9 or m7(add9))
  rest = rest.replace(/[()]/g, '')
  if (rest.startsWith('add9')) {
    extensions.push('add9')
    rest = rest.slice(4)
  }

  while (rest.length > 0) {
    let hit = false
    for (const { token, alt } of ALTERATION_TOKENS) {
      if (rest.startsWith(token)) {
        if (!alterations.includes(alt)) alterations.push(alt)
        rest = rest.slice(token.length)
        hit = true
        break
      }
    }
    if (!hit) {
      if (rest.startsWith(',') || rest.startsWith(' ')) {
        rest = rest.slice(1)
        continue
      }
      throw new ChordParseError(symbol, `unparsed suffix "${rest}"`)
    }
  }

  if (alterations.includes('alt') && quality === 'maj') {
    quality = 'dom7'
  }

  return { quality, extensions, alterations }
}

/**
 * Parse a lead-sheet chord symbol (iReal / jazz shorthand).
 * Examples: `Dm7`, `G7b9`, `Cmaj7`, `F#m7b5`, `Bb7alt`, `C/E`, `C6/9/E`
 */
export function parseChordSymbol(symbol: string): Chord {
  const trimmed = symbol.trim()
  if (!trimmed) throw new ChordParseError(symbol, 'empty symbol')

  assertBalancedParens(trimmed, trimmed)

  const { body, bass } = splitSlash(trimmed)
  const root = parseRoot(body)
  if (!root) throw new ChordParseError(symbol, 'missing root')

  const rootLen = formatRootLength(root)
  const tail = body.slice(rootLen)
  const { quality, extensions, alterations } = parseQualityTail(tail, trimmed)

  const chord: Chord = {
    root,
    quality,
    extensions,
    alterations,
    symbol: trimmed,
  }
  if (bass) {
    return { ...chord, bass }
  }
  return chord
}

export function tryParseChordSymbol(symbol: string): Chord | null {
  try {
    return parseChordSymbol(symbol)
  } catch {
    return null
  }
}
