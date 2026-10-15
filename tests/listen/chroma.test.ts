import { describe, expect, it } from 'vitest'
import {
  chromaFromFrequencyData,
  frequencyToPc,
  normalizeChroma,
} from '../../src/listen'

describe('chroma', () => {
  it('maps A4-ish frequencies near pitch class 9 (A)', () => {
    expect(frequencyToPc(440)).toBe(9)
    expect(frequencyToPc(220)).toBe(9)
  })

  it('folds FFT bins into a normalized chroma peak', () => {
    const fftSize = 2048
    const sampleRate = 44100
    const data = new Float32Array(fftSize / 2)
    data.fill(-120)
    // Peak near C4 (~261.6 Hz)
    const bin = Math.round((261.63 * fftSize) / sampleRate)
    data[bin] = -20
    const chroma = chromaFromFrequencyData(data, sampleRate, fftSize)
    let peakPc = 0
    let peak = -1
    for (let i = 0; i < 12; i++) {
      if (chroma[i]! > peak) {
        peak = chroma[i]!
        peakPc = i
      }
    }
    expect(peakPc).toBe(0) // C
    let sum = 0
    for (let i = 0; i < 12; i++) sum += chroma[i]!
    expect(sum).toBeCloseTo(1, 5)
  })

  it('normalizeChroma is a no-op on silence', () => {
    const chroma = new Float32Array(12)
    normalizeChroma(chroma)
    expect([...chroma]).toEqual(Array(12).fill(0))
  })
})
