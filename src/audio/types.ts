/** Position in a looping count-in / form playback (1-based bar & beat). */
export type BeatPosition = {
  bar: number
  beat: number
}

export type ScheduledBeat = BeatPosition & {
  /** AudioContext time (seconds) when the beat should sound. */
  time: number
  /** True on beat 1 of the bar (accent click). */
  accent: boolean
}

/** Minimal clock surface used by the lookahead scheduler (testable). */
export type AudioClock = {
  readonly currentTime: number
}
