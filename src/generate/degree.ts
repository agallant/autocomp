import { formatRoot, rootToPc, transposeRoot, type Root } from '../music'

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

/**
 * Build a chord symbol for a scale degree in a major or minor key.
 * `degree` is 1–7; optional `qualityOverride` replaces the diatonic quality.
 */
export function degreeChord(
  key: Root,
  degree: number,
  mode: 'major' | 'minor' = 'major',
  qualityOverride?: string,
  preferSharps = true,
): string {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new Error(`Scale degree must be an integer 1–7 (got ${String(degree)})`)
  }
  const semitones = MAJOR_DEGREE_SEMITONES[degree]!
  // Natural minor: flatten 3, 6, 7 relative to major.
  const minorAdjust =
    mode === 'minor' && (degree === 3 || degree === 6 || degree === 7) ? -1 : 0
  const root = transposeRoot(key, semitones + minorAdjust, preferSharps)
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
