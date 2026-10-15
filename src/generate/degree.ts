import {
  formatRoot,
  normalizePc,
  pcToRoot,
  rootToPc,
  transposeRoot,
  type Accidental,
  type NoteLetter,
  type Root,
} from '../music'

/** Diatonic major-scale degrees → chord quality suffix (jazz defaults). */
const MAJOR_DEGREE_QUALITY: Record<number, string> = {
  1: 'maj7',
  2: 'm7',
  3: 'm7',
  4: 'maj7',
  5: '7',
  6: 'm7',
  7: 'm7b5',
}

/** Natural-minor degrees → chord quality suffix. */
const MINOR_DEGREE_QUALITY: Record<number, string> = {
  1: 'm7',
  2: 'm7b5',
  3: 'maj7',
  4: 'm7',
  5: '7',
  6: 'maj7',
  7: '7',
}

/** Semitone offset of major-scale degree 1..7 from tonic. */
const MAJOR_DEGREE_SEMITONES = [0, 0, 2, 4, 5, 7, 9, 11] as const

const LETTERS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const LETTER_PC: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/**
 * Spell a pitch class using the diatonic letter for `degree` in `key`.
 * Preserves flat-key spellings (Bb → Eb, not D#) instead of a global sharp/flat flag.
 */
export function degreeRoot(
  key: Root,
  degree: number,
  mode: 'major' | 'minor' = 'major',
): Root {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new Error(`Scale degree must be an integer 1–7 (got ${String(degree)})`)
  }
  const keyLetterIndex = LETTERS.indexOf(key.letter)
  const letter = LETTERS[(keyLetterIndex + degree - 1) % 7]!
  const semitones = MAJOR_DEGREE_SEMITONES[degree]!
  const minorAdjust =
    mode === 'minor' && (degree === 3 || degree === 6 || degree === 7) ? -1 : 0
  const targetPc = normalizePc(rootToPc(key) + semitones + minorAdjust)
  let accidental = targetPc - LETTER_PC[letter]
  // Bring into roughly [-6, 6] then accept only spellable accidentals.
  if (accidental > 6) accidental -= 12
  if (accidental < -6) accidental += 12
  if (accidental > 2 || accidental < -2) {
    // Extreme keys (e.g. D##) — fall back to a valid enharmonic spelling.
    return pcToRoot(targetPc, key.accidental >= 0)
  }
  return { letter, accidental: accidental as Accidental }
}

/**
 * Build a chord symbol for a scale degree in a major or minor key.
 * `degree` is 1–7; optional `qualityOverride` replaces the diatonic quality.
 * `preferSharps` is unused for diatonic spelling (kept for API compatibility).
 */
export function degreeChord(
  key: Root,
  degree: number,
  mode: 'major' | 'minor' = 'major',
  qualityOverride?: string,
  _preferSharps = true,
): string {
  const root = degreeRoot(key, degree, mode)
  const quality =
    qualityOverride ??
    (mode === 'minor' ? MINOR_DEGREE_QUALITY[degree]! : MAJOR_DEGREE_QUALITY[degree]!)
  return `${formatRoot(root)}${quality}`
}

/** Dominant a fifth above `key` (V7). */
export function dominantOf(key: Root, preferSharps = true): string {
  return degreeChord(key, 5, 'major', '7', preferSharps)
}

/** Tritone substitute of a dominant rooted at `domRoot` (root + 6 semitones). */
export function tritoneRoot(domRoot: Root, preferSharps = true): Root {
  return transposeRoot(domRoot, 6, preferSharps)
}

/** Whether two roots share a pitch class. */
export function samePc(a: Root, b: Root): boolean {
  return rootToPc(a) === rootToPc(b)
}
