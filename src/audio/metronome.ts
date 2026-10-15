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

  // Exponential ramps reject zero; use a tiny floor.
  const peak = accent ? 0.22 : 0.11
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.055)
}
