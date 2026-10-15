import {
  getAudioContext,
  LookaheadScheduler,
  resumeAudioContext,
  scheduleMetronomeClick,
  type ScheduledBeat,
} from '../audio'

export type TransportState = {
  playing: boolean
  tempoBpm: number
  bar: number
  beat: number
  /** True once Web Audio has been successfully unlocked for this session. */
  audioReady: boolean
}

export type TransportCallbacks = {
  onChange: (state: TransportState) => void
}

export type TransportOptions = TransportCallbacks & {
  beatsPerBar?: number
  /** Inject AudioContext for tests / non-browser environments. */
  audioContext?: AudioContext
  createAudioContext?: () => AudioContext
  setTimeoutFn?: typeof setTimeout
  clearTimeoutFn?: typeof clearTimeout
  setIntervalFn?: typeof setInterval
  clearIntervalFn?: typeof clearInterval
  /** When false, skips scheduling click sounds (UI/scheduler still run). */
  metronomeEnabled?: boolean
}

/**
 * Transport driven by a Web Audio lookahead scheduler + metronome.
 * UI bar/beat updates fire at (approximately) the scheduled audio time.
 */
export class TransportController {
  private state: TransportState = {
    playing: false,
    tempoBpm: 120,
    bar: 1,
    beat: 1,
    audioReady: false,
  }

  private beatsPerBar: number
  private readonly callbacks: TransportCallbacks
  private readonly createAudioContext: () => AudioContext
  private readonly setTimeoutFn: typeof setTimeout
  private readonly clearTimeoutFn: typeof clearTimeout
  private readonly setIntervalFn: typeof setInterval
  private readonly clearIntervalFn: typeof clearInterval
  private readonly metronomeEnabled: boolean
  private readonly injectedContext: AudioContext | undefined

  private ctx: AudioContext | null = null
  private scheduler: LookaheadScheduler | null = null
  private uiTimers: ReturnType<typeof setTimeout>[] = []

  constructor(options: TransportOptions) {
    this.callbacks = options
    this.beatsPerBar = Math.max(1, Math.round(options.beatsPerBar ?? 4))
    this.injectedContext = options.audioContext
    this.createAudioContext = options.createAudioContext ?? getAudioContext
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout
    this.setIntervalFn = options.setIntervalFn ?? setInterval
    this.clearIntervalFn = options.clearIntervalFn ?? clearInterval
    this.metronomeEnabled = options.metronomeEnabled !== false
    this.callbacks.onChange(this.getState())
  }

  getState(): TransportState {
    return { ...this.state }
  }

  setBeatsPerBar(beatsPerBar: number): void {
    this.beatsPerBar = Math.max(1, Math.round(beatsPerBar))
  }

  toggle(): void {
    if (this.state.playing) {
      this.stop()
    } else {
      void this.play()
    }
  }

  async play(): Promise<void> {
    if (this.state.playing) return
    const ctx = this.ensureContext()
    await resumeAudioContext(ctx)
    this.state = {
      ...this.state,
      playing: true,
      bar: 1,
      beat: 1,
      audioReady: true,
    }
    this.emit()

    this.scheduler = new LookaheadScheduler({
      clock: ctx,
      getTempoBpm: () => this.state.tempoBpm,
      getBeatsPerBar: () => this.beatsPerBar,
      setIntervalFn: this.setIntervalFn,
      clearIntervalFn: this.clearIntervalFn,
      onSchedule: (beat) => this.handleScheduledBeat(ctx, beat),
    })
    this.scheduler.start(ctx.currentTime + 0.05)
  }

  stop(): void {
    this.scheduler?.stop()
    this.scheduler = null
    this.clearUiTimers()
    this.state = { ...this.state, playing: false, bar: 1, beat: 1 }
    this.emit()
  }

  setTempo(tempoBpm: number): void {
    const clamped = Math.min(300, Math.max(40, Math.round(tempoBpm)))
    this.state = { ...this.state, tempoBpm: clamped }
    // Scheduler reads tempo via getter on each scheduled note — no restart needed.
    this.emit()
  }

  dispose(): void {
    this.stop()
  }

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx
    this.ctx = this.injectedContext ?? this.createAudioContext()
    return this.ctx
  }

  private handleScheduledBeat(ctx: AudioContext, beat: ScheduledBeat): void {
    if (this.metronomeEnabled) {
      scheduleMetronomeClick(ctx, beat.time, beat.accent)
    }
    const delayMs = Math.max(0, (beat.time - ctx.currentTime) * 1000)
    const timer = this.setTimeoutFn(() => {
      if (!this.state.playing) return
      this.state = { ...this.state, bar: beat.bar, beat: beat.beat }
      this.emit()
    }, delayMs)
    this.uiTimers.push(timer)
  }

  private clearUiTimers(): void {
    for (const timer of this.uiTimers) {
      this.clearTimeoutFn(timer)
    }
    this.uiTimers = []
  }

  private emit(): void {
    this.callbacks.onChange(this.getState())
  }
}
