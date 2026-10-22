import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LIBRARY_SHELF,
  TUNE_LIBRARY,
  allLibraryTags,
  filterTunes,
  getTuneById,
  type TuneEntry,
} from '../../src/library'
import { createLibraryViewState, libraryControlsHtml } from '../../src/ui/libraryView'

function stubTune(partial: Partial<TuneEntry> & Pick<TuneEntry, 'id' | 'shelf' | 'tags'>): TuneEntry {
  return {
    title: partial.title ?? partial.id,
    blurb: partial.blurb ?? '',
    styleId: partial.styleId ?? 'jazz-swing',
    createChart: partial.createChart ?? (() => ({}) as never),
    ...partial,
  }
}

describe('tune library', () => {
  it('registers built-in practice progressions on the Practice shelf', () => {
    const practice = TUNE_LIBRARY.filter((t) => t.shelf === 'practice')
    expect(practice.length).toBeGreaterThanOrEqual(20)
    expect(new Set(TUNE_LIBRARY.map((t) => t.id)).size).toBe(TUNE_LIBRARY.length)
    expect(getTuneById('autumn-practice')?.title).toBe('Autumn Practice')
    expect(getTuneById('blues-workshop')?.styleId).toBe('jazz-swing')
    expect(getTuneById('circle-fourths')?.tags).toContain('cycle')
    expect(getTuneById('waltz-three')?.createChart().timeSignature).toEqual({
      numerator: 3,
      denominator: 4,
    })
    expect(getTuneById('full-random')?.shelf).toBe('generate')
    expect(getTuneById('engine-coltrane')?.shelf).toBe('generate')
    expect(getTuneById('std-greensleeves')?.shelf).toBe('standards')
    expect(getTuneById('std-stock-rhythm-aaba')?.tags).toContain('aaba')
  })

  it('covers difficulty and harmony device tags across the Practice pack', () => {
    const tags = allLibraryTags('practice')
    for (const needed of ['beginner', 'intermediate', 'ii-v-i', 'cycle', 'modal', 'dominant'] as const) {
      expect(tags).toContain(needed)
    }
  })

  it('defaults the library view to the Practice shelf', () => {
    expect(DEFAULT_LIBRARY_SHELF).toBe('practice')
    expect(createLibraryViewState('autumn-practice').shelf).toBe('practice')
    expect(createLibraryViewState('autumn-practice')).toMatchObject({
      genre: '',
      feelTags: [],
    })
  })

  it('renders category and multi-select feel controls', () => {
    const html = libraryControlsHtml(createLibraryViewState('autumn-practice'))
    expect(html).toContain('id="library-genre"')
    expect(html).toContain('All genres')
    expect(html).toContain('id="library-feel"')
    expect(html).toContain('multiple')
    expect(html).not.toContain('id="library-tag"')
  })

  it('filters by shelf before query and tags', () => {
    const practiceCount = TUNE_LIBRARY.filter((t) => t.shelf === 'practice').length
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'practice' })).toHaveLength(practiceCount)
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'standards' }).length).toBeGreaterThan(0)
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'generate' }).map((t) => t.id)).toContain(
      'full-random',
    )
    expect(
      filterTunes(TUNE_LIBRARY, { shelf: 'standards', query: 'Autumn' }).map((t) => t.id),
    ).toEqual(['std-autumn-leaves'])
    expect(
      filterTunes(TUNE_LIBRARY, { shelf: 'standards', query: 'Greensleeves' }).map((t) => t.id),
    ).toContain('std-greensleeves')
    expect(
      filterTunes(TUNE_LIBRARY, { shelf: 'standards', tags: ['traditional'] }).length,
    ).toBeGreaterThan(0)

    const mixed: TuneEntry[] = [
      stubTune({ id: 'practice-jazz', shelf: 'practice', tags: ['jazz', 'practice'] }),
      stubTune({ id: 'standard-jazz', shelf: 'standards', tags: ['jazz'] }),
      stubTune({ id: 'standard-blues', shelf: 'standards', tags: ['blues'] }),
    ]
    expect(filterTunes(mixed, { shelf: 'standards', tags: ['jazz'] }).map((t) => t.id)).toEqual([
      'standard-jazz',
    ])
    expect(filterTunes(mixed, { shelf: 'practice', tags: ['jazz'] }).map((t) => t.id)).toEqual([
      'practice-jazz',
    ])
  })

  it('scopes tag lists to the active shelf', () => {
    expect(allLibraryTags('practice').length).toBeGreaterThan(0)
    expect(allLibraryTags('standards')).toContain('traditional')
    expect(allLibraryTags('generate').length).toBeGreaterThan(0)
  })

  it('searches across all shelves when shelf is all', () => {
    const all = filterTunes(TUNE_LIBRARY, { shelf: 'all' })
    expect(all).toHaveLength(TUNE_LIBRARY.length)
    expect(
      filterTunes(TUNE_LIBRARY, { shelf: 'all', query: 'Greensleeves' }).map((t) => t.id),
    ).toContain('std-greensleeves')
    expect(
      filterTunes(TUNE_LIBRARY, { shelf: 'all', query: 'Coltrane' }).map((t) => t.id),
    ).toEqual(expect.arrayContaining(['engine-coltrane', 'coltrane-matrix']))
    expect(allLibraryTags('all').length).toBeGreaterThan(allLibraryTags('practice').length)
  })

  it('filters by query across title, blurb, and tags', () => {
    const title = filterTunes(TUNE_LIBRARY, { query: 'Autumn', shelf: 'practice' })
    expect(title.map((t) => t.id)).toContain('autumn-practice')

    const blurb = filterTunes(TUNE_LIBRARY, { query: 'Twelve-bar' })
    expect(blurb.map((t) => t.id)).toContain('blues-workshop')

    const tag = filterTunes(TUNE_LIBRARY, { query: 'ii-v-i' })
    expect(tag.map((t) => t.id)).toEqual(
      expect.arrayContaining(['autumn-practice', 'minor-path']),
    )
  })

  it('matches Songs composer and era metadata in search', () => {
    const kosma = filterTunes(TUNE_LIBRARY, { shelf: 'standards', query: 'Kosma' })
    expect(kosma.map((t) => t.id)).toEqual(['std-autumn-leaves'])
    expect(getTuneById('std-autumn-leaves')).toMatchObject({
      composer: 'Joseph Kosma',
      era: '1940s',
    })
    expect(
      filterTunes(TUNE_LIBRARY, { shelf: 'standards', query: '1930s' }).map((t) => t.id),
    ).toEqual(expect.arrayContaining(['std-body-and-soul', 'std-all-the-things']))
    expect(
      TUNE_LIBRARY.filter((t) => t.shelf === 'standards').every((t) => t.composer && t.era),
    ).toBe(true)
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
