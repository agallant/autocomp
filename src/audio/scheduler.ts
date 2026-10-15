import type { AudioClock, BeatPosition, ScheduledBeat } from './types'

export type LookaheadSchedulerOptions = {
  clock: AudioClock
  getTempoBpm: () => number
  /** Beats in the bar for the given 1-based form bar number. */
  getBeatsPerBar: (bar: number) => number
  /** How far ahead of the audio clock to schedule (seconds). */
  scheduleAheadTime?: number
  /** How often to run the scheduling loop (ms). */
  lookaheadMs?: number
  onSchedule: (beat: ScheduledBeat) => void
  /** Injected timer APIs for tests. */
  setIntervalFn?: typeof setInterval
  clearIntervalFn?: typeof clearInterval
}

/**
 * Classic lookahead beat scheduler (Chris Wilson pattern).
 * Advances bar/beat in musical time and invokes `onSchedule` slightly ahead of `clock.currentTime`.
 */
export class LookaheadScheduler {
  private readonly scheduleAheadTime: number
  private readonly lookaheadMs: number
  private readonly setIntervalFn: typeof setInterval
  private readonly clearIntervalFn: typeof clearInterval
  private readonly getTempoBpm: () => number
  private readonly getBeatsPerBar: (bar: number) => number
  private readonly onSchedule: (beat: ScheduledBeat) => void
  private readonly clock: AudioClock

  private timer: ReturnType<typeof setInterval> | null = null
  private nextNoteTime = 0
  private position: BeatPosition = { bar: 1, beat: 1 }
  private running = false

  constructor(options: LookaheadSchedulerOptions) {
    this.clock = options.clock
    this.getTempoBpm = options.getTempoBpm
    this.getBeatsPerBar = options.getBeatsPerBar
    this.onSchedule = options.onSchedule
    this.scheduleAheadTime = options.scheduleAheadTime ?? 0.1
    this.lookaheadMs = options.lookaheadMs ?? 25
    this.setIntervalFn = options.setIntervalFn ?? setInterval
    this.clearIntervalFn = options.clearIntervalFn ?? clearInterval
  }

  isRunning(): boolean {
    return this.running
  }

  getPosition(): BeatPosition {
    return { ...this.position }
  }

  /** Start counting from bar 1 / beat 1 at `startTime` (defaults to a short offset from now). */
  start(startTime?: number): void {
    if (this.running) return
    this.running = true
    this.position = { bar: 1, beat: 1 }
    this.nextNoteTime = startTime ?? this.clock.currentTime + 0.05
    this.timer = this.setIntervalFn(() => this.tick(), this.lookaheadMs)
    this.tick()
  }

  stop(): void {
    this.running = false
    if (this.timer !== null) {
      this.clearIntervalFn(this.timer)
      this.timer = null
    }
    this.position = { bar: 1, beat: 1 }
    this.nextNoteTime = 0
  }

  /**
   * Jump the musical cursor while running. Clears the schedule horizon so the
   * next tick emits from `bar`/`beat` shortly after `clock.currentTime`.
   */
  seek(bar: number, beat = 1): void {
    if (!this.running) return
    const safeBar = Math.max(1, Math.floor(bar))
    const beatsPerBar = Math.max(1, Math.round(this.getBeatsPerBar(safeBar)))
    const safeBeat = Math.min(beatsPerBar, Math.max(1, Math.floor(beat)))
    this.position = { bar: safeBar, beat: safeBeat }
    this.nextNoteTime = this.clock.currentTime + 0.05
    // Schedule immediately so a delayed interval cannot skip the target beat.
    this.tick()
  }

  /** Run one scheduling pass (also used by tests without waiting on the interval). */
  tick(): void {
    if (!this.running) return
    const now = this.clock.currentTime
    const horizon = now + this.scheduleAheadTime
    while (this.nextNoteTime < horizon) {
      const beatsPerBar = Math.max(1, Math.round(this.getBeatsPerBar(this.position.bar)))
      // Skip beats that already elapsed (tab backgrounded / long stall) — keep position.
      if (this.nextNoteTime < now) {
        this.advance(beatsPerBar)
        continue
      }
      const beat: ScheduledBeat = {
        time: this.nextNoteTime,
        bar: this.position.bar,
        beat: this.position.beat,
        accent: this.position.beat === 1,
      }
      this.onSchedule(beat)
      this.advance(beatsPerBar)
    }
  }

  private advance(beatsPerBar: number): void {
    const secondsPerBeat = 60 / Math.max(1, this.getTempoBpm())
    this.nextNoteTime += secondsPerBeat
    let { bar, beat } = this.position
    beat += 1
    if (beat > beatsPerBar) {
      beat = 1
      bar += 1
    }
    this.position = { bar, beat }
  }
}

/** Pure helper: seconds per beat at a tempo. */
export function secondsPerBeat(tempoBpm: number): number {
  return 60 / Math.max(1, tempoBpm)
}
