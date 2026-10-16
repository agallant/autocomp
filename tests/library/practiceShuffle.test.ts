import { describe, expect, it } from 'vitest'
import {
  TUNE_LIBRARY,
  pickPracticeTune,
  practicePool,
  practiceVariantFromSeed,
  shufflePractice,
  trimPracticeForm,
} from '../../src/library'
import { mulberry32, seedFromString } from '../../src/variation'

describe('practice shuffle', () => {
  it('pools only Practice-shelf tunes', () => {
    const pool = practicePool(TUNE_LIBRARY)
    const practiceCount = TUNE_LIBRARY.filter((t) => t.shelf === 'practice').length
    expect(pool.length).toBe(practiceCount)
    expect(pool.every((t) => t.shelf === 'practice')).toBe(true)
  })

  it('picks deterministically for a seeded rng', () => {
    const pool = practicePool(TUNE_LIBRARY)
    const a = pickPracticeTune(pool, mulberry32(42))
    const b = pickPracticeTune(pool, mulberry32(42))
    expect(a?.id).toBe(b?.id)
    expect(pickPracticeTune([], mulberry32(1))).toBeUndefined()
  })

  it('builds the same variant for the same seed', () => {
    const tune = TUNE_LIBRARY.find((t) => t.id === 'autumn-practice')!
    const seed = seedFromString('autumn-practice:test')
    const first = practiceVariantFromSeed(tune, seed)
    const second = practiceVariantFromSeed(tune, seed)
    expect(first.transposeSemitones).toBe(second.transposeSemitones)
    expect(first.density).toBe(second.density)
    expect(first.trimmed).toBe(second.trimmed)
    expect(first.chart.key).toEqual(second.chart.key)
    expect(first.chart.form).toEqual(second.chart.form)
  })

  it('trims multi-section forms to the opening section', () => {
    const rhythm = TUNE_LIBRARY.find((t) => t.id === 'rhythm-lab')!.createChart()
    expect(rhythm.form.length).toBeGreaterThan(1)
    const trimmed = trimPracticeForm(rhythm)
    expect(trimmed.form).toEqual(['A'])
    expect(trimmed.sections).toHaveLength(1)
    expect(trimmed.sections[0]!.id).toBe('A')
    expect(trimPracticeForm(TUNE_LIBRARY[0]!.createChart()).form).toEqual(['A'])
  })

  it('shuffles within an optional tag filter', () => {
    const result = shufflePractice(TUNE_LIBRARY, {
      filter: { tags: ['blues'] },
      entropy: 99,
      rng: mulberry32(99),
    })
    expect(result).toBeDefined()
    expect(result!.tune.tags).toContain('blues')
    expect(result!.chart.sections.length).toBeGreaterThan(0)
  })
})
