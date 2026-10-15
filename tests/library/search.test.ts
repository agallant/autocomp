import { describe, expect, it } from 'vitest'
import { TUNE_LIBRARY, filterTunes, getTuneById } from '../../src/library'

describe('tune library', () => {
  it('registers built-in practice progressions', () => {
    expect(TUNE_LIBRARY.length).toBeGreaterThanOrEqual(6)
    expect(getTuneById('autumn-practice')?.title).toBe('Autumn Practice')
    expect(getTuneById('blues-workshop')?.styleId).toBe('jazz-swing')
  })

  it('filters by query across title, blurb, and tags', () => {
    const bossa = filterTunes(TUNE_LIBRARY, { query: 'bossa' })
    expect(bossa.map((t) => t.id)).toContain('bossa-loop')
    expect(bossa.every((t) => /bossa/i.test([t.title, t.blurb, ...t.tags].join(' ')))).toBe(
      true,
    )
  })

  it('requires every selected tag', () => {
    const minorJazz = filterTunes(TUNE_LIBRARY, { tags: ['jazz', 'minor'] })
    expect(minorJazz.length).toBeGreaterThan(0)
    expect(minorJazz.every((t) => t.tags.includes('jazz') && t.tags.includes('minor'))).toBe(
      true,
    )
  })

  it('builds valid charts for every catalog entry', () => {
    for (const tune of TUNE_LIBRARY) {
      const chart = tune.createChart()
      expect(chart.id).toBe(tune.id)
      expect(chart.title).toBe(tune.title)
      expect(chart.sections.length).toBeGreaterThan(0)
    }
  })
})
