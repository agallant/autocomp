import { chordTonePcs, formatChordCanonical, type Chord, type PitchClass } from '../music'
import type { ChromaVector, ChordCandidate, ChordMatch } from './types'

/**
 * Score how well a chroma vector matches a chord's pitch classes.
 * Requires energy on multiple chord tones so a single melody note cannot lock.
 */
export function scoreChordAgainstChroma(chroma: ChromaVector, chord: Chord): number {
  const tones = chordTonePcs(chord)
  if (tones.length === 0) return 0
  const toneSet = new Set<PitchClass>(tones)
  let toneEnergy = 0
  let otherEnergy = 0
  let activeTones = 0
  const presenceFloor = 0.04
  for (let pc = 0; pc < 12; pc++) {
    const e = chroma[pc]!
    if (toneSet.has(pc as PitchClass)) {
      toneEnergy += e
      if (e >= presenceFloor) activeTones += 1
    } else {
      otherEnergy += e
    }
  }
  // Need at least two chord-tone PCs present (or the whole small set for dyads).
  const required = Math.min(2, tones.length)
  if (activeTones < required) return 0
  const toneAvg = toneEnergy / tones.length
  return Math.max(0, Math.min(1, toneAvg * 1.4 - otherEnergy * 0.35))
}

/** Build candidates from a flat bar list (one candidate per non-empty slot). */
export function candidatesFromBars(
  bars: Array<{ slots: Array<{ chord: Chord | null }> }>,
): ChordCandidate[] {
  const out: ChordCandidate[] = []
  for (let barIndex = 0; barIndex < bars.length; barIndex++) {
    const bar = bars[barIndex]!
    for (const slot of bar.slots) {
      if (!slot.chord) continue
      out.push({
        barIndex,
        chord: slot.chord,
        symbol: formatChordCanonical(slot.chord),
      })
    }
  }
  return out
}

/**
 * Best-scoring candidate, or null when below `minScore` / silence.
 * Ties prefer the occurrence nearest `preferBarIndex` (default 0).
 */
export function bestChordMatch(
  chroma: ChromaVector,
  candidates: readonly ChordCandidate[],
  minScore = 0.12,
  preferBarIndex = 0,
): ChordMatch | null {
  let best: ChordMatch | null = null
  for (const candidate of candidates) {
    const score = scoreChordAgainstChroma(chroma, candidate.chord)
    if (score < minScore) continue
    if (!best || score > best.score + 1e-9) {
      best = { candidate, score }
      continue
    }
    if (Math.abs(score - best.score) <= 1e-9) {
      const bestDist = Math.abs(best.candidate.barIndex - preferBarIndex)
      const nextDist = Math.abs(candidate.barIndex - preferBarIndex)
      if (nextDist < bestDist) best = { candidate, score }
    }
  }
  return best
}
