import { normalizePc, pcToRoot, rootToPc, transposeRoot } from './pitch'
import type {
  Chart,
  Chord,
  ChordQuality,
  ChordSlot,
  PitchClass,
  Root,
  Section,
} from './types'

/** Pitch classes that conventionally prefer flat spellings (F, Bb, Eb, Ab, Db, Gb). */
const FLAT_KEY_PCS = new Set<PitchClass>([5, 10, 3, 8, 1, 6])

const MINOR_QUALITIES = new Set<ChordQuality>([
  'min',
  'min7',
  'min6',
  'minMaj7',
  'halfDim7',
  'dim',
  'dim7',
])

/** Whether lead-sheet spelling for this key center prefers sharps (major-key table). */
export function preferSharpsForKey(key: Root): boolean {
  return preferSharpsForKeyPc(rootToPc(key), false)
}

/**
 * Sharp/flat preference for a key center.
 * Minor keys use the relative major’s accidental preference (Em→G, F#m→A).
 */
export function preferSharpsForKeyPc(keyPc: PitchClass, minor: boolean): boolean {
  const spellingPc = minor ? normalizePc(keyPc + 3) : keyPc
  return !FLAT_KEY_PCS.has(spellingPc)
}

/**
 * Heuristic: first chord whose root matches `chart.key` is a minor-family quality.
 * Charts without a tonic hit default to major spelling.
 */
export function chartLooksMinor(chart: Chart): boolean {
  const keyPc = rootToPc(chart.key)
  for (const section of chart.sections) {
    for (const bar of section.bars) {
      for (const slot of bar.slots) {
        const chord = slot.chord
        if (!chord) continue
        if (rootToPc(chord.root) !== keyPc) continue
        return MINOR_QUALITIES.has(chord.quality)
      }
    }
  }
  return false
}

/** Transpose a chord's root and slash bass; clears cached `symbol`. */
export function transposeChord(
  chord: Chord,
  semitones: number,
  preferSharps = true,
): Chord {
  if (semitones === 0) return chord
  const next: Chord = {
    ...chord,
    root: transposeRoot(chord.root, semitones, preferSharps),
    extensions: [...chord.extensions],
    alterations: [...chord.alterations],
  }
  if (chord.bass) {
    next.bass = transposeRoot(chord.bass, semitones, preferSharps)
  }
  // Drop the original symbol so display rebuilds from structured fields.
  delete next.symbol
  return next
}

function transposeSlot(
  slot: ChordSlot,
  semitones: number,
  preferSharps: boolean,
): ChordSlot {
  if (!slot.chord) return { ...slot, chord: null }
  return {
    ...slot,
    chord: transposeChord(slot.chord, semitones, preferSharps),
  }
}

function transposeSection(
  section: Section,
  semitones: number,
  preferSharps: boolean,
): Section {
  return {
    ...section,
    bars: section.bars.map((bar) => ({
      ...bar,
      slots: bar.slots.map((slot) => transposeSlot(slot, semitones, preferSharps)),
      ...(bar.timeSignature ? { timeSignature: { ...bar.timeSignature } } : {}),
    })),
  }
}

/**
 * Transpose every chord (and the chart key) by `semitones`.
 * Spelling follows the destination key center unless `preferSharps` is set.
 */
export function transposeChart(
  chart: Chart,
  semitones: number,
  preferSharps?: boolean,
): Chart {
  if (!Number.isInteger(semitones)) {
    throw new Error(`Transpose semitones must be an integer (got ${String(semitones)})`)
  }
  if (semitones === 0) return chart
  const minor = chartLooksMinor(chart)
  const targetKeyPc = normalizePc(rootToPc(chart.key) + semitones)
  const useSharps = preferSharps ?? preferSharpsForKeyPc(targetKeyPc, minor)
  const key = transposeRoot(chart.key, semitones, useSharps)
  return {
    ...chart,
    key,
    sections: chart.sections.map((section) =>
      transposeSection(section, semitones, useSharps),
    ),
  }
}

/** Accidental preference when the user picks an explicit target root. */
export function preferSharpsFromRoot(root: Root): boolean {
  if (root.accidental < 0) return false
  if (root.accidental > 0) return true
  return preferSharpsForKey(root)
}

/**
 * Shortest signed semitone distance from `from` to `to` in [-6, 6].
 * Ties at a tritone prefer the upward (+6) direction.
 */
export function semitonesToKey(from: Root, to: Root): number {
  const delta = normalizePc(rootToPc(to) - rootToPc(from))
  return delta > 6 ? delta - 12 : delta
}

/** Re-spell a chord's root/bass without changing pitch classes. */
export function respellChord(chord: Chord, preferSharps: boolean): Chord {
  const next: Chord = {
    ...chord,
    root: pcToRoot(rootToPc(chord.root), preferSharps),
    extensions: [...chord.extensions],
    alterations: [...chord.alterations],
  }
  if (chord.bass) {
    next.bass = pcToRoot(rootToPc(chord.bass), preferSharps)
  }
  delete next.symbol
  return next
}

function sameRoot(a: Root, b: Root): boolean {
  return a.letter === b.letter && a.accidental === b.accidental
}

/**
 * Transpose the chart so its concert key matches `targetKey` (spelling included).
 * No-op when already on that pitch class with the same root spelling.
 */
export function transposeChartToKey(chart: Chart, targetKey: Root): Chart {
  const semitones = semitonesToKey(chart.key, targetKey)
  if (semitones === 0 && sameRoot(chart.key, targetKey)) return chart
  // Naturals follow the chart’s major/minor context; explicit ♯/♭ roots win.
  const preferSharps =
    targetKey.accidental === 0
      ? preferSharpsForKeyPc(rootToPc(targetKey), chartLooksMinor(chart))
      : preferSharpsFromRoot(targetKey)
  const next =
    semitones === 0
      ? {
          ...chart,
          sections: chart.sections.map((section) => ({
            ...section,
            bars: section.bars.map((bar) => ({
              ...bar,
              slots: bar.slots.map((slot) =>
                slot.chord
                  ? { ...slot, chord: respellChord(slot.chord, preferSharps) }
                  : { ...slot, chord: null },
              ),
              ...(bar.timeSignature ? { timeSignature: { ...bar.timeSignature } } : {}),
            })),
          })),
        }
      : transposeChart(chart, semitones, preferSharps)
  return { ...next, key: { letter: targetKey.letter, accidental: targetKey.accidental } }
}
