import { formatChord, formatRoot, type Bar, type Chart } from '../music'
import { REST_TOKEN, type ChartEditorState } from './chartEditor'

function slotLabel(bar: Bar): string {
  if (bar.slots.every((s) => !s.chord)) return '·'
  return bar.slots.map((s) => (s.chord ? formatChord(s.chord) : REST_TOKEN)).join(' ')
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
            <label class="sr-only" for="chord-input">Chord symbols</label>
            <input
              id="chord-input"
              class="bar__input"
              type="text"
              value="${escapeAttr(state.draftSymbol)}"
              placeholder="Dm7 G7 or NC G7"
              spellcheck="false"
              autocomplete="off"
              aria-label="Chord symbols (space-separated; NC for a rest slot)"
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
  return `Edit · ${formatRoot(chart.key)} · ${chart.timeSignature.numerator}/${chart.timeSignature.denominator}${style}`
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
