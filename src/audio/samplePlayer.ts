import { applyAmpEnvelope } from './envelope'
import {
  getSampleKit,
  nearestPitchedSample,
  playbackRateForMidi,
  type DrumSampleId,
  type SampleKit,
} from './sampleKit'

type ScheduledSource = {
  stop: (when?: number) => void
}

export type PlaySampleOptions = {
  when: number
  duration: number
  velocity: number
  playbackRate?: number
  /** Peak gain scale (before velocity). */
  gain?: number
  attack?: number
}

/** Play one AudioBuffer with a linear amp envelope. */
export function playBuffer(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  options: PlaySampleOptions,
): ScheduledSource {
  const {
    when,
    duration,
    velocity,
    playbackRate = 1,
    gain = 0.9,
    attack = 0.004,
  } = options
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.playbackRate.setValueAtTime(playbackRate, when)

  const amp = ctx.createGain()
  const peak = Math.max(0.0001, gain * velocity)
  const natural = buffer.duration / Math.max(0.01, playbackRate)
  // Prefer the note gate, but never shorter than a tiny click; callers may pass
  // `duration: Infinity` (drums) to hear the full one-shot decay.
  const playSeconds = Math.max(0.04, Number.isFinite(duration) ? Math.min(duration, natural) : natural)
  applyAmpEnvelope(amp.gain, when, peak, playSeconds, attack)
  src.connect(amp)
  amp.connect(ctx.destination)
  try {
    src.start(when)
    src.stop(when + playSeconds + 0.03)
  } catch {
    // Ignore double-start / closed-context races (seen on some WebKit builds).
  }
  return src
}

export function playDrumSample(
  ctx: BaseAudioContext,
  kit: SampleKit,
  id: DrumSampleId,
  when: number,
  _noteDuration: number,
  velocity: number,
): ScheduledSource | null {
  const buffer = kit.drums[id]
  if (!buffer) return null
  const gain = id === 'ride' ? 0.55 : id === 'hat' || id === 'clave' ? 0.65 : 0.85
  // Style note durations are often 60–120ms; play the full one-shot so rides/hats ring.
  return playBuffer(ctx, buffer, {
    when,
    duration: Number.POSITIVE_INFINITY,
    velocity,
    gain,
  })
}

export function playPitchedSample(
  ctx: BaseAudioContext,
  samples: SampleKit['bass'] | SampleKit['piano'],
  midi: number,
  when: number,
  duration: number,
  velocity: number,
  gain: number,
): ScheduledSource | null {
  const nearest = nearestPitchedSample(samples, midi)
  if (!nearest) return null
  const rate = playbackRateForMidi(nearest.midi, midi)
  // Avoid extreme pitch shifts that sound like chipmunks / molasses.
  if (rate < 0.5 || rate > 2) return null
  return playBuffer(ctx, nearest.buffer, {
    when,
    duration,
    velocity,
    playbackRate: rate,
    gain,
  })
}

export function resolveKit(explicit?: SampleKit | null): SampleKit | null {
  if (explicit !== undefined) return explicit
  return getSampleKit()
}
