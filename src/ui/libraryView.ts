import {
  DEFAULT_LIBRARY_SHELF,
  LIBRARY_SHELF_FILTERS,
  allLibraryTags,
  filterTunes,
  isGenreTag,
  type LibraryShelf,
  type LibraryShelfFilter,
  type TuneEntry,
  type TuneTag,
} from '../library'
import { escapeAttr, escapeHtml } from './html'

export type LibraryViewState = {
  query: string
  tag: TuneTag | ''
  shelf: LibraryShelfFilter
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
            tune.tags.join(', '),
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

function tagOptionsHtml(tags: readonly TuneTag[], selected: TuneTag | ''): string {
  const option = (tag: TuneTag) =>
    `<option value="${escapeAttr(tag)}"${selected === tag ? ' selected' : ''}>${escapeHtml(tag)}</option>`
  const genres = tags.filter(isGenreTag)
  const feels = tags.filter((tag) => !isGenreTag(tag))
  const groups = [
    genres.length ? `<optgroup label="Genre">${genres.map(option).join('')}</optgroup>` : '',
    feels.length ? `<optgroup label="Feel / form">${feels.map(option).join('')}</optgroup>` : '',
  ]
  return groups.join('')
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
      <label class="library-field" for="library-tag">
        <span class="library-field__label">Tag</span>
        <select id="library-tag" class="library-tag" aria-label="Filter by genre or feel on this shelf">
          <option value=""${state.tag === '' ? ' selected' : ''}>All tags</option>
          ${tagOptionsHtml(tags, state.tag)}
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
