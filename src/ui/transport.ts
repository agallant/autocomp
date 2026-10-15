import {
  ensureSampleKit,
  getAudioContext,
  LookaheadScheduler,
  scheduleMetronomeClick,
  scheduleStyleNote,
  unlockAudioContext,
  type ScheduledBeat,
  type ScheduledSource,
} from '../audio'
import type { WebMidiSink } from '../midi'
import { beatsPerBar, expandChartBars, type Chart } from '../music'
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
  /** Optional accompaniment style realized per beat. */
  style?: StyleEngine | null
  /** Live chart provider used by the style engine. */
  getChart?: () => Chart
  /** Optional WebMIDI sink mirroring scheduled style notes. */
  midiSink?: WebMidiSink | null
  /** Bars of metronome before form bar 1 (style silent during count-in). */
  countInBars?: number
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

  private defaultBeatsPerBar: number
  private readonly callbacks: TransportCallbacks
  private readonly createAudioContext: () => AudioContext
  private readonly setTimeoutFn: typeof setTimeout
  private readonly clearTimeoutFn: typeof clearTimeout
  private readonly setIntervalFn: typeof setInterval
  private readonly clearIntervalFn: typeof clearInterval
  private metronomeEnabled: boolean
  private style: StyleEngine | null
  private getChart: (() => Chart) | null
  private midiSink: WebMidiSink | null
  private countInBars: number
  /** Count-in changes while playing apply on the next `play()`. */
  private pendingCountInBars: number | null = null
  private readonly injectedContext: AudioContext | undefined

  private ctx: AudioContext | null = null
  private scheduler: LookaheadScheduler | null = null
  private uiTimers = new Set<ReturnType<typeof setTimeout>>()
  private audioSources = new Set<ScheduledSource>()
  /** Monotonic token so overlapping async `play()` calls can be invalidated. */
  private playGeneration = 0
  private starting = false

  constructor(options: TransportOptions) {
    this.callbacks = options
    this.defaultBeatsPerBar = Math.max(1, Math.round(options.beatsPerBar ?? 4))
    this.injectedContext = options.audioContext
    this.createAudioContext = options.createAudioContext ?? getAudioContext
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout
    this.setIntervalFn = options.setIntervalFn ?? setInterval
    this.clearIntervalFn = options.clearIntervalFn ?? clearInterval
    this.style = options.style ?? null
    this.getChart = options.getChart ?? null
    this.midiSink = options.midiSink ?? null
    this.countInBars = Math.max(0, Math.floor(options.countInBars ?? 0))
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

  setBeatsPerBar(beats: number): void {
    this.defaultBeatsPerBar = Math.max(1, Math.round(beats))
  }

  setStyle(
    style: StyleEngine | null,
    options: { /** When false, keep ringing notes (tempo / variation tweaks). */ stopSources?: boolean } = {},
  ): void {
    const stopSources = options.stopSources !== false
    if (stopSources) {
      // Drop in-flight notes from the previous style so long ballad tones don't overlap.
      this.stopAudioSources()
      this.midiSink?.clear()
    }
    this.style = style
    this.state = { ...this.state, styleId: style?.id ?? null }
    this.emit()
  }

  setChartProvider(getChart: () => Chart): void {
    this.getChart = getChart
  }

  setMidiSink(sink: WebMidiSink | null): void {
    this.midiSink?.clear()
    this.midiSink = sink
  }

  setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled
  }

  setCountInBars(bars: number): void {
    const next = Number.isFinite(bars) ? Math.max(0, Math.floor(bars)) : 0
    // Mid-playback changes would rematerialize the form offset under the scheduler.
    if (this.state.playing || this.starting) {
      this.pendingCountInBars = next
      return
    }
    this.countInBars = next
    this.pendingCountInBars = null
  }

  getCountInBars(): number {
    return this.countInBars
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
      // Safari/iPad needs a silent buffer kick; resume alone is not enough.
      await unlockAudioContext(ctx)
      // Kick off sample decode without blocking transport start (avoids Play→Stop races).
      void ensureSampleKit(ctx).catch(() => undefined)
    } catch {
      this.starting = false
      // A newer play()/stop() may own the session — don't clobber its state.
      if (generation !== this.playGeneration) return
      this.state = { ...this.state, playing: false, audioReady: false }
      this.emit()
      return
    }
    if (generation !== this.playGeneration) {
      this.starting = false
      return
    }

    if (this.pendingCountInBars !== null) {
      this.countInBars = this.pendingCountInBars
      this.pendingCountInBars = null
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
      getBeatsPerBar: (bar) => this.beatsForFormBar(bar),
      setIntervalFn: this.setIntervalFn,
      clearIntervalFn: this.clearIntervalFn,
      onSchedule: (beat) => this.handleScheduledBeat(ctx, beat),
    })
    // Keep the lead-in inside the scheduler's default 100ms lookahead window.
    this.scheduler.start(ctx.currentTime + 0.08)
  }

  stop(): void {
    this.playGeneration += 1
    this.starting = false
    this.scheduler?.stop()
    this.scheduler = null
    this.clearUiTimers()
    this.stopAudioSources()
    this.midiSink?.clear()
    this.state = { ...this.state, playing: false, bar: 1, beat: 1 }
    this.emit()
  }

  setTempo(tempoBpm: number): void {
    const clamped = Math.min(300, Math.max(40, Math.round(tempoBpm)))
    this.state = { ...this.state, tempoBpm: clamped }
    this.emit()
  }

  /**
   * Seek to a 1-based form bar while playing (experimental Follow).
   * No-ops when stopped. Count-in offset is applied internally.
   */
  seekToFormBar(formBar: number): void {
    if (!this.state.playing || !this.scheduler) return
    const chart = this.getChart?.()
    const total = chart ? expandChartBars(chart).length : 0
    if (total <= 0) return
    const clamped = Math.min(total, Math.max(1, Math.floor(formBar)))
    this.stopAudioSources()
    this.midiSink?.clear()
    this.clearUiTimers()
    const schedulerBar = clamped + this.countInBars
    this.scheduler.seek(schedulerBar, 1)
    this.state = { ...this.state, bar: clamped, beat: 1 }
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

  private beatsForFormBar(formBar: number): number {
    const chart = this.getChart?.()
    if (!chart) return this.defaultBeatsPerBar
    const bars = expandChartBars(chart)
    if (bars.length === 0) return this.defaultBeatsPerBar
    // Count-in uses the opening bar's meter.
    if (formBar <= this.countInBars) {
      const open = bars[0]!
      return beatsPerBar(open.timeSignature ?? chart.timeSignature)
    }
    const formIndex = formBar - 1 - this.countInBars
    const bar = bars[((formIndex % bars.length) + bars.length) % bars.length]!
    return beatsPerBar(bar.timeSignature ?? chart.timeSignature)
  }

  private handleScheduledBeat(ctx: AudioContext, beat: ScheduledBeat): void {
    const inCountIn = beat.bar <= this.countInBars
    if (this.metronomeEnabled || inCountIn) {
      this.trackAudioSource(scheduleMetronomeClick(ctx, beat.time, beat.accent))
    }
    this.scheduleStyleBeat(ctx, beat)
    const delayMs = Math.max(0, (beat.time - ctx.currentTime) * 1000)
    const timer = this.setTimeoutFn(() => {
      this.uiTimers.delete(timer)
      if (!this.state.playing) return
      // Count-in shows as bar 0; form bars are 1-based after the lead-in.
      const displayBar = inCountIn ? 0 : beat.bar - this.countInBars
      this.state = { ...this.state, bar: displayBar, beat: beat.beat }
      this.emit()
    }, delayMs)
    this.uiTimers.add(timer)
  }

  /** Schedule only the style notes that fall inside this beat (keeps Stop / tempo responsive). */
  private scheduleStyleBeat(ctx: AudioContext, beat: ScheduledBeat): void {
    if (!this.style || !this.getChart) return
    if (beat.bar <= this.countInBars) return
    const chart = this.getChart()
    const total = expandChartBars(chart).length
    if (total === 0) return
    const formIndex = beat.bar - 1 - this.countInBars
    const barIndex = ((formIndex % total) + total) % total
    const styleCtx = buildStyleBarContext(chart, barIndex)
    if (!styleCtx) return
    const beatIndex = beat.beat - 1
    const secondsPerBeat = 60 / Math.max(1, this.state.tempoBpm)
    for (const note of this.style.realizeBar(styleCtx)) {
      if (note.startBeat < beatIndex || note.startBeat >= beatIndex + 1) continue
      const when = beat.time + (note.startBeat - beatIndex) * secondsPerBeat
      for (const source of scheduleStyleNote(ctx, note, when, secondsPerBeat)) {
        this.trackAudioSource(source)
      }
      this.midiSink?.scheduleNote(note, when, ctx.currentTime, secondsPerBeat)
    }
  }

  private trackAudioSource(source: ScheduledSource): void {
    this.audioSources.add(source)
    // Drop finished nodes so long sessions do not retain every past hit.
    const node = source as ScheduledSource & { onended: ((ev: Event) => void) | null }
    if ('onended' in node) {
      node.onended = () => {
        this.audioSources.delete(source)
      }
    }
  }

  private stopAudioSources(): void {
    for (const source of this.audioSources) {
      try {
        source.stop(0)
      } catch {
        // already stopped
      }
    }
    this.audioSources.clear()
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
