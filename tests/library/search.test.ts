import { describe, expect, it } from 'vitest'
import { TUNE_LIBRARY, filterTunes, getTuneById } from '../../src/library'

describe('tune library', () => {
  it('registers built-in practice progressions', () => {
    expect(TUNE_LIBRARY.map((t) => t.id).sort()).toEqual([
      'autumn-practice',
      'ballad-holds',
      'blues-workshop',
      'bossa-loop',
      'latin-clave',
      'minor-path',
      'rhythm-lab',
      'turnaround-drill',
    ])
    expect(getTuneById('autumn-practice')?.title).toBe('Autumn Practice')
    expect(getTuneById('blues-workshop')?.styleId).toBe('jazz-swing')
  })

  it('filters by query across title, blurb, and tags', () => {
    const title = filterTunes(TUNE_LIBRARY, { query: 'Autumn' })
    expect(title.map((t) => t.id)).toContain('autumn-practice')

    const blurb = filterTunes(TUNE_LIBRARY, { query: 'Twelve-bar' })
    expect(blurb.map((t) => t.id)).toContain('blues-workshop')

    const tag = filterTunes(TUNE_LIBRARY, { query: 'ii-v-i' })
    expect(tag.map((t) => t.id)).toEqual(
      expect.arrayContaining(['autumn-practice', 'minor-path']),
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
