import { chordTonePcs, formatChordCanonical, type Chord, type PitchClass } from '../music'
import type { ChromaVector, ChordCandidate, ChordMatch } from './types'

/**
 * Score how well a chroma vector matches a chord's pitch classes.
 * Rewards chord tones; lightly penalizes strong energy outside the chord.
 */
export function scoreChordAgainstChroma(chroma: ChromaVector, chord: Chord): number {
  const tones = chordTonePcs(chord)
  if (tones.length === 0) return 0
  const toneSet = new Set<PitchClass>(tones)
  let toneEnergy = 0
  let otherEnergy = 0
  for (let pc = 0; pc < 12; pc++) {
    const e = chroma[pc]!
    if (toneSet.has(pc as PitchClass)) toneEnergy += e
    else otherEnergy += e
  }
  const toneAvg = toneEnergy / tones.length
  // Penalize leaking energy outside the chord (melody notes still OK if tones dominate).
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

/** Best-scoring candidate, or null when below `minScore` / silence. */
export function bestChordMatch(
  chroma: ChromaVector,
  candidates: readonly ChordCandidate[],
  minScore = 0.12,
): ChordMatch | null {
  let best: ChordMatch | null = null
  for (const candidate of candidates) {
    const score = scoreChordAgainstChroma(chroma, candidate.chord)
    if (score < minScore) continue
    if (!best || score > best.score) {
      best = { candidate, score }
    }
  }
  return best
}
