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

    const footprints = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Footprints',
    })
    expect(footprints.map((t) => t.id)).toEqual(['std-footprints'])
    expect(footprints[0]).toMatchObject({ composer: 'Wayne Shorter', era: '1960s' })
    const footprintsChart = footprints[0]!.createChart()
    expect(footprintsChart.timeSignature).toEqual({ numerator: 6, denominator: 4 })
    expect(footprintsChart.sections[0]!.bars.map((b) =>
      b.slots.map((s) => s.chord?.symbol ?? '').filter(Boolean).join(' '),
    )).toEqual([
      'Cm7',
      'Cm7',
      'Cm7',
      'Cm7',
      'Fm7',
      'Fm7',
      'Cm7',
      'Cm7',
      'F#m7b5 B7',
      'Emaj7',
      'Dm7b5 G7',
      'Cm7',
    ])

    const cantaloupe = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Cantaloupe',
    })
    expect(cantaloupe.map((t) => t.id)).toEqual(['std-cantaloupe'])
    expect(cantaloupe[0]).toMatchObject({
      composer: 'Herbie Hancock',
      era: '1960s',
      styleId: 'latin',
    })
    expect(cantaloupe[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'Fm7',
      'Fm7',
      'Fm7',
      'Fm7',
      'Db7',
      'Db7',
      'Db7',
      'Db7',
      'Dm7',
      'Dm7',
      'Dm7',
      'Dm7',
      'Fm7',
      'Fm7',
      'Fm7',
      'Fm7',
    ])

    const maiden = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Maiden Voyage',
    })
    expect(maiden.map((t) => t.id)).toEqual(['std-maiden-voyage'])
    expect(maiden[0]).toMatchObject({
      composer: 'Herbie Hancock',
      era: '1960s',
      styleId: 'latin',
    })
    const maidenChart = maiden[0]!.createChart()
    expect(maidenChart.form).toEqual(['A', 'A', 'B', 'A'])
    expect(maidenChart.sections.find((s) => s.id === 'A')!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'D7sus4',
      'D7sus4',
      'F7sus4',
      'F7sus4',
      'Eb7sus4',
      'Eb7sus4',
      'D7sus4',
      'D7sus4',
    ])
    expect(maidenChart.sections.find((s) => s.id === 'B')!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'A7sus4',
      'A7sus4',
      'C7sus4',
      'C7sus4',
      'Bb7sus4',
      'Bb7sus4',
      'A7sus4',
      'A7sus4',
    ])

    const watermelon = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Watermelon',
    })
    expect(watermelon.map((t) => t.id)).toEqual(['std-watermelon'])
    expect(watermelon[0]).toMatchObject({
      composer: 'Herbie Hancock',
      era: '1960s',
      styleId: 'latin',
    })
    expect(watermelon[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'F7',
      'F7',
      'F7',
      'F7',
      'Bb7',
      'Bb7',
      'F7',
      'F7',
      'C7',
      'Bb7',
      'F7',
      'F7',
    ])

    const impressions = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Impressions',
    })
    expect(impressions.map((t) => t.id)).toEqual(['std-impressions'])
    expect(impressions[0]).toMatchObject({
      composer: 'John Coltrane',
      era: '1960s',
      styleId: 'jazz-swing',
    })
    const impressionsChart = impressions[0]!.createChart()
    expect(impressionsChart.form).toEqual(['A', 'A', 'B', 'A'])
    expect(impressionsChart.sections.find((s) => s.id === 'A')!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'Dm7',
      'Dm7',
      'Dm7',
      'Dm7',
      'Dm7',
      'Dm7',
      'Dm7',
      'Dm7',
    ])
    expect(impressionsChart.sections.find((s) => s.id === 'B')!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'Ebm7',
      'Ebm7',
      'Ebm7',
      'Ebm7',
      'Ebm7',
      'Ebm7',
      'Ebm7',
      'Ebm7',
    ])

    const recorda = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Recorda',
    })
    expect(recorda.map((t) => t.id)).toEqual(['std-recorda-me'])
    expect(recorda[0]).toMatchObject({
      composer: 'Joe Henderson',
      era: '1960s',
      styleId: 'bossa',
    })
    expect(recorda[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'Am7',
      'Am7',
      'Am7',
      'Am7',
      'Bbmaj7',
      'Bbmaj7',
      'Bbmaj7',
      'Bbmaj7',
      'Abmaj7',
      'Abmaj7',
      'Abmaj7',
      'Abmaj7',
      'Gbmaj7',
      'Gbmaj7',
      'Fmaj7',
      'E7#9',
    ])

    const snc = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Straight, No Chaser',
    })
    expect(snc.map((t) => t.id)).toEqual(['std-straight-no-chaser'])
    expect(snc[0]).toMatchObject({
      composer: 'Thelonious Monk',
      era: '1950s',
      styleId: 'jazz-swing',
    })
    expect(snc[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
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

    const equinox = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Equinox',
    })
    expect(equinox.map((t) => t.id)).toEqual(['std-equinox'])
    expect(equinox[0]).toMatchObject({
      composer: 'John Coltrane',
      era: '1960s',
      styleId: 'jazz-swing',
    })
    expect(equinox[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'C#m7',
      'C#m7',
      'C#m7',
      'C#m7',
      'F#m7',
      'F#m7',
      'C#m7',
      'C#m7',
      'Amaj7',
      'G#7',
      'C#m7',
      'C#m7',
    ])

    const mrPc = filterTunes(TUNE_LIBRARY, {
      shelf: 'standards',
      query: 'Mr. P.C.',
    })
    expect(mrPc.map((t) => t.id)).toEqual(['std-mr-pc'])
    expect(mrPc[0]).toMatchObject({
      composer: 'John Coltrane',
      era: '1960s',
      styleId: 'jazz-swing',
    })
    expect(mrPc[0]!.createChart().sections[0]!.bars.map((b) => b.slots[0]?.chord?.symbol)).toEqual([
      'Cm7',
      'Cm7',
      'Cm7',
      'Cm7',
      'Fm7',
      'Fm7',
      'Cm7',
      'Cm7',
      'Ab7',
      'G7',
      'Cm7',
      'Cm7',
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
