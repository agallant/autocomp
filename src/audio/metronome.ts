import { applyAmpEnvelope } from './envelope'
import type { ScheduledSource } from './synth'

export const DEFAULT_CLICK_LEVEL = 1

export type ClickSubdivision = 'beat' | 'eighth'

export const CLICK_SUBDIVISION_OPTIONS: ReadonlyArray<{
  id: ClickSubdivision
  label: string
}> = [
  { id: 'beat', label: 'Beat' },
  { id: 'eighth', label: '8th' },
]

export const DEFAULT_CLICK_SUBDIVISION: ClickSubdivision = 'beat'

export function isClickSubdivision(value: unknown): value is ClickSubdivision {
  return value === 'beat' || value === 'eighth'
}

export function clampClickLevel(level: number): number {
  if (!Number.isFinite(level)) return DEFAULT_CLICK_LEVEL
  return Math.min(1, Math.max(0, level))
}

/**
 * Schedule the on-beat click, plus an off-beat 8th when subdivision is `eighth`.
 * Off-beats are always unaccented (and slightly quieter via the non-accent path).
 */
export function scheduleMetronomeSubdivision(
  ctx: BaseAudioContext,
  beatTime: number,
  accent: boolean,
  level: number,
  subdivision: ClickSubdivision,
  secondsPerBeat: number,
): ScheduledSource[] {
  const sources: ScheduledSource[] = []
  const onBeat = scheduleMetronomeClick(ctx, beatTime, accent, level)
  if (onBeat) sources.push(onBeat)
  if (subdivision === 'eighth' && secondsPerBeat > 0) {
    const off = scheduleMetronomeClick(
      ctx,
      beatTime + secondsPerBeat * 0.5,
      false,
      level,
    )
    if (off) sources.push(off)
  }
  return sources
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
