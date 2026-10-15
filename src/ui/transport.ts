import {
  getAudioContext,
  LookaheadScheduler,
  resumeAudioContext,
  scheduleMetronomeClick,
  scheduleStyleNote,
  type ScheduledBeat,
} from '../audio'
import { expandChartBars, type Chart } from '../music'
import { buildStyleBarContext, type StyleEngine } from '../style'

export type TransportState = {
  playing: boolean
  tempoBpm: number
  bar: number
  beat: number
  /** True once Web Audio has been successfully unlocked for this session. */
  audioReady: boolean
  styleId: string | null
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
  /** Optional accompaniment style realized on each bar downbeat. */
  style?: StyleEngine | null
  /** Live chart provider used by the style engine. */
  getChart?: () => Chart
}

/**
 * Transport driven by a Web Audio lookahead scheduler + optional style engine.
 * UI bar/beat updates fire at (approximately) the scheduled audio time.
 */
export class TransportController {
  private state: TransportState = {
    playing: false,
    tempoBpm: 120,
    bar: 1,
    beat: 1,
    audioReady: false,
    styleId: null,
  }

  private beatsPerBar: number
  private readonly callbacks: TransportCallbacks
  private readonly createAudioContext: () => AudioContext
  private readonly setTimeoutFn: typeof setTimeout
  private readonly clearTimeoutFn: typeof clearTimeout
  private readonly setIntervalFn: typeof setInterval
  private readonly clearIntervalFn: typeof clearInterval
  private metronomeEnabled: boolean
  private style: StyleEngine | null
  private getChart: (() => Chart) | null
  private readonly injectedContext: AudioContext | undefined

  private ctx: AudioContext | null = null
  private scheduler: LookaheadScheduler | null = null
  private uiTimers = new Set<ReturnType<typeof setTimeout>>()
  /** Monotonic token so overlapping async `play()` calls can be invalidated. */
  private playGeneration = 0
  private starting = false

  constructor(options: TransportOptions) {
    this.callbacks = options
    this.beatsPerBar = Math.max(1, Math.round(options.beatsPerBar ?? 4))
    this.injectedContext = options.audioContext
    this.createAudioContext = options.createAudioContext ?? getAudioContext
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout
    this.setIntervalFn = options.setIntervalFn ?? setInterval
    this.clearIntervalFn = options.clearIntervalFn ?? clearInterval
    this.style = options.style ?? null
    this.getChart = options.getChart ?? null
    // Default: metronome on only when no style is attached.
    this.metronomeEnabled =
      options.metronomeEnabled !== undefined
        ? options.metronomeEnabled
        : this.style === null
    this.state = { ...this.state, styleId: this.style?.id ?? null }
    this.callbacks.onChange(this.getState())
  }

  getState(): TransportState {
    return { ...this.state }
  }

  setBeatsPerBar(beatsPerBar: number): void {
    this.beatsPerBar = Math.max(1, Math.round(beatsPerBar))
  }

  setStyle(style: StyleEngine | null): void {
    this.style = style
    this.state = { ...this.state, styleId: style?.id ?? null }
    this.emit()
  }

  setChartProvider(getChart: () => Chart): void {
    this.getChart = getChart
  }

  setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled
  }

  toggle(): void {
    if (this.state.playing || this.starting) {
      this.stop()
    } else {
      void this.play()
    }
  }

  async play(): Promise<void> {
    if (this.state.playing || this.starting) return
    this.starting = true
    const generation = ++this.playGeneration
    const ctx = this.ensureContext()
    try {
      await resumeAudioContext(ctx)
    } catch {
      this.starting = false
      return
    }
    if (generation !== this.playGeneration) {
      this.starting = false
      return
    }

    this.state = {
      ...this.state,
      playing: true,
      bar: 1,
      beat: 1,
      audioReady: true,
    }
    this.starting = false
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
    this.playGeneration += 1
    this.starting = false
    this.scheduler?.stop()
    this.scheduler = null
    this.clearUiTimers()
    this.state = { ...this.state, playing: false, bar: 1, beat: 1 }
    this.emit()
  }

  setTempo(tempoBpm: number): void {
    const clamped = Math.min(300, Math.max(40, Math.round(tempoBpm)))
    this.state = { ...this.state, tempoBpm: clamped }
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
    if (beat.accent) {
      this.scheduleStyleBar(ctx, beat)
    }
    const delayMs = Math.max(0, (beat.time - ctx.currentTime) * 1000)
    const timer = this.setTimeoutFn(() => {
      this.uiTimers.delete(timer)
      if (!this.state.playing) return
      this.state = { ...this.state, bar: beat.bar, beat: beat.beat }
      this.emit()
    }, delayMs)
    this.uiTimers.add(timer)
  }

  private scheduleStyleBar(ctx: AudioContext, beat: ScheduledBeat): void {
    if (!this.style || !this.getChart) return
    const chart = this.getChart()
    const total = expandChartBars(chart).length
    if (total === 0) return
    const barIndex = (Math.max(0, beat.bar - 1) % total + total) % total
    const styleCtx = buildStyleBarContext(chart, barIndex)
    if (!styleCtx) return
    const secondsPerBeat = 60 / Math.max(1, this.state.tempoBpm)
    for (const note of this.style.realizeBar(styleCtx)) {
      const when = beat.time + note.startBeat * secondsPerBeat
      scheduleStyleNote(ctx, note, when, secondsPerBeat)
    }
  }

  private clearUiTimers(): void {
    for (const timer of this.uiTimers) {
      this.clearTimeoutFn(timer)
    }
    this.uiTimers.clear()
  }

  private emit(): void {
    this.callbacks.onChange(this.getState())
  }
}
