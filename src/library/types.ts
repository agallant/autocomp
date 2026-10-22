import type { Chart } from '../music'
import type { StyleId } from '../style'

export type TuneTag =
  | 'jazz'
  | 'blues'
  | 'bossa'
  | 'ballad'
  | 'latin'
  | 'major'
  | 'minor'
  | 'ii-v-i'
  | 'turnaround'
  | 'rhythm'
  | 'practice'
  | 'beginner'
  | 'intermediate'
  | 'short'
  | 'long'
  | 'cycle'
  | 'modal'
  | 'dominant'
  | 'waltz'
  | 'standard'
  | 'traditional'
  | 'aaba'

/** Top-level library shelf. Default UX lands on Practice. */
export type LibraryShelf = 'practice' | 'standards' | 'generate'

/** Shelf filter in the library UI — includes an All-shelves view. */
export type LibraryShelfFilter = LibraryShelf | 'all'

export const LIBRARY_SHELVES: ReadonlyArray<{ id: LibraryShelf; label: string }> = [
  { id: 'practice', label: 'Practice' },
  /** Real repertoire (jazz/pop/etc.); id stays `standards` for compatibility. */
  { id: 'standards', label: 'Songs' },
  { id: 'generate', label: 'Generate' },
]

/** Shelf switcher order: Practice first (default), then Songs / Generate / All. */
export const LIBRARY_SHELF_FILTERS: ReadonlyArray<{
  id: LibraryShelfFilter
  label: string
}> = [
  ...LIBRARY_SHELVES,
  { id: 'all', label: 'All' },
]

export const DEFAULT_LIBRARY_SHELF: LibraryShelf = 'practice'

export function isLibraryShelf(value: unknown): value is LibraryShelf {
  return value === 'practice' || value === 'standards' || value === 'generate'
}

export function isLibraryShelfFilter(value: unknown): value is LibraryShelfFilter {
  return value === 'all' || isLibraryShelf(value)
}

export type TuneEntry = {
  id: string
  title: string
  /** Short blurb shown in the library list. */
  blurb: string
  tags: readonly TuneTag[]
  /** Which library shelf lists this tune. */
  shelf: LibraryShelf
  /** Preferred backing style when loading the tune. */
  styleId: StyleId
  createChart: () => Chart
}
