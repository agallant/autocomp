import { describe, expect, it } from 'vitest'
import { STANDARDS_PACK, STOCK_DRILL_PACK } from '../../src/data/standardsPack'
import { TUNE_LIBRARY, filterTunes } from '../../src/library'
import { validateChart } from '../../src/music'

describe('standards pack', () => {
  it('ships only Songs-shelf repertoire with clearance notes', () => {
    expect(STANDARDS_PACK.length).toBeGreaterThanOrEqual(20)
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

    const aTrain = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'A Train',
    })
    expect(aTrain.map((t) => t.id)).toEqual(['std-a-train'])
    expect(aTrain[0]).toMatchObject({ composer: 'Billy Strayhorn', era: '1940s' })
    const aTrainChart = aTrain[0]!.createChart()
    const endSym = (id: string) =>
      aTrainChart.sections
        .find((s) => s.id === id)!
        .bars.at(-1)!
        .slots.map((slot) => slot.chord?.symbol ?? '')
        .join(' ')
    expect(endSym('A')).toBe('A7')
    expect(endSym('A2')).toBe('Cmaj7')
    expect(endSym('A3')).toBe('Cmaj7')
    expect(aTrainChart.sections.find((s) => s.id === 'A2')!.bars.map((b) => b.slots[0]?.chord?.symbol)).not.toEqual(
      aTrainChart.sections.find((s) => s.id === 'A3')!.bars.map((b) => b.slots[0]?.chord?.symbol),
    )

    const solar = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Solar',
    })
    expect(solar.map((t) => t.id)).toEqual(['std-solar'])
    expect(solar[0]).toMatchObject({ composer: 'Miles Davis', era: '1960s' })
    const solarBars = solar[0]!.createChart().sections[0]!.bars
    expect(solarBars).toHaveLength(12)
    expect(solarBars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'CmMaj7',
      'Gm7',
      'C7',
      'Fmaj7',
      'Fm7',
      'Bb7',
      'Ebmaj7',
      'Ebm7',
      'Ab7',
      'Dbmaj7',
      'Dm7b5',
      'G7',
    ])

    const tuneUp = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Tune Up',
    })
    expect(tuneUp.map((t) => t.id)).toEqual(['std-tune-up'])
    expect(tuneUp[0]).toMatchObject({ composer: 'Miles Davis', era: '1950s' })
    expect(tuneUp[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'Em7',
      'A7',
      'Dmaj7',
      'Dmaj7',
      'Dm7',
      'G7',
      'Cmaj7',
      'Cmaj7',
      'Cm7',
      'F7',
      'Bbmaj7',
      'Bbmaj7',
      'Em7',
      'A7',
      'Dmaj7',
      'Dmaj7',
    ])

    const soWhat = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'So What',
    })
    expect(soWhat.map((t) => t.id)).toEqual(['std-so-what'])
    expect(soWhat[0]).toMatchObject({ composer: 'Miles Davis', era: '1950s' })
    const soWhatChart = soWhat[0]!.createChart()
    expect(soWhatChart.form).toEqual(['A', 'A', 'B', 'A'])
    expect(soWhatChart.sections.find((s) => s.id === 'A')!.bars.every((b) => b.slots[0]?.chord?.symbol === 'Dm7')).toBe(
      true,
    )
    expect(soWhatChart.sections.find((s) => s.id === 'B')!.bars.every((b) => b.slots[0]?.chord?.symbol === 'Ebm7')).toBe(
      true,
    )

    const freddie = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Freddie Freeloader',
    })
    expect(freddie.map((t) => t.id)).toEqual(['std-freddie-freeloader'])
    expect(freddie[0]).toMatchObject({ composer: 'Miles Davis', era: '1950s' })
    expect(freddie[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'Bb7',
      'Bb7',
      'Bb7',
      'Bb7',
      'Eb7',
      'Eb7',
      'Bb7',
      'Bb7',
      'F7',
      'Eb7',
      'Bb7',
      'F7',
    ])

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
