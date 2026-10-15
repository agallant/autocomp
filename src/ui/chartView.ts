import { formatChord, formatRoot, type Bar, type Chart } from '../music'
import { REST_TOKEN, type ChartEditorState } from './chartEditor'

function slotLabel(bar: Bar): string {
  if (bar.slots.every((s) => !s.chord)) return '·'
  return bar.slots.map((s) => (s.chord ? formatChord(s.chord) : REST_TOKEN)).join(' ')
}

export type RenderBarsOptions = {
  /**
   * 0-based expanded bar currently sounding (playhead).
   * Omit or `null` when stopped / count-in.
   */
  playheadBarIndex?: number | null
  /**
   * When true (default), the selected bar shows a “play from here” marker
   * while stopped (or when it is not the live playhead).
   */
  showPlayFrom?: boolean
}

/** Expanded-form metadata for section boundary markers. */
export type ExpandedBarMeta = {
  sectionId: string
  sectionLabel: string
  /** True on the first bar of each form occurrence. */
  isSectionStart: boolean
}

export function expandBarMeta(chart: Chart): ExpandedBarMeta[] {
  const out: ExpandedBarMeta[] = []
  for (const id of chart.form) {
    const section = chart.sections.find((s) => s.id === id)
    if (!section) continue
    section.bars.forEach((_, barInSection) => {
      out.push({
        sectionId: section.id,
        sectionLabel: section.label,
        isSectionStart: barInSection === 0,
      })
    })
  }
  return out
}

export function renderEditableBars(
  state: ChartEditorState,
  options: RenderBarsOptions = {},
): string {
  const bars = state.chart.form.flatMap(
    (id) => state.chart.sections.find((s) => s.id === id)?.bars ?? [],
  )
  const meta = expandBarMeta(state.chart)
  const playhead = options.playheadBarIndex
  const showPlayFrom = options.showPlayFrom !== false

  return bars
    .map((bar, i) => {
      const selected = i === state.selectedBarIndex
      const editing = selected && state.editing
      const isPlayhead = playhead !== null && playhead !== undefined && i === playhead
      const isPlayFrom = showPlayFrom && selected && !isPlayhead && !editing
      const sectionStart = meta[i]?.isSectionStart
        ? meta[i]!.sectionLabel.trim() || meta[i]!.sectionId
        : null
      const label = slotLabel(bar)
      const classes = [
        'bar',
        selected ? 'bar--selected' : '',
        editing ? 'bar--editing' : '',
        isPlayhead ? 'bar--playhead' : '',
        isPlayFrom ? 'bar--play-from' : '',
        sectionStart ? 'bar--section-start' : '',
      ]
        .filter(Boolean)
        .join(' ')
      const sectionMark = sectionStart
        ? `<span class="bar__section" aria-hidden="true">${escapeHtml(sectionStart)}</span>`
        : ''

      if (editing) {
        return `
          <div class="${classes}" data-bar="${i + 1}" data-index="${i}"${
            sectionStart ? ` data-section="${escapeAttr(sectionStart)}"` : ''
          }>
            ${sectionMark}
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
          class="${classes}"
          data-bar="${i + 1}"
          data-index="${i}"
          ${sectionStart ? `data-section="${escapeAttr(sectionStart)}"` : ''}
          aria-pressed="${selected}"
          ${isPlayhead ? 'aria-current="true"' : ''}
          aria-label="Bar ${i + 1}${
            sectionStart ? `, section ${escapeAttr(sectionStart)}` : ''
          }, ${escapeAttr(label === '·' ? 'empty' : label)}${
            isPlayFrom ? ', play from here' : isPlayhead ? ', playing' : ''
          }"
        >
          ${sectionMark}
          <span class="bar__chord">${escapeHtml(label)}</span>
          <span class="bar__beat">|</span>
        </button>`
    })
    .join('')
}

/**
 * Update playhead / play-from classes on an already-rendered `.bars` root
 * without rebuilding the chart (used each transport beat).
 * Markers are CSS pseudo-elements on the classes, so class sync is enough.
 * When `scrollIntoView` is true, scrolls the sounding bar into the nearest
 * visible area (smooth unless `reduceMotion`).
 */
export function syncBarPlayhead(
  barsRoot: ParentNode,
  options: {
    selectedBarIndex: number
    playheadBarIndex: number | null
    playing: boolean
    scrollIntoView?: boolean
    reduceMotion?: boolean
  },
): void {
  const { selectedBarIndex, playheadBarIndex, playing } = options
  let playheadEl: HTMLElement | null = null
  for (const el of barsRoot.querySelectorAll<HTMLElement>('.bar')) {
    const index = Number(el.dataset.index)
    if (!Number.isInteger(index)) continue
    const isPlayhead = playing && playheadBarIndex !== null && index === playheadBarIndex
    const isPlayFrom =
      !playing && index === selectedBarIndex && !el.classList.contains('bar--editing')
    el.classList.toggle('bar--playhead', isPlayhead)
    el.classList.toggle('bar--play-from', isPlayFrom)
    if (isPlayhead) {
      el.setAttribute('aria-current', 'true')
      playheadEl = el
    } else {
      el.removeAttribute('aria-current')
    }
  }
  if (
    options.scrollIntoView &&
    playheadEl &&
    typeof playheadEl.scrollIntoView === 'function'
  ) {
    playheadEl.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: options.reduceMotion ? 'auto' : 'smooth',
    })
  }
}

export function chartMetaLine(chart: Chart): string {
  const style = chart.styleHint ? ` · ${capitalize(chart.styleHint)}` : ''
  const form = chart.form.length ? ` · Form ${escapeHtml(chart.form.join(''))}` : ''
  return `Edit · ${formatRoot(chart.key)} · ${chart.timeSignature.numerator}/${chart.timeSignature.denominator}${style}${form}`
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
