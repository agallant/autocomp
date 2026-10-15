import { describe, expect, it } from 'vitest'
import {
  normalizePracticeLoop,
  resolveLoopedFormBar,
} from '../../src/ui/practiceLoop'

describe('practice loop', () => {
  it('normalizes and swaps inverted ranges', () => {
    expect(normalizePracticeLoop({ enabled: true, startBar: 8, endBar: 3 }, 12)).toEqual({
      enabled: true,
      startBar: 3,
      endBar: 8,
    })
  })

  it('clamps to chart length', () => {
    expect(normalizePracticeLoop({ enabled: false, startBar: 0, endBar: 99 }, 16)).toEqual({
      enabled: false,
      startBar: 1,
      endBar: 16,
    })
  })

  it('wraps the full form when loop is off', () => {
    expect(resolveLoopedFormBar(1, 8, { enabled: false, startBar: 1, endBar: 8 })).toBe(1)
    expect(resolveLoopedFormBar(8, 8, { enabled: false, startBar: 1, endBar: 8 })).toBe(8)
    expect(resolveLoopedFormBar(9, 8, { enabled: false, startBar: 1, endBar: 8 })).toBe(1)
  })

  it('cycles only the A–B window when loop is on', () => {
    const loop = { enabled: true, startBar: 3, endBar: 5 }
    expect(resolveLoopedFormBar(1, 12, loop)).toBe(3)
    expect(resolveLoopedFormBar(2, 12, loop)).toBe(4)
    expect(resolveLoopedFormBar(3, 12, loop)).toBe(5)
    expect(resolveLoopedFormBar(4, 12, loop)).toBe(3)
    expect(resolveLoopedFormBar(7, 12, loop)).toBe(3)
  })
})
