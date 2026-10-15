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

  // Fallback only — prefer bundled samples. Use short tonal pings, never long noise bursts.
  if (kind === 'clave') {
    return scheduleToneBurst(ctx, when, velocity, [1850, 2450, 3100], 0.12, 0.22)
  }
  if (kind === 'hat') {
    return scheduleToneBurst(ctx, when, velocity, [5200, 7800, 9400], 0.06, 0.12)
  }
  if (kind === 'ride') {
    return scheduleToneBurst(ctx, when, velocity, [400, 800, 2400], 0.18, 0.14)
  }
  // snare: brief band-limited click + body tone
  return scheduleToneBurst(ctx, when, velocity, [180, 220, 1800], 0.1, 0.18)
}

function scheduleToneBurst(
  ctx: BaseAudioContext,
  when: number,
  velocity: number,
  freqs: number[],
  length: number,
  peak: number,
): ScheduledSource[] {
  const master = ctx.createGain()
  applyAmpEnvelope(master.gain, when, peak * velocity, length, 0.002)
  master.connect(ctx.destination)
  const sources: ScheduledSource[] = []
  for (const [i, freq] of freqs.entries()) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, when)
    gain.gain.value = 1 / (i + 1.5)
    osc.connect(gain)
    gain.connect(master)
    osc.start(when)
    osc.stop(when + length + 0.02)
    sources.push(osc)
  }
  return sources
}
