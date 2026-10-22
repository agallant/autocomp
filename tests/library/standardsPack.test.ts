import { describe, expect, it } from 'vitest'
import { STANDARDS_PACK, STOCK_DRILL_PACK } from '../../src/data/standardsPack'
import { TUNE_LIBRARY, filterTunes } from '../../src/library'
import { validateChart } from '../../src/music'

describe('standards pack', () => {
  it('ships only Songs-shelf repertoire with clearance notes', () => {
    expect(STANDARDS_PACK.length).toBeGreaterThanOrEqual(15)
    expect(STANDARDS_PACK.every((t) => t.shelf === 'standards')).toBe(true)
    expect(STANDARDS_PACK.every((t) => t.tags.includes('standard'))).toBe(true)
    for (const tune of STANDARDS_PACK) {
      const chart = tune.createChart()
      expect(validateChart(chart)).toEqual([])
      expect(chart.notes ?? '').toMatch(/Standards clearance:/)
    }
  })

  it('moves stock educational drills onto the Practice shelf', () => {
    expect(STOCK_DRILL_PACK.length).toBeGreaterThan(0)
    expect(STOCK_DRILL_PACK.every((t) => t.shelf === 'practice')).toBe(true)
    expect(STOCK_DRILL_PACK.every((t) => t.tags.includes('practice'))).toBe(true)
    expect(STOCK_DRILL_PACK.every((t) => !t.tags.includes('standard'))).toBe(true)
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'practice', query: 'Modal Pedal' }).map((t) => t.id)).toContain(
      'std-modal-pedal',
    )
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'standards', query: 'Modal Pedal' })).toEqual([])
  })

  it('is searchable by title on the Songs shelf and sorted alphabetically', () => {
    const byTitle = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Careless Love',
    })
    expect(byTitle.map((t) => t.id)).toContain('std-careless-love')

    const autumn = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Autumn Leaves',
    })
    expect(autumn.map((t) => t.id)).toEqual(['std-autumn-leaves'])

    const satin = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Satin Doll',
    })
    expect(satin.map((t) => t.id)).toEqual(['std-satin-doll'])
    expect(satin[0]).toMatchObject({ composer: 'Duke Ellington', era: '1950s' })

    const all = filterTunes(TUNE_LIBRARY, { shelf: 'standards' })
    const titles = all.map((t) => t.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })))

    const traditional = filterTunes(TUNE_LIBRARY, { shelf: 'standards', tags: ['traditional'] })
    expect(traditional.length).toBeGreaterThan(0)
    expect(traditional.map((t) => t.title)).toEqual(
      [...traditional.map((t) => t.title)].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      ),
    )
  })
})
