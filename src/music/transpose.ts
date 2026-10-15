import { normalizePc, rootToPc, transposeRoot } from './pitch'
import type { Chart, Chord, ChordSlot, PitchClass, Root, Section } from './types'

/** Pitch classes that conventionally prefer flat spellings (F, Bb, Eb, Ab, Db, Gb). */
const FLAT_KEY_PCS = new Set<PitchClass>([5, 10, 3, 8, 1, 6])

/** Whether lead-sheet spelling for this key center prefers sharps. */
export function preferSharpsForKey(key: Root): boolean {
  return !FLAT_KEY_PCS.has(rootToPc(key))
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
  const targetKeyPc = normalizePc(rootToPc(chart.key) + semitones)
  // Prefer spelling from the destination key center, not the source.
  const useSharps = preferSharps ?? !FLAT_KEY_PCS.has(targetKeyPc)
  const key = transposeRoot(chart.key, semitones, useSharps)
  return {
    ...chart,
    key,
    sections: chart.sections.map((section) =>
      transposeSection(section, semitones, useSharps),
    ),
  }
}
