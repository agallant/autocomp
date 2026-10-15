import type { Chart } from '../music'
import type { AbsoluteMidiNote } from './types'
import { MIDI_PPQ, VOICE_CHANNEL, VOICE_PROGRAM } from './types'

export type EncodeSmfOptions = {
  /** Tempo for the file (defaults to chart.defaultTempoBpm). */
  tempoBpm?: number
  /** Pulses per quarter note (default MIDI_PPQ). */
  ppq?: number
}

type TrackEvent = {
  tick: number
  /** Sort key so meta/program precede note-ons at the same tick. */
  order: number
  bytes: number[]
}

/**
 * Encode realized accompaniment notes as a Format-1 Standard MIDI File.
 * Track 0 = tempo/meter; tracks 1–3 = bass, piano, drums.
 */
export function encodeSmf(
  chart: Chart,
  notes: AbsoluteMidiNote[],
  options: EncodeSmfOptions = {},
): Uint8Array {
  const ppq = options.ppq ?? MIDI_PPQ
  const tempoBpm = Math.max(1, options.tempoBpm ?? chart.defaultTempoBpm)
  const numerator = chart.timeSignature.numerator
  const denominator = chart.timeSignature.denominator

  const tempoTrack: TrackEvent[] = [
    { tick: 0, order: 0, bytes: metaTempo(tempoBpm) },
    { tick: 0, order: 1, bytes: metaTimeSignature(numerator, denominator) },
    { tick: 0, order: 2, bytes: metaTrackName(chart.title || 'Autocomp') },
  ]

  const byVoice = {
    bass: [] as AbsoluteMidiNote[],
    piano: [] as AbsoluteMidiNote[],
    drums: [] as AbsoluteMidiNote[],
  }
  for (const note of notes) {
    byVoice[note.voice].push(note)
  }

  const tracks = [
    encodeTrack(tempoTrack),
    encodeVoiceTrack('Bass', 'bass', byVoice.bass, ppq),
    encodeVoiceTrack('Piano', 'piano', byVoice.piano, ppq),
    encodeVoiceTrack('Drums', 'drums', byVoice.drums, ppq),
  ]

  return concatBytes([
    encodeHeader(1, tracks.length, ppq),
    ...tracks,
  ])
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
    const start = Math.round(note.startBeat * ppq)
    const duration = Math.max(1, Math.round(note.durationBeats * ppq))
    const midi = clamp7(note.midi)
    const velocity = Math.max(1, Math.min(127, Math.round(note.velocity * 127)))
    events.push({
      tick: start,
      order: 10,
      bytes: [0x90 | channel, midi, velocity],
    })
    events.push({
      tick: start + duration,
      order: 20,
      bytes: [0x80 | channel, midi, 0],
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
  return concatBytes([asciiBytes('MTrk'), length, new Uint8Array(body)])
}

function encodeHeader(format: number, trackCount: number, ppq: number): Uint8Array {
  return concatBytes([
    asciiBytes('MThd'),
    encodeUint32(6),
    encodeUint16(format),
    encodeUint16(trackCount),
    encodeUint16(ppq),
  ])
}

function metaTempo(bpm: number): number[] {
  const micros = Math.round(60_000_000 / bpm)
  return [0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff]
}

function metaTimeSignature(numerator: number, denominator: number): number[] {
  // Denominator stored as power of two (4 → 2, 8 → 3).
  let denomPow = 0
  let d = denominator
  while (d > 1) {
    d >>= 1
    denomPow++
  }
  return [0xff, 0x58, 0x04, numerator & 0xff, denomPow & 0xff, 24, 8]
}

function metaTrackName(name: string): number[] {
  const text = asciiBytes(name.slice(0, 64))
  return [0xff, 0x03, text.length, ...text]
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

function asciiBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) {
    out[i] = text.charCodeAt(i) & 0x7f
  }
  return out
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
