import { beatsPerBar, expandChartBars, type Chart, type TimeSignature } from '../music'
import type { StyleVoice } from '../style'
import { countInBeats } from '../variation'
import { quartersPerChartBeat } from './realize'
import type { AbsoluteMidiNote } from './types'
import { MIDI_PPQ, VOICE_CHANNEL, VOICE_PROGRAM } from './types'

export type EncodeSmfOptions = {
  /**
   * Tempo in chart-beats per minute (same as the transport).
   * Defaults to chart.defaultTempoBpm.
   */
  tempoBpm?: number
  /** Pulses per quarter note (default MIDI_PPQ). Must be 1–32767. */
  ppq?: number
  /** Lead-in bars — shifts tempo/meter meta to align with realized notes. */
  countInBars?: number
}

type TrackEvent = {
  tick: number
  /** Sort key: lower runs first at the same tick (note-offs before note-ons). */
  order: number
  bytes: number[]
}

/**
 * Encode realized accompaniment notes as a Format-1 Standard MIDI File.
 * Track 0 = tempo/meter; tracks 1–3 = bass, piano, drums.
 * Notes must be timed in quarter notes (see `realizeChartMidi`).
 */
export function encodeSmf(
  chart: Chart,
  notes: AbsoluteMidiNote[],
  options: EncodeSmfOptions = {},
): Uint8Array {
  const ppq = options.ppq ?? MIDI_PPQ
  if (!Number.isInteger(ppq) || ppq < 1 || ppq > 32767) {
    throw new Error(`Invalid PPQ ${ppq}: must be an integer from 1 to 32767`)
  }
  assertPowerOfTwoMeter(chart.timeSignature, 'chart.timeSignature')

  const tempoBpm = Math.max(1, options.tempoBpm ?? chart.defaultTempoBpm)
  const countInBars = Number.isFinite(options.countInBars)
    ? Math.max(0, Math.floor(options.countInBars!))
    : 0
  const tempoTrack = buildTempoMeterTrack(chart, tempoBpm, ppq, countInBars)

  const byVoice: Record<StyleVoice, AbsoluteMidiNote[]> = {
    bass: [],
    piano: [],
    melody: [],
    drums: [],
  }
  for (const note of notes) {
    byVoice[note.voice].push(note)
  }

  const tracks = [
    encodeTrack(tempoTrack),
    encodeVoiceTrack('Bass', 'bass', byVoice.bass, ppq),
    encodeVoiceTrack('Piano', 'piano', byVoice.piano, ppq),
    encodeVoiceTrack('Guide', 'melody', byVoice.melody, ppq),
    encodeVoiceTrack('Drums', 'drums', byVoice.drums, ppq),
  ]

  return concatBytes([
    encodeHeader(1, tracks.length, ppq),
    ...tracks,
  ])
}

/** Build tempo + time-signature meta events, including per-bar meter overrides. */
function buildTempoMeterTrack(
  chart: Chart,
  chartTempoBpm: number,
  ppq: number,
  countInBars = 0,
): TrackEvent[] {
  const events: TrackEvent[] = [
    { tick: 0, order: 2, bytes: metaTrackName(chart.title || 'Autocomp') },
  ]

  const bars = expandChartBars(chart)
  const openTs = bars[0]?.timeSignature ?? chart.timeSignature
  const leadBeats = countInBeats(chart, countInBars)
  const leadTicks = Math.round(leadBeats * quartersPerChartBeat(openTs) * ppq)

  let tick = leadTicks
  let lastTs: TimeSignature | null = null
  let lastMicros = -1

  // Count-in uses the opening meter/tempo from tick 0 through the lead-in.
  if (leadTicks > 0 && bars.length > 0) {
    assertPowerOfTwoMeter(openTs, 'chart.timeSignature')
    const micros = microsPerQuarter(chartTempoBpm, openTs)
    events.push({ tick: 0, order: 0, bytes: metaTempoMicros(micros) })
    events.push({ tick: 0, order: 1, bytes: metaTimeSignature(openTs.numerator, openTs.denominator) })
    lastTs = openTs
    lastMicros = micros
  }

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]!
    const ts = bar.timeSignature ?? chart.timeSignature
    assertPowerOfTwoMeter(ts, i === 0 ? 'chart.timeSignature' : `bar[${i}].timeSignature`)

    const micros = microsPerQuarter(chartTempoBpm, ts)
    const meterChanged =
      !lastTs ||
      lastTs.numerator !== ts.numerator ||
      lastTs.denominator !== ts.denominator
    const tempoChanged = micros !== lastMicros

    // When a count-in already emitted opening meter/tempo at tick 0, skip duplicates.
    if (meterChanged || (i === 0 && leadTicks === 0)) {
      events.push({ tick, order: 1, bytes: metaTimeSignature(ts.numerator, ts.denominator) })
    }
    if (tempoChanged || (i === 0 && leadTicks === 0)) {
      // Constant chart-beat tempo ⇒ quarter-note tempo shifts when the denominator changes.
      events.push({ tick, order: 0, bytes: metaTempoMicros(micros) })
    }

    lastTs = ts
    lastMicros = micros
    tick += Math.round(beatsPerBar(ts) * quartersPerChartBeat(ts) * ppq)
  }

  // Empty chart: still emit chart-level meter/tempo at tick 0.
  if (bars.length === 0) {
    const ts = chart.timeSignature
    events.push({ tick: 0, order: 0, bytes: metaTempoMicros(microsPerQuarter(chartTempoBpm, ts)) })
    events.push({ tick: 0, order: 1, bytes: metaTimeSignature(ts.numerator, ts.denominator) })
  }

  return events
}

function microsPerQuarter(chartTempoBpm: number, ts: TimeSignature): number {
  // seconds/chartBeat = 60/tempo; quarters/chartBeat = 4/denom
  // ⇒ micros/quarter = 60e6 * (denom/4) / tempo = 15e6 * denom / tempo
  return Math.round((15_000_000 * ts.denominator) / chartTempoBpm)
}

function encodeVoiceTrack(
  name: string,
  voice: AbsoluteMidiNote['voice'],
  notes: AbsoluteMidiNote[],
  ppq: number,
): Uint8Array {
  const channel = VOICE_CHANNEL[voice]
  const events: TrackEvent[] = [{ tick: 0, order: 0, bytes: metaTrackName(name) }]

  if (voice !== 'drums') {
    events.push({
      tick: 0,
      order: 1,
      bytes: [0xc0 | channel, VOICE_PROGRAM[voice]],
    })
  }

  for (const note of notes) {
    if (note.velocity <= 0) continue
    const start = Math.round(note.startBeat * ppq)
    const duration = Math.max(1, Math.round(note.durationBeats * ppq))
    const midi = clamp7(note.midi)
    const velocity = Math.max(1, Math.min(127, Math.round(note.velocity * 127)))
    // Note-offs (order 10) before note-ons (order 20) at the same tick.
    events.push({
      tick: start + duration,
      order: 10,
      bytes: [0x80 | channel, midi, 0],
    })
    events.push({
      tick: start,
      order: 20,
      bytes: [0x90 | channel, midi, velocity],
    })
  }

  return encodeTrack(events)
}

function encodeTrack(events: TrackEvent[]): Uint8Array {
  const sorted = [...events].sort((a, b) => a.tick - b.tick || a.order - b.order)
  const body: number[] = []
  let lastTick = 0
  for (const event of sorted) {
    body.push(...encodeVlq(event.tick - lastTick), ...event.bytes)
    lastTick = event.tick
  }
  // End of track
  body.push(...encodeVlq(0), 0xff, 0x2f, 0x00)

  const length = encodeUint32(body.length)
  return concatBytes([textBytes('MTrk'), length, new Uint8Array(body)])
}

function encodeHeader(format: number, trackCount: number, ppq: number): Uint8Array {
  return concatBytes([
    textBytes('MThd'),
    encodeUint32(6),
    encodeUint16(format),
    encodeUint16(trackCount),
    encodeUint16(ppq),
  ])
}

function metaTempoMicros(micros: number): number[] {
  const value = Math.max(1, Math.min(0xffffff, Math.round(micros)))
  return [0xff, 0x51, 0x03, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

function metaTimeSignature(numerator: number, denominator: number): number[] {
  const denomPow = Math.log2(denominator)
  if (!Number.isInteger(denomPow) || denomPow < 0) {
    throw new Error(`SMF time signature denominator must be a power of two (got ${denominator})`)
  }
  return [0xff, 0x58, 0x04, numerator & 0xff, denomPow & 0xff, 24, 8]
}

function metaTrackName(name: string): number[] {
  // Cap by UTF-8 byte length, advancing by full Unicode code points (not UTF-16 units).
  const encoder = new TextEncoder()
  const bytes: number[] = []
  for (const character of name) {
    const encoded = encoder.encode(character)
    if (bytes.length + encoded.length > 64) break
    for (const b of encoded) bytes.push(b)
  }
  return [0xff, 0x03, ...encodeVlq(bytes.length), ...bytes]
}

function assertPowerOfTwoMeter(ts: TimeSignature, path: string): void {
  const { numerator, denominator } = ts
  if (!Number.isInteger(numerator) || numerator < 1 || numerator > 255) {
    throw new Error(
      `Unsupported meter at ${path}: numerator ${numerator} must be an integer from 1 to 255`,
    )
  }
  if (!Number.isInteger(denominator) || denominator < 1 || (denominator & (denominator - 1)) !== 0) {
    throw new Error(
      `Unsupported meter at ${path}: denominator ${denominator} is not a power of two (required for SMF)`,
    )
  }
}

/** MIDI variable-length quantity. */
export function encodeVlq(value: number): number[] {
  let n = Math.max(0, Math.floor(value))
  const bytes = [n & 0x7f]
  n >>= 7
  while (n > 0) {
    bytes.unshift((n & 0x7f) | 0x80)
    n >>= 7
  }
  return bytes
}

function encodeUint16(value: number): Uint8Array {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff])
}

function encodeUint32(value: number): Uint8Array {
  return new Uint8Array([
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ])
}

/** Encode text as UTF-8 (widely accepted for SMF meta text; ASCII stays single-byte). */
function textBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0
  for (const part of parts) total += part.length
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function clamp7(value: number): number {
  return Math.max(0, Math.min(127, Math.round(value)))
}
