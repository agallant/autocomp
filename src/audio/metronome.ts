import { applyAmpEnvelope } from './envelope'

/**
 * Schedule a short metronome click into a BaseAudioContext.
 * Accent (downbeat) is slightly louder and higher in pitch.
 */
export function scheduleMetronomeClick(
  ctx: BaseAudioContext,
  time: number,
  accent: boolean,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(accent ? 1200 : 900, time)

  applyAmpEnvelope(gain.gain, time, accent ? 0.28 : 0.14, 0.045, 0.002)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.055)
}
