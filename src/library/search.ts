import type { LibraryShelfFilter, TuneEntry, TuneTag } from './types'

export type LibraryFilter = {
  query?: string
  /** When set to a shelf id, only that shelf; `'all'` (or omitted) includes every shelf. */
  shelf?: LibraryShelfFilter
  /** When set, tune must include every selected tag. */
  tags?: readonly TuneTag[]
}

/** Filter the library by shelf, free-text query (title/blurb/tags), and required tags. */
export function filterTunes(
  tunes: readonly TuneEntry[],
  filter: LibraryFilter = {},
): TuneEntry[] {
  const query = filter.query?.trim().toLowerCase() ?? ''
  const required = filter.tags ?? []
  const shelf = filter.shelf

  return tunes.filter((tune) => {
    if (shelf && shelf !== 'all' && tune.shelf !== shelf) return false
    if (required.length > 0 && !required.every((tag) => tune.tags.includes(tag))) {
      return false
    }
    if (!query) return true
    const haystack = [tune.title, tune.blurb, ...tune.tags].join(' ').toLowerCase()
    return haystack.includes(query)
  })
}
