import { applyAmpEnvelope } from './envelope'
import type { ScheduledSource } from './synth'

/**
 * Schedule a short metronome click into a BaseAudioContext.
 * Accent (downbeat) is slightly louder and higher in pitch.
 * Returns the oscillator so callers can cancel it on seek/stop.
 */
export function scheduleMetronomeClick(
  ctx: BaseAudioContext,
  time: number,
  accent: boolean,
): ScheduledSource {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(accent ? 1200 : 900, time)

  applyAmpEnvelope(gain.gain, time, accent ? 0.28 : 0.14, 0.045, 0.002)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.055)
  return osc
}
