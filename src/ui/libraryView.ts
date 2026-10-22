import {
  DEFAULT_LIBRARY_SHELF,
  LIBRARY_SHELF_FILTERS,
  allLibraryTags,
  filterTunes,
  isGenreTag,
  isHiddenFilterTag,
  type LibraryShelf,
  type LibraryShelfFilter,
  type TuneEntry,
  type TuneTag,
} from '../library'
import { escapeAttr, escapeHtml } from './html'

export type LibraryViewState = {
  query: string
  /** Single top-level genre/style category (optional). */
  genre: TuneTag | ''
  /** Multi-select feel / form tags (AND with genre). */
  feelTags: readonly TuneTag[]
  shelf: LibraryShelfFilter
  activeTuneId: string
}

export function createLibraryViewState(activeTuneId: string): LibraryViewState {
  return {
    query: '',
    genre: '',
    feelTags: [],
    shelf: DEFAULT_LIBRARY_SHELF,
    activeTuneId,
  }
}

/** Genre + feel tags used by list filtering and Shuffle (keep in sync). */
export function activeFilterTags(state: LibraryViewState): TuneTag[] {
  return [
    ...(state.genre ? [state.genre] : []),
    ...state.feelTags,
  ]
}

const EMPTY_SHELF_COPY: Record<LibraryShelfFilter, string> = {
  practice: 'No practice drills match.',
  standards: 'No songs match. Try clearing filters — Songs is real repertoire; drills live under Practice.',
  generate:
    'No generate presets match. Try clearing filters, or use Full Random / the Generate controls above.',
  all: 'No tunes match across shelves. Try clearing filters.',
}

const SHELF_LABEL: Record<LibraryShelf, string> = {
  practice: 'Practice',
  standards: 'Songs',
  generate: 'Generate',
}

function visibleTags(tune: TuneEntry): string {
  return tune.tags.filter((tag) => !isHiddenFilterTag(tag)).join(', ')
}

export function libraryListHtml(state: LibraryViewState, tunes: readonly TuneEntry[]): string {
  const tags = activeFilterTags(state)
  const matches = filterTunes(tunes, {
    query: state.query,
    shelf: state.shelf,
    tags,
  })
  if (matches.length === 0) {
    const empty =
      state.query.trim() || tags.length > 0
        ? state.shelf === 'all'
          ? 'No tunes match across shelves.'
          : 'No tunes match on this shelf.'
        : EMPTY_SHELF_COPY[state.shelf]
    return `<p class="library-empty" role="status">${escapeHtml(empty)}</p>`
  }
  return `
    <ul class="library-list" role="list">
      ${matches
        .map((tune) => {
          const active = tune.id === state.activeTuneId
          const meta = [
            state.shelf === 'all' ? SHELF_LABEL[tune.shelf] : '',
            tune.composer,
            tune.era,
            tune.blurb,
            visibleTags(tune),
          ]
            .filter(Boolean)
            .join(' · ')
          return `
            <li>
              <button
                type="button"
                class="library-item${active ? ' library-item--active' : ''}"
                data-tune-id="${escapeAttr(tune.id)}"
                aria-current="${active ? 'true' : 'false'}"
              >
                <span class="library-item__title">${escapeHtml(tune.title)}</span>
                <span class="library-item__meta">${escapeHtml(meta)}</span>
              </button>
            </li>
          `
        })
        .join('')}
    </ul>
  `
}

function genreOptionsHtml(tags: readonly TuneTag[], selected: TuneTag | ''): string {
  return tags
    .filter(isGenreTag)
    .map(
      (tag) =>
        `<option value="${escapeAttr(tag)}"${selected === tag ? ' selected' : ''}>${escapeHtml(tag)}</option>`,
    )
    .join('')
}

function feelOptionsHtml(tags: readonly TuneTag[], selected: readonly TuneTag[]): string {
  const selectedSet = new Set(selected)
  return tags
    .filter((tag) => !isGenreTag(tag) && !isHiddenFilterTag(tag))
    .map(
      (tag) =>
        `<option value="${escapeAttr(tag)}"${selectedSet.has(tag) ? ' selected' : ''}>${escapeHtml(tag)}</option>`,
    )
    .join('')
}

export function libraryControlsHtml(state: LibraryViewState): string {
  const tags = allLibraryTags(state.shelf === 'all' ? undefined : state.shelf)
  return `
    <div class="library-shelves" role="group" aria-label="Library shelf">
      ${LIBRARY_SHELF_FILTERS.map((shelf) => {
        const selected = state.shelf === shelf.id
        return `
          <button
            type="button"
            class="library-shelf${selected ? ' library-shelf--active' : ''}"
            id="library-shelf-${escapeAttr(shelf.id)}"
            data-library-shelf="${escapeAttr(shelf.id)}"
            aria-pressed="${selected ? 'true' : 'false'}"
          >${escapeHtml(shelf.label)}</button>
        `
      }).join('')}
    </div>
    <div class="library-controls">
      <label class="library-field" for="library-search">
        <span class="library-field__label">Search</span>
        <input
          id="library-search"
          class="library-search"
          type="search"
          value="${escapeAttr(state.query)}"
          placeholder="Title, composer, era, or tag"
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      <label class="library-field" for="library-genre">
        <span class="library-field__label">Category</span>
        <select id="library-genre" class="library-tag" aria-label="Filter by genre category">
          <option value=""${state.genre === '' ? ' selected' : ''}>All genres</option>
          ${genreOptionsHtml(tags, state.genre)}
        </select>
      </label>
      <label class="library-field library-field--feel" for="library-feel">
        <span class="library-field__label">Feel tags</span>
        <select
          id="library-feel"
          class="library-feel"
          multiple
          size="4"
          aria-label="Filter by feel or form tags (multi-select)"
        >
          ${feelOptionsHtml(tags, state.feelTags)}
        </select>
      </label>
      ${
        state.shelf === 'practice'
          ? `<div class="library-field library-field--action">
        <span class="library-field__label">Surprise</span>
        <button type="button" class="library-shuffle" data-library-shuffle aria-label="Shuffle a practice chart">
          Shuffle
        </button>
      </div>`
          : ''
      }
    </div>
  `
}
