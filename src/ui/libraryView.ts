import {
  DEFAULT_LIBRARY_SHELF,
  LIBRARY_SHELVES,
  allLibraryTags,
  filterTunes,
  type LibraryShelf,
  type TuneEntry,
  type TuneTag,
} from '../library'
import { escapeAttr, escapeHtml } from './html'

export type LibraryViewState = {
  query: string
  tag: TuneTag | ''
  shelf: LibraryShelf
  activeTuneId: string
}

export function createLibraryViewState(activeTuneId: string): LibraryViewState {
  return {
    query: '',
    tag: '',
    shelf: DEFAULT_LIBRARY_SHELF,
    activeTuneId,
  }
}

const EMPTY_SHELF_COPY: Record<LibraryShelf, string> = {
  practice: 'No practice tunes match.',
  standards:
    'No standards match. Try clearing filters — Practice stays the default home; Standards holds cleared / traditional progressions.',
  generate:
    'No generate presets match. Try clearing filters, or use Full Random / the Generate controls above.',
}

export function libraryListHtml(state: LibraryViewState, tunes: readonly TuneEntry[]): string {
  const tags = state.tag ? [state.tag] : []
  const matches = filterTunes(tunes, {
    query: state.query,
    shelf: state.shelf,
    tags,
  })
  if (matches.length === 0) {
    const empty =
      state.query.trim() || state.tag
        ? 'No tunes match on this shelf.'
        : EMPTY_SHELF_COPY[state.shelf]
    return `<p class="library-empty" role="status">${escapeHtml(empty)}</p>`
  }
  return `
    <ul class="library-list" role="list">
      ${matches
        .map((tune) => {
          const active = tune.id === state.activeTuneId
          return `
            <li>
              <button
                type="button"
                class="library-item${active ? ' library-item--active' : ''}"
                data-tune-id="${escapeAttr(tune.id)}"
                aria-current="${active ? 'true' : 'false'}"
              >
                <span class="library-item__title">${escapeHtml(tune.title)}</span>
                <span class="library-item__meta">${escapeHtml(tune.blurb)} · ${escapeHtml(tune.tags.join(', '))}</span>
              </button>
            </li>
          `
        })
        .join('')}
    </ul>
  `
}

export function libraryControlsHtml(state: LibraryViewState): string {
  const tags = allLibraryTags(state.shelf)
  return `
    <div class="library-shelves" role="group" aria-label="Library shelf">
      ${LIBRARY_SHELVES.map((shelf) => {
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
          placeholder="Title, tag, or feel"
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      <label class="library-field" for="library-tag">
        <span class="library-field__label">Tag</span>
        <select id="library-tag" class="library-tag" aria-label="Filter by tag on this shelf">
          <option value=""${state.tag === '' ? ' selected' : ''}>All tags</option>
          ${tags
            .map(
              (tag) =>
                `<option value="${escapeAttr(tag)}"${state.tag === tag ? ' selected' : ''}>${escapeHtml(tag)}</option>`,
            )
            .join('')}
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
