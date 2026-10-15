import { midiToFrequency } from '../style/midi'
import type { StyleNote } from '../style/types'
import { applyAmpEnvelope } from './envelope'
import type { SampleKit } from './sampleKit'
import { playDrumSample, playPitchedSample, resolveKit } from './samplePlayer'

export type ScheduledSource = {
  stop: (when?: number) => void
}

export type ScheduleStyleNoteOptions = {
  /** Prefer an explicit kit (tests / bounce); defaults to the loaded singleton. */
  kit?: SampleKit | null
}

/** Schedule a style note into a Web Audio context at absolute `when` (seconds). */
export function scheduleStyleNote(
  ctx: BaseAudioContext,
  note: StyleNote,
  when: number,
  secondsPerBeat: number,
  options: ScheduleStyleNoteOptions = {},
): ScheduledSource[] {
  if (note.velocity <= 0) return []
  const duration = Math.max(0.03, note.durationBeats * secondsPerBeat)
  const kit = resolveKit(options.kit)

  if (note.voice === 'drums') {
    return scheduleDrum(ctx, note, when, duration, kit)
  }
  if (note.voice === 'bass') {
    return scheduleBass(ctx, note.midi, when, duration, note.velocity, kit)
  }
  return schedulePiano(ctx, note.midi, when, duration, note.velocity, kit)
}

function scheduleBass(
  ctx: BaseAudioContext,
  midi: number,
  when: number,
  duration: number,
  velocity: number,
  kit: SampleKit | null,
): ScheduledSource[] {
  if (kit) {
    const sampled = playPitchedSample(ctx, kit.bass, midi, when, duration, velocity, 0.95)
    if (sampled) return [sampled]
  }
  return scheduleBassSynth(ctx, midi, when, duration, velocity)
}

function scheduleBassSynth(
  ctx: BaseAudioContext,
  midi: number,
  when: number,
  duration: number,
  velocity: number,
): ScheduledSource[] {
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(midiToFrequency(midi), when)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(800, when)
  applyAmpEnvelope(gain.gain, when, 0.32 * velocity, duration, 0.01)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + duration + 0.02)
  return [osc]
}

function schedulePiano(
  ctx: BaseAudioContext,
  midi: number,
  when: number,
  duration: number,
  velocity: number,
  kit: SampleKit | null,
): ScheduledSource[] {
  if (kit) {
    const sampled = playPitchedSample(ctx, kit.piano, midi, when, duration, velocity, 0.75)
    if (sampled) return [sampled]
  }
  return schedulePianoSynth(ctx, midi, when, duration, velocity)
}

function schedulePianoSynth(
  ctx: BaseAudioContext,
  midi: number,
  when: number,
  duration: number,
  velocity: number,
): ScheduledSource[] {
  const freqs = [midiToFrequency(midi), midiToFrequency(midi) * 2]
  const peak = 0.18 * velocity
  const master = ctx.createGain()
  applyAmpEnvelope(master.gain, when, peak, duration, 0.005)
  master.connect(ctx.destination)

  const sources: ScheduledSource[] = []
  for (const [i, freq] of freqs.entries()) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = i === 0 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq, when)
    gain.gain.value = i === 0 ? 0.7 : 0.25
    osc.connect(gain)
    gain.connect(master)
    osc.start(when)
    osc.stop(when + duration + 0.02)
    sources.push(osc)
  }
  return sources
}

function scheduleDrum(
  ctx: BaseAudioContext,
  note: StyleNote,
  when: number,
  duration: number,
  kit: SampleKit | null,
): ScheduledSource[] {
  const kind = note.drum ?? 'ride'
  if (kit) {
    const sampled = playDrumSample(ctx, kit, kind, when, duration, note.velocity)
    if (sampled) return [sampled]
  }
  return scheduleDrumSynth(ctx, kind, when, duration, note.velocity)
}

function scheduleDrumSynth(
  ctx: BaseAudioContext,
  kind: NonNullable<StyleNote['drum']>,
  when: number,
  duration: number,
  velocity: number,
): ScheduledSource[] {
  if (kind === 'kick') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, when)
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.08)
    applyAmpEnvelope(gain.gain, when, 0.45 * velocity, Math.min(duration, 0.18), 0.005)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(when)
    osc.stop(when + 0.2)
    return [osc]
  }

  // Fallback only — live/export prefer CC0 samples. Short filtered burst, not long noise.
  const length = Math.max(0.02, Math.min(duration, kind === 'ride' ? 0.12 : 0.06))
  const sampleCount = Math.ceil(ctx.sampleRate * length)
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < sampleCount; i++) {
    const env = 1 - i / sampleCount
    data[i] = (Math.random() * 2 - 1) * env * env
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = kind === 'hat' || kind === 'clave' ? 'highpass' : 'bandpass'
  filter.frequency.value = kind === 'hat' || kind === 'clave' ? 6000 : 4000
  const gain = ctx.createGain()
  applyAmpEnvelope(gain.gain, when, (kind === 'ride' ? 0.14 : 0.2) * velocity, length, 0.002)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start(when)
  src.stop(when + length + 0.02)
  return [src]
}
