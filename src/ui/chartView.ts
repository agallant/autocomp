import { formatChord, type Bar, type Chart } from '../music'
import type { ChartEditorState } from './chartEditor'

function slotLabel(bar: Bar): string {
  const chords = bar.slots.filter((s) => s.chord).map((s) => formatChord(s.chord!))
  if (chords.length === 0) return '·'
  return chords.join(' ')
}

export function renderEditableBars(state: ChartEditorState): string {
  const bars = state.chart.form.flatMap(
    (id) => state.chart.sections.find((s) => s.id === id)?.bars ?? [],
  )
  return bars
    .map((bar, i) => {
      const selected = i === state.selectedBarIndex
      const editing = selected && state.editing
      const label = slotLabel(bar)
      if (editing) {
        return `
          <div class="bar bar--selected bar--editing" data-bar="${i + 1}" data-index="${i}">
            <label class="sr-only" for="chord-input">Chord symbol</label>
            <input
              id="chord-input"
              class="bar__input"
              type="text"
              value="${escapeAttr(state.draftSymbol)}"
              spellcheck="false"
              autocomplete="off"
              aria-label="Chord symbol"
            />
            <span class="bar__beat">|</span>
          </div>`
      }
      return `
        <button
          type="button"
          class="bar${selected ? ' bar--selected' : ''}"
          data-bar="${i + 1}"
          data-index="${i}"
          aria-pressed="${selected}"
          aria-label="Bar ${i + 1}, ${escapeAttr(label === '·' ? 'empty' : label)}"
        >
          <span class="bar__chord">${escapeHtml(label)}</span>
          <span class="bar__beat">|</span>
        </button>`
    })
    .join('')
}

export function chartMetaLine(chart: Chart): string {
  const style = chart.styleHint ? ` · ${capitalize(chart.styleHint)}` : ''
  return `Edit · ${chart.timeSignature.numerator}/${chart.timeSignature.denominator}${style}`
}

function capitalize(value: string): string {
  return value.length ? value[0]!.toUpperCase() + value.slice(1) : value
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;')
}
