import { allLibraryTags, filterTunes, type TuneEntry, type TuneTag } from '../library'
import { escapeAttr, escapeHtml } from './html'

export type LibraryViewState = {
  query: string
  tag: TuneTag | ''
  activeTuneId: string
}

export function createLibraryViewState(activeTuneId: string): LibraryViewState {
  return { query: '', tag: '', activeTuneId }
}

export function libraryListHtml(state: LibraryViewState, tunes: readonly TuneEntry[]): string {
  const tags = state.tag ? [state.tag] : []
  const matches = filterTunes(tunes, { query: state.query, tags })
  if (matches.length === 0) {
    return `<p class="library-empty" role="status">No tunes match.</p>`
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
  const tags = allLibraryTags()
  return `
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
        <select id="library-tag" class="library-tag" aria-label="Filter by tag">
          <option value=""${state.tag === '' ? ' selected' : ''}>All tags</option>
          ${tags
            .map(
              (tag) =>
                `<option value="${escapeAttr(tag)}"${state.tag === tag ? ' selected' : ''}>${escapeHtml(tag)}</option>`,
            )
            .join('')}
        </select>
      </label>
    </div>
  `
}
