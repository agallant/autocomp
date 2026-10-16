import { boundClearInterval, boundSetInterval } from '../audio/timers'
import { expandChartBars, type Chart } from '../music'
import { bestChordMatch, candidatesFromBars } from './match'
import { MicCapture } from './mic'
import type { FollowOptions, FollowSnapshot } from './types'

export type FollowEngineCallbacks = {
  onChange: (snapshot: FollowSnapshot) => void
  /** Called when a locked match suggests seeking to a form bar (1-based). */
  onSeekBar?: (formBar: number) => void
}

/**
 * Polls the mic chroma, matches against the live chart, and optionally seeks
 * the transport when a chord lock is stable and away from the current bar.
 */
export class FollowEngine {
  private readonly getChart: () => Chart
  private readonly getCurrentBarIndex: () => number
  private readonly callbacks: FollowEngineCallbacks
  private readonly minScore: number
  private readonly lockFrames: number
  private readonly intervalMs: number
  private readonly setIntervalFn: typeof setInterval
  private readonly clearIntervalFn: typeof clearInterval

  private mic: MicCapture | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private stableBar: number | null = null
  private stableCount = 0
  private seekEnabled = true
  /** Bumps on stop/restart so in-flight `mic.start()` cannot revive a stopped session. */
  private startGeneration = 0
  private snapshot: FollowSnapshot = {
    match: null,
    locked: false,
    status: 'idle',
    message: 'Follow off',
  }

  constructor(
    options: {
      getChart: () => Chart
      /** 0-based expanded bar index currently playing / selected. */
      getCurrentBarIndex: () => number
      audioContext: AudioContext
      setIntervalFn?: typeof setInterval
      clearIntervalFn?: typeof clearInterval
      mic?: MicCapture
    } & FollowEngineCallbacks &
      FollowOptions,
  ) {
    this.getChart = options.getChart
    this.getCurrentBarIndex = options.getCurrentBarIndex
    this.callbacks = options
    this.minScore = options.minScore ?? 0.14
    this.lockFrames = options.lockFrames ?? 3
    this.intervalMs = options.intervalMs ?? 220
    this.setIntervalFn = options.setIntervalFn ?? boundSetInterval
    this.clearIntervalFn = options.clearIntervalFn ?? boundClearInterval
    this.mic =
      options.mic ??
      (MicCapture.isSupported()
        ? new MicCapture({ audioContext: options.audioContext })
        : null)
  }

  getSnapshot(): FollowSnapshot {
    return { ...this.snapshot, match: this.snapshot.match }
  }

  setSeekEnabled(enabled: boolean): void {
    this.seekEnabled = enabled
  }

  async start(): Promise<void> {
    if (!this.mic) {
      this.emit({
        match: null,
        locked: false,
        status: 'unsupported',
        message: 'Microphone not available in this browser.',
      })
      return
    }
    const generation = ++this.startGeneration
    this.emit({
      match: null,
      locked: false,
      status: 'requesting',
      message: 'Requesting microphone…',
    })
    try {
      await this.mic.start()
    } catch (err) {
      if (generation !== this.startGeneration) {
        this.mic.stop()
        return
      }
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      this.emit({
        match: null,
        locked: false,
        status: denied ? 'denied' : 'error',
        message: denied
          ? 'Microphone permission denied.'
          : 'Could not open microphone.',
      })
      return
    }
    if (generation !== this.startGeneration) {
      this.mic.stop()
      return
    }
    this.stableBar = null
    this.stableCount = 0
    this.emit({
      match: null,
      locked: false,
      status: 'listening',
      message: 'Listening for chords…',
    })
    this.timer = this.setIntervalFn(() => this.tick(), this.intervalMs)
  }

  stop(): void {
    this.startGeneration += 1
    if (this.timer !== null) {
      this.clearIntervalFn(this.timer)
      this.timer = null
    }
    this.mic?.stop()
    this.stableBar = null
    this.stableCount = 0
    this.emit({
      match: null,
      locked: false,
      status: 'idle',
      message: 'Follow off',
    })
  }

  /** Test helper — run one analysis pass. */
  tick(): void {
    if (!this.mic?.running) return
    const chart = this.getChart()
    const bars = expandChartBars(chart)
    const candidates = candidatesFromBars(bars)
    const chroma = this.mic.readChroma()
    const current = this.getCurrentBarIndex()
    const match = bestChordMatch(chroma, candidates, this.minScore, current)

    if (!match) {
      this.stableBar = null
      this.stableCount = 0
      this.emit({
        match: null,
        locked: false,
        status: 'listening',
        message: 'Listening for chords…',
      })
      return
    }

    if (this.stableBar === match.candidate.barIndex) {
      this.stableCount += 1
    } else {
      this.stableBar = match.candidate.barIndex
      this.stableCount = 1
    }
    const locked = this.stableCount >= this.lockFrames
    this.emit({
      match,
      locked,
      status: 'listening',
      message: locked
        ? `Locked ${match.candidate.symbol} (bar ${match.candidate.barIndex + 1})`
        : `Hearing ${match.candidate.symbol}…`,
    })

    if (
      locked &&
      this.seekEnabled &&
      match.candidate.barIndex !== current &&
      this.callbacks.onSeekBar
    ) {
      this.callbacks.onSeekBar(match.candidate.barIndex + 1)
      // Reset stability so we don't spam seeks.
      this.stableCount = 0
    }
  }

  private emit(snapshot: FollowSnapshot): void {
    this.snapshot = snapshot
    this.callbacks.onChange(snapshot)
  }
}
