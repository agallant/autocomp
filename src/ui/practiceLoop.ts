/** 1-based inclusive form-bar practice loop. */
export type PracticeLoop = {
  enabled: boolean
  startBar: number
  endBar: number
}

export const DEFAULT_PRACTICE_LOOP: PracticeLoop = {
  enabled: false,
  startBar: 1,
  endBar: 1,
}

/**
 * Clamp and order start/end into a valid inclusive range within `1..totalBars`.
 * When the chart is empty, returns start=end=1.
 */
export function normalizePracticeLoop(
  loop: PracticeLoop,
  totalBars: number,
): PracticeLoop {
  if (totalBars <= 0) {
    return { enabled: loop.enabled, startBar: 1, endBar: 1 }
  }
  let start = Math.min(totalBars, Math.max(1, Math.floor(loop.startBar)))
  let end = Math.min(totalBars, Math.max(1, Math.floor(loop.endBar)))
  if (end < start) {
    const swap = start
    start = end
    end = swap
  }
  return { enabled: loop.enabled, startBar: start, endBar: end }
}

/**
 * Map a 1-based form pass index (1 = first bar after count-in) onto a chart bar.
 * With loop off: wraps the full form. With loop on: cycles `startBar..endBar`.
 */
export function resolveLoopedFormBar(
  formPassIndex: number,
  totalBars: number,
  loop: PracticeLoop,
): number {
  if (totalBars <= 0) return 1
  const pass = Math.max(1, Math.floor(formPassIndex))
  const normalized = normalizePracticeLoop(loop, totalBars)
  if (!normalized.enabled) {
    return ((pass - 1) % totalBars) + 1
  }
  const len = normalized.endBar - normalized.startBar + 1
  return normalized.startBar + ((pass - 1) % len)
}

/**
 * Scheduler pass index (1-based, post-count-in) that plays `formBar`.
 * With loop on, clamps into A–B and returns the offset within one cycle.
 */
export function passIndexForFormBar(
  formBar: number,
  totalBars: number,
  loop: PracticeLoop,
): { formBar: number; passIndex: number } {
  if (totalBars <= 0) return { formBar: 1, passIndex: 1 }
  const clamped = Math.min(totalBars, Math.max(1, Math.floor(formBar)))
  const normalized = normalizePracticeLoop(loop, totalBars)
  if (!normalized.enabled) {
    return { formBar: clamped, passIndex: clamped }
  }
  const target = Math.min(normalized.endBar, Math.max(normalized.startBar, clamped))
  return {
    formBar: target,
    passIndex: target - normalized.startBar + 1,
  }
}
