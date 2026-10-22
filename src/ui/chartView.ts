import {
  chartLooksMinor,
  formatChord,
  formatRoot,
  preferSharpsForKey,
  transposeChord,
  writtenRoot,
  type Bar,
  type Chart,
} from '../music'
import { REST_TOKEN, type ChartEditorState } from './chartEditor'

function slotLabel(bar: Bar, displaySemitones: number, preferSharps: boolean): string {
  if (bar.slots.every((s) => !s.chord)) return '·'
  return bar.slots
    .map((s) => {
      if (!s.chord) return REST_TOKEN
      const chord =
        displaySemitones === 0
          ? s.chord
          : transposeChord(s.chord, displaySemitones, preferSharps)
      return formatChord(chord)
    })
    .join(' ')
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
  /** Semitones added for written-pitch display (Bb/Eb/F instruments). */
  displaySemitones?: number
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
  const displaySemitones = options.displaySemitones ?? 0
  const minor = chartLooksMinor(state.chart)
  const written = writtenRoot(state.chart.key, displaySemitones, minor)
  const sharpPref = preferSharpsForKey(written)

  return bars
    .map((bar, i) => {
      const selected = i === state.selectedBarIndex
      const editing = selected && state.editing
      const isPlayhead = playhead !== null && playhead !== undefined && i === playhead
      const isPlayFrom = showPlayFrom && selected && !isPlayhead && !editing
      const sectionStart = meta[i]?.isSectionStart
        ? meta[i]!.sectionLabel.trim() || meta[i]!.sectionId
        : null
      // Edit input stays concert pitch; view mode shows written for horns.
      const label = editing
        ? slotLabel(bar, 0, preferSharpsForKey(state.chart.key))
        : slotLabel(bar, displaySemitones, sharpPref)
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

/** Remembers which playhead bar-start we already scrolled for. */
export type PlayheadScrollMemory = {
  barIndex: number | null
  /** After leaving beat 1, the next beat-1 may re-scroll (A–B loop wrap). */
  armed: boolean
}

export const INITIAL_PLAYHEAD_SCROLL: PlayheadScrollMemory = {
  barIndex: null,
  armed: true,
}

/**
 * Decide whether to scroll for this transport tick.
 * Scrolls on beat 1 when the form bar changes, or when re-entering beat 1
 * after leaving it (so a one-bar practice loop re-scrolls each pass).
 */
export function nextPlayheadScroll(
  memory: PlayheadScrollMemory,
  playheadBarIndex: number | null,
  beat: number,
  playing: boolean,
): { scroll: boolean; memory: PlayheadScrollMemory } {
  if (!playing || playheadBarIndex === null) {
    return { scroll: false, memory: INITIAL_PLAYHEAD_SCROLL }
  }
  if (beat !== 1) {
    return { scroll: false, memory: { barIndex: memory.barIndex, armed: true } }
  }
  const scroll = memory.armed || memory.barIndex !== playheadBarIndex
  return {
    scroll,
    memory: scroll ? { barIndex: playheadBarIndex, armed: false } : memory,
  }
}

/**
 * Update playhead / play-from classes on an already-rendered `.bars` root
 * without rebuilding the chart (used each transport beat).
 * Markers are CSS pseudo-elements on the classes, so class sync is enough.
 * When `scrollIntoView` is true, scrolls the sounding bar into view
 * (`nearest` by default, or `center` when `centerPlayhead` is set;
 * smooth unless `reduceMotion`).
 */
export function syncBarPlayhead(
  barsRoot: ParentNode,
  options: {
    selectedBarIndex: number
    playheadBarIndex: number | null
    playing: boolean
    scrollIntoView?: boolean
    /** Prefer vertical centering over nearest-edge scrolling. */
    centerPlayhead?: boolean
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
    const block = options.centerPlayhead ? 'center' : 'nearest'
    playheadEl.scrollIntoView({
      block,
      inline: block,
      behavior: options.reduceMotion ? 'auto' : 'smooth',
    })
  }
}

export function chartMetaLine(chart: Chart, displaySemitones = 0): string {
  const style = chart.styleHint ? ` · ${capitalize(chart.styleHint)}` : ''
  const form = chart.form.length ? ` · Form ${escapeHtml(chart.form.join(''))}` : ''
  const meter = `${chart.timeSignature.numerator}/${chart.timeSignature.denominator}`
  if (!displaySemitones) {
    return `${formatRoot(chart.key)} · ${meter}${style}${form}`
  }
  const written = writtenRoot(chart.key, displaySemitones, chartLooksMinor(chart))
  return `Written ${formatRoot(written)} · Concert ${formatRoot(chart.key)} · ${meter}${style}${form}`
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
