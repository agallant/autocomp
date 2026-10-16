import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LIBRARY_SHELF,
  TUNE_LIBRARY,
  allLibraryTags,
  filterTunes,
  getTuneById,
  type TuneEntry,
} from '../../src/library'
import { createLibraryViewState } from '../../src/ui/libraryView'

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
  })

  it('filters by shelf before query and tags', () => {
    const practiceCount = TUNE_LIBRARY.filter((t) => t.shelf === 'practice').length
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'practice' })).toHaveLength(practiceCount)
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'standards' })).toEqual([])
    expect(filterTunes(TUNE_LIBRARY, { shelf: 'generate' }).map((t) => t.id)).toContain(
      'full-random',
    )
    expect(
      filterTunes(TUNE_LIBRARY, { shelf: 'standards', query: 'Autumn' }),
    ).toEqual([])

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
    expect(allLibraryTags('standards')).toEqual([])
    expect(allLibraryTags('generate').length).toBeGreaterThan(0)
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
