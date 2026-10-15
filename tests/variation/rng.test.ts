import { describe, expect, it } from 'vitest'
import { hashSeed, mulberry32, seedFromString } from '../../src/variation'

describe('variation rng', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('diverges for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('hashes strings stably', () => {
    expect(seedFromString('autumn-practice')).toBe(seedFromString('autumn-practice'))
    expect(seedFromString('a')).not.toBe(seedFromString('b'))
  })

  it('mixes integer parts', () => {
    expect(hashSeed(1, 2, 3)).toBe(hashSeed(1, 2, 3))
    expect(hashSeed(1, 2, 3)).not.toBe(hashSeed(2, 2, 3))
    expect(hashSeed(1, 2, 3)).not.toBe(hashSeed(1, 3, 3))
    expect(hashSeed(1, 2, 3)).not.toBe(hashSeed(1, 2, 4))
  })
})
