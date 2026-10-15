import type { Chord } from '../music'

export type ChromaVector = Float32Array & { readonly length: 12 }

export type ChordCandidate = {
  /** 0-based index into expandChartBars. */
  barIndex: number
  chord: Chord
  /** Display symbol for UI. */
  symbol: string
}

export type ChordMatch = {
  candidate: ChordCandidate
  /** 0..1 relative confidence. */
  score: number
}

export type FollowSnapshot = {
  /** Best match this frame, if any. */
  match: ChordMatch | null
  /** True when the same bar has won enough stable frames to trust. */
  locked: boolean
  /** Mic permission / capture status. */
  status: 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'error'
  message: string
}

export type FollowOptions = {
  /** Minimum score to consider a chord match. */
  minScore?: number
  /** Consecutive agreeing frames before `locked` becomes true. */
  lockFrames?: number
  /** Poll interval in ms. */
  intervalMs?: number
}
