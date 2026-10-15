import { applyAmpEnvelope } from './envelope'
import type { ScheduledSource } from './synth'

export const DEFAULT_CLICK_LEVEL = 1

export function clampClickLevel(level: number): number {
  if (!Number.isFinite(level)) return DEFAULT_CLICK_LEVEL
  return Math.min(1, Math.max(0, level))
}

/**
 * Schedule a short metronome click into a BaseAudioContext.
 * Accent (downbeat) is slightly louder and higher in pitch.
 * Returns the oscillator so callers can cancel it on seek/stop,
 * or `null` when level is zero (nothing scheduled).
 */
export function scheduleMetronomeClick(
  ctx: BaseAudioContext,
  time: number,
  accent: boolean,
  level: number = DEFAULT_CLICK_LEVEL,
): ScheduledSource | null {
  const gainLevel = clampClickLevel(level)
  if (gainLevel <= 0) return null

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(accent ? 1200 : 900, time)

  applyAmpEnvelope(gain.gain, time, (accent ? 0.28 : 0.14) * gainLevel, 0.045, 0.002)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.055)
  return osc
}
