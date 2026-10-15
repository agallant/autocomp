export {
  chromaFromFrequencyData,
  frequencyToMidi,
  frequencyToPc,
  normalizeChroma,
  zeroChroma,
} from './chroma'
export { bestChordMatch, candidatesFromBars, scoreChordAgainstChroma } from './match'
export { MicCapture, type MicCaptureOptions } from './mic'
export { FollowEngine, type FollowEngineCallbacks } from './follow'
export type {
  ChromaVector,
  ChordCandidate,
  ChordMatch,
  FollowOptions,
  FollowSnapshot,
} from './types'
