import { ensureSampleKit, scheduleStyleNote, type SampleKit } from '../audio'
import { beatsPerBar, expandChartBars, type Chart } from '../music'
import { buildStyleBarContextFromBars, type StyleEngine } from '../style'
import { chartFormDurationSeconds } from './duration'

export type BounceOptions = {
  /** Chart-beat tempo (same units as the transport). */
  tempoBpm: number
  sampleRate?: number
  /** Extra silence after the last bar so note releases finish. */
  tailSeconds?: number
  /** Prefetched kit (tests); otherwise loads bundled CC0 samples. */
  sampleKit?: SampleKit | null
  /** Inject OfflineAudioContext for tests / non-browser environments. */
  createOfflineContext?: (
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ) => OfflineAudioContext
  /** Inject fetch for sample loading in tests. */
  fetchFn?: typeof fetch
}

const DEFAULT_SAMPLE_RATE = 44_100
/** Cover final-note overrun (e.g. jazz comps past the bar) down to the 40 BPM floor. */
const DEFAULT_TAIL_SECONDS = 0.2

/**
 * Offline-bounce one form pass of a chart through a style engine into an AudioBuffer.
 * Uses the same synth scheduling path as live playback (`scheduleStyleNote`).
 */
export async function bounceChartToBuffer(
  chart: Chart,
  style: StyleEngine,
  options: BounceOptions,
): Promise<AudioBuffer> {
  const tempoBpm = Math.max(1, options.tempoBpm)
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE
  const tailSeconds = options.tailSeconds ?? DEFAULT_TAIL_SECONDS
  const secondsPerBeat = 60 / tempoBpm
  const durationSec = chartFormDurationSeconds(chart, tempoBpm) + tailSeconds
  const length = Math.max(1, Math.ceil(durationSec * sampleRate))

  const create =
    options.createOfflineContext ??
    ((channels: number, len: number, rate: number) => new OfflineAudioContext(channels, len, rate))

  const ctx = create(2, length, sampleRate)
  let kit = options.sampleKit ?? null
  if (kit === null && options.sampleKit === undefined) {
    try {
      kit = await ensureSampleKit(ctx, options.fetchFn ?? fetch)
    } catch {
      kit = null
    }
  }
  const bars = expandChartBars(chart)
  let beatCursor = 0

  for (let barIndex = 0; barIndex < bars.length; barIndex++) {
    const bar = bars[barIndex]!
    const ts = bar.timeSignature ?? chart.timeSignature
    const bpb = beatsPerBar(ts)
    const ctxBar = buildStyleBarContextFromBars(chart, bars, barIndex, { wrapNext: false })
    if (!ctxBar) {
      beatCursor += bpb
      continue
    }
    const barStart = beatCursor * secondsPerBeat
    for (const note of style.realizeBar(ctxBar)) {
      const when = barStart + note.startBeat * secondsPerBeat
      scheduleStyleNote(ctx, note, when, secondsPerBeat, { kit })
    }
    beatCursor += bpb
  }

  return ctx.startRendering()
}
