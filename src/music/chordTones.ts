import { normalizePc, rootToPc } from './pitch'
import type { Chord, ChordAlteration, PitchClass } from './types'

/** Interval recipe in semitones from the root for each quality (before extensions/alts). */
const QUALITY_INTERVALS: Record<Chord['quality'], number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim7: [0, 3, 6, 9],
  halfDim7: [0, 3, 6, 10],
  aug7: [0, 4, 8, 10],
  minMaj7: [0, 3, 7, 11],
  dom7sus4: [0, 5, 7, 10],
  maj6: [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
}

function applyAlteration(tones: number[], alt: ChordAlteration): number[] {
  const set = new Set(tones.map(normalizePc))
  const replace = (from: number, to: number): void => {
    set.delete(normalizePc(from))
    set.add(normalizePc(to))
  }
  switch (alt) {
    case 'b5':
      replace(7, 6)
      break
    case '#5':
      replace(7, 8)
      break
    case 'b9':
      set.add(1)
      break
    case '#9':
      set.add(3)
      break
    case '#11':
      set.add(6)
      break
    case 'b13':
      set.add(8)
      break
    case 'alt':
      // Classic "alt" stack: b9 #9 #11 b13 on a dominant shell
      set.add(1)
      set.add(3)
      set.add(6)
      set.add(8)
      replace(7, 6)
      break
  }
  return [...set].sort((a, b) => a - b)
}

function applyExtension(tones: number[], ext: Chord['extensions'][number]): number[] {
  const set = new Set(tones.map(normalizePc))
  if (ext === 'add9') {
    set.add(2)
  } else if (ext === 9) {
    set.add(2)
  } else if (ext === 11) {
    set.add(5)
  } else if (ext === 13) {
    set.add(9)
  }
  return [...set].sort((a, b) => a - b)
}

/** Pitch classes present in the chord (root-relative → absolute). */
export function chordTonePcs(chord: Chord): PitchClass[] {
  let intervals = [...QUALITY_INTERVALS[chord.quality]]
  for (const ext of chord.extensions) {
    intervals = applyExtension(intervals, ext)
  }
  for (const alt of chord.alterations) {
    intervals = applyAlteration(intervals, alt)
  }
  const rootPc = rootToPc(chord.root)
  return intervals.map((i) => normalizePc(rootPc + i))
}

export function isDominantFamily(chord: Chord): boolean {
  return (
    chord.quality === 'dom7' ||
    chord.quality === 'aug7' ||
    chord.quality === 'dom7sus4' ||
    chord.alterations.includes('alt')
  )
}
