/** Sliding-window tap-tempo estimator (matches transport clamp 40–300). */

export const TAP_TEMPO_MIN_BPM = 40
export const TAP_TEMPO_MAX_BPM = 300
/** Gaps longer than this reset the tap history (ms). */
export const TAP_TEMPO_RESET_MS = 2000
/** Keep at most this many recent intervals. */
export const TAP_TEMPO_MAX_INTERVALS = 4

export type TapTempoState = {
  /** Millisecond timestamps from a consistent clock source (oldest → newest). */
  taps: number[]
}

export function createTapTempoState(): TapTempoState {
  return { taps: [] }
}

/**
 * Record a tap at `nowMs` and return the estimated BPM when at least two taps
 * are available; otherwise `null` (need another tap).
 */
export function tapTempo(
  state: TapTempoState,
  nowMs: number,
  options: {
    resetMs?: number
    maxIntervals?: number
    minBpm?: number
    maxBpm?: number
  } = {},
): number | null {
  const resetMs = options.resetMs ?? TAP_TEMPO_RESET_MS
  const maxIntervals = options.maxIntervals ?? TAP_TEMPO_MAX_INTERVALS
  const minBpm = options.minBpm ?? TAP_TEMPO_MIN_BPM
  const maxBpm = options.maxBpm ?? TAP_TEMPO_MAX_BPM

  const last = state.taps[state.taps.length - 1]
  if (last !== undefined && nowMs - last > resetMs) {
    state.taps = []
  }
  state.taps.push(nowMs)

  // Keep (maxIntervals + 1) timestamps → maxIntervals intervals.
  const maxTaps = maxIntervals + 1
  if (state.taps.length > maxTaps) {
    state.taps = state.taps.slice(state.taps.length - maxTaps)
  }
  if (state.taps.length < 2) return null

  let sum = 0
  for (let i = 1; i < state.taps.length; i++) {
    sum += state.taps[i]! - state.taps[i - 1]!
  }
  const avgMs = sum / (state.taps.length - 1)
  if (avgMs <= 0) return null
  const bpm = Math.round(60_000 / avgMs)
  return Math.min(maxBpm, Math.max(minBpm, bpm))
}
