/**
 * Safari/WebKit has long-standing bugs with exponential gain ramps that can
 * produce complete silence. Linear ramps from 0 are reliable across engines.
 */
export function applyAmpEnvelope(
  param: AudioParam,
  when: number,
  peak: number,
  duration: number,
  attack = 0.008,
): void {
  const safePeak = Math.max(0.0001, peak)
  const attackEnd = when + Math.max(0.001, attack)
  const releaseEnd = when + Math.max(attackEnd - when + 0.01, duration)
  param.cancelScheduledValues(when)
  param.setValueAtTime(0, when)
  param.linearRampToValueAtTime(safePeak, attackEnd)
  param.linearRampToValueAtTime(0, releaseEnd)
}
