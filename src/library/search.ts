import type { TuneEntry, TuneTag } from './types'

export type LibraryFilter = {
  query?: string
  /** When set, tune must include every selected tag. */
  tags?: readonly TuneTag[]
}

/** Filter the library by free-text query (title/blurb/tags) and required tags. */
export function filterTunes(
  tunes: readonly TuneEntry[],
  filter: LibraryFilter = {},
): TuneEntry[] {
  const query = filter.query?.trim().toLowerCase() ?? ''
  const required = filter.tags ?? []

  return tunes.filter((tune) => {
    if (required.length > 0 && !required.every((tag) => tune.tags.includes(tag))) {
      return false
    }
    if (!query) return true
    const haystack = [tune.title, tune.blurb, ...tune.tags].join(' ').toLowerCase()
    return haystack.includes(query)
  })
}
