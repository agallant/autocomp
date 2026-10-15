import type { ChromaVector } from './types'

const A4_HZ = 440
const A4_MIDI = 69

/** MIDI note number for a frequency (continuous). */
export function frequencyToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_HZ)
}

/** Pitch class 0–11 for a frequency (C=0). */
export function frequencyToPc(hz: number): number {
  const midi = frequencyToMidi(hz)
  const pc = ((Math.round(midi) % 12) + 12) % 12
  return pc
}

/**
 * Fold analyser frequency bins into a 12-dimensional chroma vector.
 * Uses dB magnitudes from `AnalyserNode.getFloatFrequencyData`.
 */
export function chromaFromFrequencyData(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
): ChromaVector {
  const chroma = new Float32Array(12) as ChromaVector
  const binHz = sampleRate / fftSize
  // Ignore DC and very high/low bins that are noisy on laptop mics.
  const minHz = 80
  const maxHz = 2000
  for (let i = 1; i < frequencyData.length; i++) {
    const hz = i * binHz
    if (hz < minHz || hz > maxHz) continue
    const db = frequencyData[i]!
    // Convert dB to a positive linear-ish weight; floor silence.
    const weight = Math.max(0, db + 100)
    if (weight <= 0) continue
    const pc = frequencyToPc(hz)
    chroma[pc]! += weight
  }
  normalizeChroma(chroma)
  return chroma
}

/** In-place L1 normalization (sum → 1), or leave zeros if silent. */
export function normalizeChroma(chroma: Float32Array): void {
  let sum = 0
  for (let i = 0; i < 12; i++) sum += chroma[i]!
  if (sum <= 1e-9) return
  for (let i = 0; i < 12; i++) chroma[i]! /= sum
}

/** Empty chroma (silence). */
export function zeroChroma(): ChromaVector {
  return new Float32Array(12) as ChromaVector
}
