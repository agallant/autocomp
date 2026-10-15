import { createAutumnPracticeChart } from '../data/autumnPractice'
import { APP_VERSION } from '../lib/version'
import {
  STYLE_PACK,
  createStyleById,
  getStyleDescriptor,
  isStyleId,
  type StyleId,
} from '../style'
import {
  addBarAfterSelection,
  beginEdit,
  cancelEdit,
  commitEdit,
  createEditorState,
  moveSelection,
  removeSelectedBar,
  selectBar,
  setDraftSymbol,
  setTitle,
  type ChartEditorState,
} from './chartEditor'
import { chartMetaLine, renderEditableBars } from './chartView'
import { TransportController, type TransportState } from './transport'

export function mountApp(root: HTMLElement): () => void {
  let editor = createEditorState(createAutumnPracticeChart())
  let styleId: StyleId = 'jazz-swing'

  const renderShell = (): void => {
    root.innerHTML = `
      <div class="app">
        <header class="header">
          <div class="brand">
            <h1 class="brand__name">Autocomp</h1>
            <span class="brand__tag">automatic accompaniment</span>
          </div>
          <div class="header__meta">v${APP_VERSION}</div>
        </header>

        <main class="main">
          <section class="panel" aria-labelledby="chart-heading">
            <h2 id="chart-heading" class="panel__title">Chart</h2>
            <p class="panel__copy">
              Click a bar to select, Enter to edit the chord, arrows to move.
              Choose a backing style, then press Play.
            </p>
            <div class="chart-stage" role="group" aria-label="Editable chord chart" id="chart-stage">
              ${chartStageInner(editor)}
            </div>
          </section>

          <section class="panel" aria-labelledby="status-heading">
            <h2 id="status-heading" class="panel__title">Session</h2>
            <p class="panel__copy" id="session-status">
              <span class="status-dot" id="status-dot" aria-hidden="true"></span>
              Ready — press Play for accompaniment.
            </p>
          </section>
        </main>

        <footer class="transport" aria-label="Transport">
          <div class="transport__controls">
            <button
              type="button"
              class="btn btn--primary"
              id="play-toggle"
              aria-label="Play"
              aria-pressed="false"
            >
              <span aria-hidden="true">Play</span>
            </button>
            <button type="button" class="btn" id="tempo-down" aria-label="Decrease tempo">−10</button>
            <button type="button" class="btn" id="tempo-up" aria-label="Increase tempo">+10</button>
          </div>
          <div class="transport__readout">
            <span>Tempo <strong id="tempo-readout">${editor.chart.defaultTempoBpm}</strong> BPM</span>
            <span>Bar <strong id="bar-readout">1</strong></span>
            <span>Beat <strong id="beat-readout">1</strong></span>
          </div>
        </footer>
      </div>
    `
    bindChart()
    bindTransport()
  }

  const chartStageInner = (state: ChartEditorState): string => `
    <div class="chart-stage__label">${chartMetaLine(state.chart)}</div>
    <label class="sr-only" for="title-input">Chart title</label>
    <input
      id="title-input"
      class="chart-stage__title-input"
      type="text"
      value="${escapeAttr(state.chart.title)}"
      spellcheck="false"
    />
    <div class="chart-toolbar">
      <button type="button" class="btn" id="edit-chord">Edit chord</button>
      <button type="button" class="btn" id="add-bar">Add bar</button>
      <button type="button" class="btn" id="remove-bar">Remove bar</button>
      <label class="style-picker" for="style-select">
        <span class="style-picker__label">Style</span>
        <select id="style-select" class="style-picker__select" aria-label="Backing style">
          ${STYLE_PACK.map(
            (style) =>
              `<option value="${style.id}"${style.id === styleId ? ' selected' : ''}>${escapeHtml(style.label)}</option>`,
          ).join('')}
        </select>
      </label>
    </div>
    <p class="chart-error" id="chart-error" role="status">${escapeHtml(state.error ?? '')}</p>
    <div class="bars" id="bars">
      ${renderEditableBars(state)}
    </div>
  `

  const refreshChart = (): void => {
    const stage = root.querySelector('#chart-stage')
    if (!stage) return
    stage.innerHTML = chartStageInner(editor)
    bindChart()
  }

  const setEditor = (next: ChartEditorState): void => {
    editor = next
    refreshChart()
    if (next.editing) {
      // Keep typing after a failed commit (innerHTML replaces the focused input).
      focusChordInput({ selectAll: next.error === null })
    }
  }

  let transport: TransportController | null = null
  let playToggle: HTMLButtonElement | null = null
  let playLabel: HTMLElement | null = null
  let tempoReadout: HTMLElement | null = null
  let barReadout: HTMLElement | null = null
  let beatReadout: HTMLElement | null = null
  let statusDot: HTMLElement | null = null
  let sessionStatus: HTMLElement | null = null

  const renderTransport = (state: TransportState): void => {
    if (!playToggle || !playLabel || !tempoReadout || !barReadout || !beatReadout || !statusDot || !sessionStatus) {
      return
    }
    playToggle.setAttribute('aria-pressed', String(state.playing))
    playLabel.textContent = state.playing ? 'Stop' : 'Play'
    tempoReadout.textContent = String(state.tempoBpm)
    barReadout.textContent = String(state.bar)
    beatReadout.textContent = String(state.beat)
    statusDot.classList.toggle('status-dot--live', state.playing)
    const desc = getStyleDescriptor(state.styleId ?? styleId)
    const label = state.playing
      ? `${desc.label} running — ${desc.blurb}.`
      : state.audioReady
        ? `Ready — press Play for ${desc.label}.`
        : `Ready — press Play to unlock audio and start ${desc.label}.`
    sessionStatus.lastChild!.textContent = ` ${label}`
  }

  const applyStyle = (nextId: StyleId, opts: { adjustTempo: boolean }): void => {
    styleId = nextId
    const desc = getStyleDescriptor(nextId)
    transport?.setStyle(desc.create())
    if (opts.adjustTempo && transport) {
      transport.setTempo(desc.suggestedTempoBpm)
    }
    // Keep the select in sync when the chart stage is not rebuilt.
    const select = root.querySelector<HTMLSelectElement>('#style-select')
    if (select && select.value !== nextId) select.value = nextId
  }

  const bindTransport = (): void => {
    playToggle = root.querySelector('#play-toggle')
    playLabel = playToggle?.querySelector('span') ?? null
    const tempoDown = root.querySelector<HTMLButtonElement>('#tempo-down')
    const tempoUp = root.querySelector<HTMLButtonElement>('#tempo-up')
    tempoReadout = root.querySelector('#tempo-readout')
    barReadout = root.querySelector('#bar-readout')
    beatReadout = root.querySelector('#beat-readout')
    statusDot = root.querySelector('#status-dot')
    sessionStatus = root.querySelector('#session-status')

    const desc = getStyleDescriptor(styleId)
    transport?.dispose()
    transport = new TransportController({
      onChange: renderTransport,
      beatsPerBar: editor.chart.timeSignature.numerator,
      style: createStyleById(styleId),
      getChart: () => editor.chart,
      metronomeEnabled: false,
    })
    transport.setTempo(editor.chart.defaultTempoBpm || desc.suggestedTempoBpm)

    playToggle?.addEventListener('click', () => transport?.toggle())
    tempoDown?.addEventListener('click', () => {
      if (!transport) return
      transport.setTempo(transport.getState().tempoBpm - 10)
    })
    tempoUp?.addEventListener('click', () => {
      if (!transport) return
      transport.setTempo(transport.getState().tempoBpm + 10)
    })
  }

  const bindChart = (): void => {
    const bars = root.querySelector('#bars')
    bars?.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
      const index = Number(el.dataset.index)
      if (el.tagName === 'BUTTON') {
        el.addEventListener('click', () => {
          if (editor.selectedBarIndex === index && !editor.editing) {
            setEditor(beginEdit(editor))
          } else {
            setEditor(selectBar(editor, index))
          }
        })
        el.addEventListener('dblclick', () => {
          setEditor(beginEdit(selectBar(editor, index)))
        })
      }
    })

    root.querySelector('#edit-chord')?.addEventListener('click', () => {
      setEditor(beginEdit(editor))
    })
    root.querySelector('#add-bar')?.addEventListener('click', () => {
      setEditor(addBarAfterSelection(editor))
    })
    root.querySelector('#remove-bar')?.addEventListener('click', () => {
      setEditor(removeSelectedBar(editor))
    })
    root.querySelector<HTMLSelectElement>('#style-select')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value
      if (!isStyleId(value)) return
      applyStyle(value, { adjustTempo: true })
    })

    const titleInput = root.querySelector<HTMLInputElement>('#title-input')
    titleInput?.addEventListener('change', () => {
      setEditor(setTitle(editor, titleInput.value))
    })

    const chordInput = root.querySelector<HTMLInputElement>('#chord-input')
    chordInput?.addEventListener('input', () => {
      editor = setDraftSymbol(editor, chordInput.value)
      const err = root.querySelector('#chart-error')
      if (err) err.textContent = ''
    })
    chordInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        setEditor(commitEdit(editor))
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setEditor(cancelEdit(editor))
      }
    })
    chordInput?.addEventListener('blur', () => {
      if (editor.editing) {
        setEditor(commitEdit(editor))
      }
    })
  }

  const focusChordInput = (opts: { selectAll?: boolean } = {}): void => {
    const selectAll = opts.selectAll !== false
    queueMicrotask(() => {
      const input = root.querySelector<HTMLInputElement>('#chord-input')
      if (!input) return
      input.focus()
      if (selectAll) {
        input.select()
      } else {
        const end = input.value.length
        input.setSelectionRange(end, end)
      }
    })
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return
    }
    // Let Enter activate focused buttons (toolbar, transport, bar cells).
    if (event.key === 'Enter' && target instanceof HTMLButtonElement) {
      return
    }
    if (editor.editing) return

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      setEditor(moveSelection(editor, 1))
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      setEditor(moveSelection(editor, -1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      setEditor(beginEdit(editor))
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      setEditor(removeSelectedBar(editor))
    }
  }

  window.addEventListener('keydown', onKeyDown)
  renderShell()

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    transport?.dispose()
  }
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
