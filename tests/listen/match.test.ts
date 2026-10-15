import { describe, expect, it } from 'vitest'
import {
  bestChordMatch,
  candidatesFromBars,
  scoreChordAgainstChroma,
  type ChromaVector,
} from '../../src/listen'
import { parseChordSymbol, sectionFromBarSymbols } from '../../src/music'

function chromaWithTones(pcs: number[]): ChromaVector {
  const c = new Float32Array(12) as ChromaVector
  for (const pc of pcs) c[pc]! = 1 / pcs.length
  return c
}

describe('chord match', () => {
  it('scores Cmaj7 higher than G7 for C-E-G-B energy', () => {
    // C=0 E=4 G=7 B=11
    const chroma = chromaWithTones([0, 4, 7, 11])
    const cmaj = scoreChordAgainstChroma(chroma, parseChordSymbol('Cmaj7'))
    const g7 = scoreChordAgainstChroma(chroma, parseChordSymbol('G7'))
    expect(cmaj).toBeGreaterThan(g7)
  })

  it('rejects a single-pitch melody note as a chord match', () => {
    const chroma = chromaWithTones([0]) // lone C
    expect(scoreChordAgainstChroma(chroma, parseChordSymbol('Cmaj7'))).toBe(0)
  })

  it('picks the best candidate bar for a dominant chroma', () => {
    const section = sectionFromBarSymbols('A', 'A', [['Dm7'], ['G7'], ['Cmaj7']])
    const candidates = candidatesFromBars(section.bars)
    // G=7 B=11 D=2 F=5
    const chroma = chromaWithTones([7, 11, 2, 5])
    const match = bestChordMatch(chroma, candidates, 0.05)
    expect(match?.candidate.symbol).toBe('G7')
    expect(match?.candidate.barIndex).toBe(1)
  })

  it('breaks equal scores toward the nearer bar', () => {
    const section = sectionFromBarSymbols('A', 'A', [['G7'], ['Cmaj7'], ['G7']])
    const candidates = candidatesFromBars(section.bars)
    const chroma = chromaWithTones([7, 11, 2, 5])
    const nearEnd = bestChordMatch(chroma, candidates, 0.05, 2)
    expect(nearEnd?.candidate.barIndex).toBe(2)
  })
})
