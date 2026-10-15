import { createAutumnPracticeChart } from '../data/practiceCharts'
import { APP_VERSION } from '../lib/version'
import { TUNE_LIBRARY, getTuneById, type TuneTag } from '../library'
import {
  chartToMidiBytes,
  createWebMidiSink,
  getMidiOutput,
  isWebMidiSupported,
  listMidiOutputs,
  midiDownloadFilename,
  midiToDownloadBlob,
  type MidiOutputInfo,
  type WebMidiSink,
} from '../midi'
import {
  chartToWavBytes,
  wavDownloadFilename,
  wavToDownloadBlob,
} from '../render'
import type { Chart } from '../music'
import {
  STYLE_PACK,
  createStyleById,
  getStyleDescriptor,
  isStyleId,
  type StyleId,
} from '../style'
import {
  chartDownloadFilename,
  chartToDownloadBlob,
  createDefaultChartRepository,
  parseChartImport,
  type ChartRepository,
  type SavedChartMeta,
} from '../storage'
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
import {
  createLibraryViewState,
  libraryControlsHtml,
  libraryListHtml,
} from './libraryView'
import { escapeAttr, escapeHtml } from './html'
import { savedListHtml } from './savedView'
import { TransportController, type TransportState } from './transport'

export type MountAppOptions = {
  /** Inject a chart repository (tests / non-browser). */
  chartRepository?: ChartRepository
}

export function mountApp(root: HTMLElement, options: MountAppOptions = {}): () => void {
  let editor = createEditorState(createAutumnPracticeChart())
  let styleId: StyleId = 'jazz-swing'
  let library = createLibraryViewState('autumn-practice')
  let savedCharts: SavedChartMeta[] = []
  let persistStatus = ''
  let midiOutputs: MidiOutputInfo[] = []
  let midiOutputId = ''
  let midiSink: WebMidiSink | null = null
  /** Bumps on each MIDI-out selection so stale async opens are ignored. */
  let midiSelectGeneration = 0
  const webMidiAvailable = isWebMidiSupported()
  const charts = options.chartRepository ?? createDefaultChartRepository()

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

          <section class="panel" aria-labelledby="library-heading">
            <h2 id="library-heading" class="panel__title">Library</h2>
            <p class="panel__copy">
              Built-in practice progressions — search or filter by tag, then load a chart.
            </p>
            ${libraryControlsHtml(library)}
            <div id="library-results">
              ${libraryListHtml(library, TUNE_LIBRARY)}
            </div>
            <h3 class="panel__subtitle">Saved on this device</h3>
            <div id="saved-results">
              ${savedListHtml(savedCharts)}
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
    bindLibrary()
    bindSaved()
    bindTransport()
    void refreshSaved()
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
      <button type="button" class="btn" id="save-chart">Save</button>
      <button type="button" class="btn" id="export-chart">Export JSON</button>
      <button type="button" class="btn" id="export-midi">Export MIDI</button>
      <button type="button" class="btn" id="export-wav">Export WAV</button>
      <label class="btn chart-toolbar__file">
        Import
        <input id="import-chart" class="sr-only" type="file" accept="application/json,.json" />
      </label>
      <label class="style-picker" for="style-select">
        <span class="style-picker__label">Style</span>
        <select id="style-select" class="style-picker__select" aria-label="Backing style">
          ${STYLE_PACK.map(
            (style) =>
              `<option value="${style.id}"${style.id === styleId ? ' selected' : ''}>${escapeHtml(style.label)}</option>`,
          ).join('')}
        </select>
      </label>
      ${
        webMidiAvailable
          ? `<label class="style-picker" for="midi-out-select">
        <span class="style-picker__label">MIDI out</span>
        <select id="midi-out-select" class="style-picker__select" aria-label="MIDI output device">
          <option value="">None (audio only)</option>
          ${midiOutputs
            .map(
              (out) =>
                `<option value="${escapeAttr(out.id)}"${out.id === midiOutputId ? ' selected' : ''}>${escapeHtml(out.name)}</option>`,
            )
            .join('')}
        </select>
      </label>`
          : ''
      }
    </div>
    <p class="chart-error" id="chart-error" role="status">${escapeHtml(state.error ?? persistStatus)}</p>
    <div class="bars" id="bars">
      ${renderEditableBars(state)}
    </div>
  `

  const setPersistStatus = (message: string): void => {
    persistStatus = message
    const err = root.querySelector('#chart-error')
    if (err) err.textContent = message
  }

  const refreshChart = (): void => {
    const stage = root.querySelector('#chart-stage')
    if (!stage) return
    stage.innerHTML = chartStageInner(editor)
    bindChart()
  }

  const refreshLibrary = (): void => {
    const results = root.querySelector('#library-results')
    if (!results) return
    results.innerHTML = libraryListHtml(library, TUNE_LIBRARY)
    bindLibraryItems()
  }

  const refreshSaved = async (): Promise<void> => {
    try {
      savedCharts = await charts.list()
    } catch {
      savedCharts = []
      setPersistStatus('Could not read saved charts.')
    }
    const results = root.querySelector('#saved-results')
    if (results) {
      results.innerHTML = savedListHtml(savedCharts)
      bindSaved()
    }
  }

  const setEditor = (next: ChartEditorState): void => {
    editor = next
    refreshChart()
    if (next.editing) {
      // Keep typing after a failed commit (innerHTML replaces the focused input).
      focusChordInput({ selectAll: next.error === null })
    }
  }

  const applyChart = (chart: Chart, opts: { styleId?: StyleId; activeTuneId?: string }): void => {
    transport?.stop()
    editor = createEditorState(chart)
    if (opts.activeTuneId) {
      library = { ...library, activeTuneId: opts.activeTuneId }
    }
    if (opts.styleId) styleId = opts.styleId
    else if (chart.styleHint && isStyleId(chart.styleHint)) styleId = chart.styleHint
    else if (chart.styleHint === 'swing') styleId = 'jazz-swing'
    refreshChart()
    refreshLibrary()
    transport?.setBeatsPerBar(chart.timeSignature.numerator)
    transport?.setTempo(chart.defaultTempoBpm)
    applyStyle(styleId, { adjustTempo: false })
  }

  const loadTune = (tuneId: string): void => {
    const tune = getTuneById(tuneId)
    if (!tune) return
    applyChart(tune.createChart(), { styleId: tune.styleId, activeTuneId: tune.id })
  }

  const loadSaved = async (id: string): Promise<void> => {
    try {
      const chart = await charts.get(id)
      if (!chart) {
        setPersistStatus('Saved chart not found.')
        return
      }
      applyChart(chart, { activeTuneId: chart.id })
      setPersistStatus(`Loaded “${chart.title}”.`)
    } catch {
      setPersistStatus('Could not load saved chart.')
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
        : `Ready — tap Play to unlock audio (required on iOS/Safari) and start ${desc.label}.`
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

  const refreshMidiOutputs = async (): Promise<void> => {
    if (!webMidiAvailable) return
    try {
      midiOutputs = await listMidiOutputs()
      const select = root.querySelector<HTMLSelectElement>('#midi-out-select')
      if (!select) return
      const previous = select.value
      select.innerHTML = `<option value="">None (audio only)</option>${midiOutputs
        .map(
          (out) =>
            `<option value="${escapeAttr(out.id)}">${escapeHtml(out.name)}</option>`,
        )
        .join('')}`
      const keep =
        previous && midiOutputs.some((out) => out.id === previous)
          ? previous
          : midiOutputId && midiOutputs.some((out) => out.id === midiOutputId)
            ? midiOutputId
            : ''
      select.value = keep
    } catch {
      setPersistStatus('Could not access MIDI devices.')
    }
  }

  const clearMidiOutSelect = (): void => {
    const select = root.querySelector<HTMLSelectElement>('#midi-out-select')
    if (select) select.value = ''
  }

  const applyMidiOutput = async (id: string): Promise<void> => {
    const generation = ++midiSelectGeneration
    midiSink?.dispose()
    midiSink = null
    transport?.setMidiSink(null)
    midiOutputId = id
    if (!id) {
      setPersistStatus('MIDI out disabled.')
      return
    }
    try {
      const output = await getMidiOutput(id)
      if (generation !== midiSelectGeneration) return
      if (!output) {
        setPersistStatus('MIDI output not found.')
        midiOutputId = ''
        clearMidiOutSelect()
        return
      }
      midiSink = createWebMidiSink(output)
      transport?.setMidiSink(midiSink)
      setPersistStatus(`MIDI out → ${output.name || id}.`)
    } catch {
      if (generation !== midiSelectGeneration) return
      midiOutputId = ''
      clearMidiOutSelect()
      transport?.setMidiSink(null)
      setPersistStatus('Could not open MIDI output.')
    }
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
      midiSink,
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

  const bindLibraryItems = (): void => {
    root.querySelectorAll<HTMLButtonElement>('[data-tune-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.tuneId
        if (id) loadTune(id)
      })
    })
  }

  const bindLibrary = (): void => {
    const search = root.querySelector<HTMLInputElement>('#library-search')
    const tagSelect = root.querySelector<HTMLSelectElement>('#library-tag')
    search?.addEventListener('input', () => {
      library = { ...library, query: search.value }
      refreshLibrary()
    })
    tagSelect?.addEventListener('change', () => {
      const value = tagSelect.value
      library = { ...library, tag: (value || '') as TuneTag | '' }
      refreshLibrary()
    })
    bindLibraryItems()
  }

  const bindSaved = (): void => {
    root.querySelectorAll<HTMLButtonElement>('[data-saved-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.savedId
        if (id) void loadSaved(id)
      })
    })
    root.querySelectorAll<HTMLButtonElement>('[data-delete-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.deleteId
        if (!id) return
        void (async () => {
          try {
            await charts.delete(id)
            setPersistStatus('Deleted saved chart.')
            await refreshSaved()
          } catch {
            setPersistStatus('Could not delete saved chart.')
          }
        })()
      })
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
    root.querySelector('#save-chart')?.addEventListener('click', () => {
      void (async () => {
        try {
          const record = await charts.put(editor.chart)
          setPersistStatus(`Saved “${record.title}”.`)
          await refreshSaved()
        } catch {
          setPersistStatus('Could not save chart.')
        }
      })()
    })
    root.querySelector('#export-chart')?.addEventListener('click', () => {
      try {
        const blob = chartToDownloadBlob(editor.chart)
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = chartDownloadFilename(editor.chart)
        anchor.click()
        // Defer revoke — some browsers resolve the download asynchronously.
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setPersistStatus(`Exported ${chartDownloadFilename(editor.chart)}.`)
      } catch {
        setPersistStatus('Could not export chart.')
      }
    })
    root.querySelector('#export-midi')?.addEventListener('click', () => {
      try {
        const tempoBpm = transport?.getState().tempoBpm ?? editor.chart.defaultTempoBpm
        const bytes = chartToMidiBytes(editor.chart, createStyleById(styleId), { tempoBpm })
        const blob = midiToDownloadBlob(bytes)
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = midiDownloadFilename(editor.chart)
        anchor.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setPersistStatus(`Exported ${midiDownloadFilename(editor.chart)}.`)
      } catch {
        setPersistStatus('Could not export MIDI.')
      }
    })
    root.querySelector('#export-wav')?.addEventListener('click', () => {
      const button = root.querySelector<HTMLButtonElement>('#export-wav')
      if (button?.disabled) return
      void (async () => {
        if (button) button.disabled = true
        setPersistStatus('Rendering WAV…')
        try {
          const tempoBpm = transport?.getState().tempoBpm ?? editor.chart.defaultTempoBpm
          const bytes = await chartToWavBytes(editor.chart, createStyleById(styleId), { tempoBpm })
          const blob = wavToDownloadBlob(bytes)
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = wavDownloadFilename(editor.chart)
          anchor.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          setPersistStatus(`Exported ${wavDownloadFilename(editor.chart)}.`)
        } catch {
          setPersistStatus('Could not export WAV.')
        } finally {
          if (button) button.disabled = false
        }
      })()
    })
    root.querySelector('#midi-out-select')?.addEventListener('focus', () => {
      void refreshMidiOutputs()
    })
    root.querySelector('#midi-out-select')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value
      void applyMidiOutput(value)
    })
    root.querySelector<HTMLInputElement>('#import-chart')?.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      input.value = ''
      if (!file) return
      void (async () => {
        let chart
        try {
          chart = parseChartImport(await file.text())
        } catch {
          setPersistStatus('Could not import chart JSON.')
          return
        }
        applyChart(chart, { activeTuneId: chart.id })
        try {
          await charts.put(chart)
          setPersistStatus(`Imported “${chart.title}”.`)
          await refreshSaved()
        } catch {
          setPersistStatus(`Loaded “${chart.title}”, but could not save it locally.`)
        }
      })()
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
      persistStatus = ''
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
    midiSink?.dispose()
    midiSink = null
  }
}

