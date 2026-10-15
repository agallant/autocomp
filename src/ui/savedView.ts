import type { SavedChartMeta } from '../storage'
import { escapeAttr, escapeHtml } from './html'

export function savedListHtml(items: readonly SavedChartMeta[]): string {
  if (items.length === 0) {
    return `<p class="library-empty" role="status">No saved charts yet — use Save in the chart toolbar.</p>`
  }
  return `
    <ul class="library-list" role="list">
      ${items
        .map(
          (item) => `
            <li class="saved-item">
              <button type="button" class="library-item" data-saved-id="${escapeAttr(item.id)}">
                <span class="library-item__title">${escapeHtml(item.title)}</span>
                <span class="library-item__meta">Saved ${escapeHtml(formatSavedAt(item.updatedAt))}</span>
              </button>
              <button
                type="button"
                class="btn saved-item__delete"
                data-delete-id="${escapeAttr(item.id)}"
                aria-label="Delete ${escapeAttr(item.title)}"
              >
                Delete
              </button>
            </li>
          `,
        )
        .join('')}
    </ul>
  `
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
