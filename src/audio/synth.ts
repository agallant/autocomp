import { midiToFrequency } from '../style/midi'
import type { StyleNote } from '../style/types'

export type ScheduledSource = {
  stop: (when?: number) => void
}

/** Schedule a style note into a Web Audio context at absolute `when` (seconds). */
export function scheduleStyleNote(
  ctx: BaseAudioContext,
  note: StyleNote,
  when: number,
  secondsPerBeat: number,
): ScheduledSource[] {
  if (note.velocity <= 0) return []
  const duration = Math.max(0.03, note.durationBeats * secondsPerBeat)
  if (note.voice === 'drums') {
    return scheduleDrum(ctx, note, when, duration)
  }
  if (note.voice === 'bass') {
    return scheduleBass(ctx, note.midi, when, duration, note.velocity)
  }
  return schedulePiano(ctx, note.midi, when, duration, note.velocity)
}

function scheduleBass(
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
  filter.frequency.setValueAtTime(600, when)
  const peak = Math.max(0.0001, 0.22 * velocity)
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
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
): ScheduledSource[] {
  const freqs = [midiToFrequency(midi), midiToFrequency(midi) * 2]
  const peak = Math.max(0.0001, 0.12 * velocity)
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, when)
  master.gain.exponentialRampToValueAtTime(peak, when + 0.005)
  master.gain.exponentialRampToValueAtTime(0.0001, when + duration)
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
): ScheduledSource[] {
  const kind = note.drum ?? 'ride'
  if (kind === 'kick') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, when)
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.08)
    const peak = Math.max(0.0001, 0.35 * note.velocity)
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.min(duration, 0.18))
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(when)
    osc.stop(when + 0.2)
    return [osc]
  }

  const length = Math.max(0.02, Math.min(duration, kind === 'ride' ? 0.25 : 0.08))
  const sampleCount = Math.ceil(ctx.sampleRate * length)
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < sampleCount; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = kind === 'hat' ? 'highpass' : kind === 'ride' ? 'bandpass' : 'highpass'
  filter.frequency.value = kind === 'hat' ? 6000 : kind === 'ride' ? 4000 : 1800
  const gain = ctx.createGain()
  const peak = Math.max(0.0001, (kind === 'ride' ? 0.12 : 0.18) * note.velocity)
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start(when)
  src.stop(when + length + 0.02)
  return [src]
}
