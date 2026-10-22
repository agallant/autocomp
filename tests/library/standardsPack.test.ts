import { describe, expect, it } from 'vitest'
import { STANDARDS_PACK } from '../../src/data/standardsPack'
import { TUNE_LIBRARY, filterTunes } from '../../src/library'
import { validateChart } from '../../src/music'

describe('standards pack', () => {
  it('ships only Standards-shelf entries with clearance notes', () => {
    expect(STANDARDS_PACK.length).toBeGreaterThanOrEqual(16)
    expect(STANDARDS_PACK.every((t) => t.shelf === 'standards')).toBe(true)
    for (const tune of STANDARDS_PACK) {
      const chart = tune.createChart()
      expect(validateChart(chart)).toEqual([])
      expect(chart.notes ?? '').toMatch(/Standards clearance:/)
      expect(tune.tags).toContain('standard')
    }
  })

  it('is searchable by title and traditional tag on the Standards shelf', () => {
    const byTitle = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Careless Love',
    })
    expect(byTitle.map((t) => t.id)).toContain('std-careless-love')

    const swingLow = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Swing Low',
    })
    expect(swingLow.map((t) => t.id)).toContain('std-swing-low')

    const auld = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Auld Lang',
    })
    expect(auld.map((t) => t.id)).toContain('std-auld-lang-syne')

    const susanna = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Susanna',
    })
    expect(susanna.map((t) => t.id)).toContain('std-oh-susanna')

    const modal = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Modal Pedal',
    })
    expect(modal.map((t) => t.id)).toContain('std-modal-pedal')

    const bebop = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Bebop Blues',
    })
    expect(bebop.map((t) => t.id)).toContain('std-bebop-blues')

    const bvi = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Flat-Six',
    })
    expect(bvi.map((t) => t.id)).toContain('std-minor-bvi')

    const tritone = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Tritone Sub',
    })
    expect(tritone.map((t) => t.id)).toContain('std-tritone-sub')

    const cycle = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Cycle Cadence',
    })
    expect(cycle.map((t) => t.id)).toContain('std-cycle-cadence')

    const secondary = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Secondary Dominant',
    })
    expect(secondary.map((t) => t.id)).toContain('std-secondary-dom')

    const bossa = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Bossa Cadence',
    })
    expect(bossa.map((t) => t.id)).toContain('std-bossa-cadence')

    const turnaround = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Turnaround Lab',
    })
    expect(turnaround.map((t) => t.id)).toContain('std-turnaround-lab')

    const traditional = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      tags: ['traditional'],
    })
    expect(traditional.length).toBeGreaterThan(0)
    expect(traditional.every((t) => t.tags.includes('traditional'))).toBe(true)
  })
})
