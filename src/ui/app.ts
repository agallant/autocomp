import { createAutumnPracticeChart } from '../data/practiceCharts'
import {
  PROGRESSION_CATALOG,
  PROGRESSION_KINDS,
  REHARM_CATALOG,
  generateProgression,
  reharmBar,
  setPreferredEngineLength,
  styleGenerateHints,
  type ProgressionKind,
  type ReharmMode,
} from '../generate'
import { FollowEngine, MicCapture, type FollowSnapshot } from '../listen'
import { APP_BUILD_TIME, APP_VERSION } from '../lib/version'
import {
  CLICK_SUBDIVISION_OPTIONS,
  DEFAULT_CLICK_LEVEL,
  clampClickLevel,
  getAudioContext,
  isClickSubdivision,
  unlockAudioContext,
  type ClickSubdivision,
} from '../audio'
import {
  TUNE_LIBRARY,
  getTuneById,
  isLibraryShelfFilter,
  shufflePractice,
  type TuneTag,
} from '../library'
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
import {
  expandChartBars,
  formatRoot,
  parseRoot,
  preferSharpsFromRoot,
  respellChart,
  rootToPc,
  transposeChart,
  transposeChartToKey,
  type Chart,
  type Root,
} from '../music'
import {
  STYLE_PACK,
  STYLE_VOICES,
  createGuideMelodyStyle,
  createLeveledStyle,
  createMutedStyle,
  createStyleById,
  getStyleDescriptor,
  isStyleId,
  type StyleEngine,
  type StyleId,
  type StyleVoice,
  type VoiceLevels,
  type VoiceMuteState,
} from '../style'
import {
  COMP_DENSITY_OPTIONS,
  COUNT_IN_BAR_OPTIONS,
  DEFAULT_SWING_FEEL,
  clampCountInBars,
  createVariedStyle,
  nextCompDensity,
  seedFromString,
  type CompDensity,
  type VariationOptions,
} from '../variation'
import {
  chartDownloadFilename,
  chartToDownloadBlob,
  createDefaultChartRepository,
  createLocalPrefsStorage,
  loadPracticePrefs,
  parseChartImport,
  savePracticePrefs,
  type ChartRepository,
  type PrefsStorage,
  type SavedChartMeta,
} from '../storage'
import {
  addBarAfterSelection,
  addSection,
  beginEdit,
  cancelEdit,
  commitEdit,
  createEditorState,
  formDraftString,
  moveFormOccurrence,
  moveSelection,
  removeSelectedBar,
  removeSelectedSection,
  renameSelectedSection,
  selectBar,
  selectedSectionId,
  selectedSectionLabel,
  setDraftSymbol,
  setFormOrder,
  setTitle,
  type ChartEditorState,
} from './chartEditor'
import {
  chartMetaLine,
  INITIAL_PLAYHEAD_SCROLL,
  nextPlayheadScroll,
  renderEditableBars,
  syncBarPlayhead,
  type PlayheadScrollMemory,
} from './chartView'
import {
  createLibraryViewState,
  libraryControlsHtml,
  libraryListHtml,
} from './libraryView'
import { escapeAttr, escapeHtml } from './html'
import {
  DEFAULT_PRACTICE_LOOP,
  normalizePracticeLoop,
  type PracticeLoop,
} from './practiceLoop'
import { savedListHtml } from './savedView'
import {
  densityFromPracticeAction,
  practiceKeyAction,
  practiceTempoDelta,
} from './practiceKeys'
import { createTapTempoState, tapTempo } from './tapTempo'
import { TransportController, type TransportState } from './transport'

export type MountAppOptions = {
  /** Inject a chart repository (tests / non-browser). */
  chartRepository?: ChartRepository
  /** Inject practice-prefs storage (tests / non-browser). */
  prefsStorage?: PrefsStorage
}

export function mountApp(root: HTMLElement, options: MountAppOptions = {}): () => void {
  const prefsStorage = options.prefsStorage ?? createLocalPrefsStorage()
  const savedPrefs = loadPracticePrefs(prefsStorage)

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
  /** True while an offline WAV bounce is in flight (survives chart re-renders). */
  let wavExporting = false
  let variationFills = savedPrefs.fills
  /** Bars of metronome before the form (0 = off). */
  let variationCountInBars = savedPrefs.countInBars
  /** Click track during form bars (count-in always clicks when enabled). */
  let metronomeEnabled = savedPrefs.metronomeEnabled
  /** Click / count-in level 0–1. */
  let clickLevel = savedPrefs.clickLevel
  let clickSubdivision: ClickSubdivision = savedPrefs.clickSubdivision
  let variationHumanize = savedPrefs.humanize
  let variationDensity: CompDensity = savedPrefs.density
  let variationEndings = savedPrefs.endings
  let variationSwingFeel = savedPrefs.swingFeel
  let centerPlayhead = savedPrefs.centerPlayhead
  let voiceEnabled: VoiceMuteState = { ...savedPrefs.voiceEnabled }
  let voiceLevels: VoiceLevels = { ...savedPrefs.voiceLevels }
  let practiceLoop: PracticeLoop = { ...DEFAULT_PRACTICE_LOOP }
  const tapTempoState = createTapTempoState()
  let generateKind: ProgressionKind = styleGenerateHints(styleId).defaultKind
  let generateKey: Root = { letter: 'C', accidental: 0 }
  let generateBarCount: 8 | 12 | 16 = 12
  // Keep module preference in sync with this mount (avoids leak across remounts).
  setPreferredEngineLength(generateBarCount)
  let generateChordDensity: 1 | 2 = 1
  let generateMajorBias: 0.85 | 0.5 | 0.15 = 0.85
  let generatePreferIiV = true
  let reharmMode: ReharmMode = 'ii-before-v'
  /** Progressive disclosure: keep Settings open across chart re-renders. */
  let chartMoreOpen = true
  /** View mode by default (iReal-like); Edit unlocks chord/form mutation. */
  let chartEditMode = false
  let followEnabled = false
  let followEngine: FollowEngine | null = null
  let followSnapshot: FollowSnapshot = {
    match: null,
    locked: false,
    status: 'idle',
    message: 'Follow off',
  }
  const webMidiAvailable = isWebMidiSupported()
  const followSupported = MicCapture.isSupported()
  const charts = options.chartRepository ?? createDefaultChartRepository()

  const persistPracticePrefs = (): void => {
    savePracticePrefs(
      {
        version: 1,
        voiceLevels,
        voiceEnabled,
        clickLevel,
        metronomeEnabled,
        clickSubdivision,
        countInBars: variationCountInBars,
        density: variationDensity,
        swingFeel: variationSwingFeel,
        fills: variationFills,
        humanize: variationHumanize,
        endings: variationEndings,
        centerPlayhead,
      },
      prefsStorage,
    )
  }

  const GENERATE_KEYS: Root[] = [
    { letter: 'C', accidental: 0 },
    { letter: 'D', accidental: -1 },
    { letter: 'D', accidental: 0 },
    { letter: 'E', accidental: -1 },
    { letter: 'E', accidental: 0 },
    { letter: 'F', accidental: 0 },
    { letter: 'F', accidental: 1 },
    { letter: 'G', accidental: 0 },
    { letter: 'A', accidental: -1 },
    { letter: 'A', accidental: 0 },
    { letter: 'B', accidental: -1 },
    { letter: 'B', accidental: 0 },
  ]

  const variationOptions = (chart: Chart, tempoBpm: number): VariationOptions => ({
    fills: variationFills,
    countInBars: variationCountInBars,
    humanize: variationHumanize,
    density: variationDensity,
    endings: variationEndings,
    swingFeel: variationSwingFeel,
    seed: seedFromString(chart.id),
    tempoBpm,
  })

  const activeStyle = (chart: Chart, tempoBpm: number): StyleEngine =>
    createMutedStyle(
      createLeveledStyle(
        createGuideMelodyStyle(
          createVariedStyle(createStyleById(styleId), variationOptions(chart, tempoBpm)),
        ),
        voiceLevels,
      ),
      voiceEnabled,
    )

  const voiceToggleLabel = (voice: StyleVoice): string =>
    voice === 'bass'
      ? 'Bass'
      : voice === 'piano'
        ? 'Piano'
        : voice === 'drums'
          ? 'Drums'
          : 'Guide'

  const renderShell = (): void => {
    root.innerHTML = `
      <div class="app">
        <header class="header">
          <div class="brand">
            <h1 class="brand__name">Autocomp</h1>
            <span class="brand__tag">automatic accompaniment</span>
          </div>
          <div class="header__meta" title="Built ${APP_BUILD_TIME}">v${APP_VERSION}</div>
        </header>

        <main class="main">
          <section class="panel" aria-labelledby="chart-heading">
            <h2 id="chart-heading" class="panel__title">Chart</h2>
            <p class="panel__copy">
              Chords first — press Play below. Turn on Edit when you want to change the chart.
            </p>
            <div class="chart-stage" role="group" aria-label="Chord chart" id="chart-stage">
              ${chartStageInner(editor)}
            </div>
          </section>

          <section class="panel" aria-labelledby="library-heading">
            <details class="panel-fold" open>
              <summary class="panel-fold__summary" data-preserve-edit>
                <h2 id="library-heading" class="panel__title">Library</h2>
              </summary>
              <p class="panel__copy">
                Pick a tune, then Play. Practice is the default shelf; Songs and Generate are one tap away.
              </p>
              <div id="library-controls-host">
                ${libraryControlsHtml(library)}
              </div>
              <div id="library-results">
                ${libraryListHtml(library, TUNE_LIBRARY)}
              </div>
              <h3 class="panel__subtitle">Saved on this device</h3>
              <div id="saved-results">
                ${savedListHtml(savedCharts)}
              </div>
            </details>
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
              aria-label="Play or stop (Space)"
              title="Play / stop (Space)"
              aria-pressed="false"
            >
              <span aria-hidden="true">Play</span>
            </button>
            <button type="button" class="btn" id="tempo-down" aria-label="Decrease tempo ([ or -)" title="Tempo −10 ([ or -)">−10</button>
            <button type="button" class="btn" id="tempo-up" aria-label="Increase tempo (], =, or +)" title="Tempo +10 (], =, or +)">+10</button>
            <button type="button" class="btn" id="tempo-tap" aria-label="Tap tempo (T)" title="Tap tempo (T)">Tap</button>
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
    <div class="chart-mode">
      <label class="sr-only" for="title-input">Chart title</label>
      <input
        id="title-input"
        class="chart-stage__title-input"
        type="text"
        value="${escapeAttr(state.chart.title)}"
        spellcheck="false"
        ${chartEditMode ? '' : 'readonly'}
      />
      <button
        type="button"
        class="btn chart-mode__toggle"
        id="chart-edit-toggle"
        aria-pressed="${chartEditMode}"
        aria-label="Edit mode"
        title="${chartEditMode ? 'Turn off edit mode' : 'Turn on edit mode'}"
      >Edit mode</button>
    </div>
    <div class="bars" id="bars">
      ${renderEditableBars(state)}
    </div>
    <p class="chart-error" id="chart-error" role="status">${escapeHtml(state.error ?? persistStatus)}</p>
    <details class="chart-more"${chartMoreOpen ? ' open' : ''}>
      <summary class="chart-more__summary" data-preserve-edit>Settings</summary>
      <div class="chart-toolbar">
      ${
        chartEditMode
          ? `<button type="button" class="btn" id="edit-chord">Edit chord</button>
      <button type="button" class="btn" id="add-bar">Add bar</button>
      <button type="button" class="btn" id="remove-bar">Remove bar</button>`
          : ''
      }
      ${
        chartEditMode
          ? `      <label class="style-picker form-editor" for="form-input" title="Space-separated section ids (e.g. A A B A)">
        <span class="style-picker__label">Form</span>
        <input
          id="form-input"
          class="style-picker__select form-editor__input"
          type="text"
          value="${escapeAttr(formDraftString(state.chart))}"
          spellcheck="false"
          autocomplete="off"
          aria-label="Form order (space-separated section ids)"
        />
      </label>
      <button
        type="button"
        class="btn"
        id="form-move-earlier"
        title="Move the selected form slot earlier"
        aria-label="Move form slot earlier"
        ${state.chart.form.length < 2 ? ' disabled' : ''}
      >Form ↑</button>
      <button
        type="button"
        class="btn"
        id="form-move-later"
        title="Move the selected form slot later"
        aria-label="Move form slot later"
        ${state.chart.form.length < 2 ? ' disabled' : ''}
      >Form ↓</button>
      <button type="button" class="btn" id="add-section" title="Append a new empty section to the form">Add section</button>
      <label
        class="style-picker form-editor"
        for="section-label-input"
        title="Rename the section that owns the selected bar"
      >
        <span class="style-picker__label">Section</span>
        <input
          id="section-label-input"
          class="style-picker__select form-editor__input"
          type="text"
          value="${escapeAttr(selectedSectionLabel(state))}"
          data-section-id="${escapeAttr(selectedSectionId(state) ?? '')}"
          spellcheck="false"
          autocomplete="off"
          aria-label="Selected section label"
        />
      </label>
      <button
        type="button"
        class="btn"
        id="remove-section"
        title="Delete the section that owns the selected bar"
        ${state.chart.sections.length <= 1 ? ' disabled' : ''}
      >Delete section</button>`
          : ''
      }
      <button type="button" class="btn" id="save-chart">Save</button>
      <button type="button" class="btn" id="export-chart">Export JSON</button>
      <button type="button" class="btn" id="export-midi">Export MIDI</button>
      <button type="button" class="btn" id="export-wav"${wavExporting ? ' disabled' : ''}>Export WAV</button>
      ${
        chartEditMode
          ? `<label class="btn chart-toolbar__file">
        Import
        <input id="import-chart" class="sr-only" type="file" accept="application/json,.json" />
      </label>`
          : ''
      }
      <label class="style-picker" for="style-select">
        <span class="style-picker__label">Style</span>
        <select id="style-select" class="style-picker__select" aria-label="Backing style">
          ${STYLE_PACK.map(
            (style) =>
              `<option value="${style.id}"${style.id === styleId ? ' selected' : ''}>${escapeHtml(style.label)}</option>`,
          ).join('')}
        </select>
      </label>
      <div class="variation-toggles" role="group" aria-label="Variation">
        <label class="variation-toggle">
          <input type="checkbox" id="var-fills"${variationFills ? ' checked' : ''} />
          <span>Fills</span>
        </label>
        <label class="style-picker" for="var-count-in" title="Metronome bars before the form">
          <span class="style-picker__label">Count-in</span>
          <select id="var-count-in" class="style-picker__select" aria-label="Count-in length">
            ${COUNT_IN_BAR_OPTIONS.map((bars) => {
              const label = bars === 0 ? 'Off' : bars === 1 ? '1 bar' : `${bars} bars`
              return `<option value="${bars}"${bars === variationCountInBars ? ' selected' : ''}>${label}</option>`
            }).join('')}
          </select>
        </label>
        <label class="variation-toggle" title="Audible click on every beat (count-in always clicks). Shortcut: M">
          <input type="checkbox" id="var-metronome"${metronomeEnabled ? ' checked' : ''} />
          <span>Click</span>
        </label>
        <label class="style-picker" for="var-click-sub" title="Metronome subdivision (Beat or 8th)">
          <span class="style-picker__label">Subdiv</span>
          <select id="var-click-sub" class="style-picker__select" aria-label="Click subdivision">
            ${CLICK_SUBDIVISION_OPTIONS.map(
              (opt) =>
                `<option value="${opt.id}"${opt.id === clickSubdivision ? ' selected' : ''}>${escapeHtml(opt.label)}</option>`,
            ).join('')}
          </select>
        </label>
        <label
          class="style-picker style-picker--swing"
          for="var-click-level"
          title="Click / count-in volume"
        >
          <span class="style-picker__label">Click lvl</span>
          <input
            type="range"
            id="var-click-level"
            class="style-picker__range"
            min="0"
            max="100"
            step="1"
            value="${Math.round(clickLevel * 100)}"
            aria-label="Click volume"
          />
          <span class="style-picker__value" id="var-click-level-readout" aria-live="polite">${Math.round(clickLevel * 100)}</span>
        </label>
        <label class="variation-toggle">
          <input type="checkbox" id="var-humanize"${variationHumanize ? ' checked' : ''} />
          <span>Humanize</span>
        </label>
        <label class="variation-toggle" title="Penultimate fill and held last bar at form end">
          <input type="checkbox" id="var-endings"${variationEndings ? ' checked' : ''} />
          <span>Ending</span>
        </label>
        <label class="variation-toggle" title="Keep the sounding bar centered while playing">
          <input type="checkbox" id="var-center-playhead"${centerPlayhead ? ' checked' : ''} />
          <span>Center</span>
        </label>
        <label class="variation-toggle" title="${
          followSupported
            ? 'Listen on the mic and seek accompaniment to matching chart chords'
            : 'Microphone not available in this browser'
        }">
          <input type="checkbox" id="var-follow"${followEnabled ? ' checked' : ''}${
            followSupported ? '' : ' disabled'
          } />
          <span>Follow</span>
        </label>
        <label class="style-picker" for="var-density" title="Comp density (D to cycle)">
          <span class="style-picker__label">Density</span>
          <select id="var-density" class="style-picker__select" aria-label="Comp density (D to cycle)">
            ${COMP_DENSITY_OPTIONS.map(
              (opt) =>
                `<option value="${opt.id}"${opt.id === variationDensity ? ' selected' : ''}>${escapeHtml(opt.label)}</option>`,
            ).join('')}
          </select>
        </label>
        <label
          class="style-picker style-picker--swing"
          for="var-swing"
          title="Straight (0) → triplet (~67) → hard shuffle (100)"
        >
          <span class="style-picker__label">Swing</span>
          <input
            type="range"
            id="var-swing"
            class="style-picker__range"
            min="0"
            max="100"
            step="1"
            value="${variationSwingFeel}"
            aria-label="Swing feel"
          />
          <span class="style-picker__value" id="var-swing-readout" aria-live="polite">${variationSwingFeel}</span>
        </label>
      </div>
      <div class="variation-toggles voice-mix" role="group" aria-label="Voices">
        ${STYLE_VOICES.map((voice) => {
          const pct = Math.round(voiceLevels[voice] * 100)
          return `
        <div class="voice-mix__row">
          <label class="variation-toggle" title="Uncheck to mute ${voiceToggleLabel(voice).toLowerCase()}">
            <input type="checkbox" id="voice-${voice}"${voiceEnabled[voice] ? ' checked' : ''} />
            <span>${voiceToggleLabel(voice)}</span>
          </label>
          <label class="voice-mix__level" for="voice-level-${voice}" title="${voiceToggleLabel(voice)} volume">
            <input
              type="range"
              id="voice-level-${voice}"
              class="style-picker__range voice-mix__range"
              min="0"
              max="100"
              step="1"
              value="${pct}"
              aria-label="${voiceToggleLabel(voice)} volume"
            />
            <span class="style-picker__value" id="voice-level-${voice}-readout" aria-live="polite">${pct}</span>
          </label>
        </div>`
        }).join('')}
      </div>
      <div class="generate-controls" role="group" aria-label="Practice loop">
        <label class="variation-toggle" title="Loop form bars A through B while playing">
          <input type="checkbox" id="loop-enable"${practiceLoop.enabled ? ' checked' : ''} />
          <span>Loop</span>
        </label>
        <button type="button" class="btn" id="loop-set-a" title="Set loop start to the selected bar">
          A=${practiceLoop.startBar}
        </button>
        <button type="button" class="btn" id="loop-set-b" title="Set loop end to the selected bar">
          B=${practiceLoop.endBar}
        </button>
      </div>
      ${
        chartEditMode
          ? `      <div class="generate-controls" role="group" aria-label="Generate progression">
        <label class="style-picker" for="generate-kind">
          <span class="style-picker__label">Generate</span>
          <select id="generate-kind" class="style-picker__select" aria-label="Progression kind">
            ${PROGRESSION_KINDS.map((kind) => {
              const desc = PROGRESSION_CATALOG.find((p) => p.id === kind)!
              return `<option value="${kind}"${kind === generateKind ? ' selected' : ''}>${escapeHtml(desc.label)}</option>`
            }).join('')}
          </select>
        </label>
        <label class="style-picker" for="generate-key">
          <span class="style-picker__label">Key</span>
          <select id="generate-key" class="style-picker__select" aria-label="Progression key">
            ${GENERATE_KEYS.map((key) => {
              const label = formatRoot(key)
              const selected = formatRoot(generateKey) === label
              return `<option value="${escapeAttr(label)}"${selected ? ' selected' : ''}>${escapeHtml(label)}</option>`
            }).join('')}
          </select>
        </label>
        <label
          class="style-picker"
          for="generate-bars"
          title="Bar count for Full random and Generate-shelf engines"
        >
          <span class="style-picker__label">Bars</span>
          <select id="generate-bars" class="style-picker__select" aria-label="Generate bar count">
            ${([8, 12, 16] as const)
              .map(
                (n) =>
                  `<option value="${n}"${n === generateBarCount ? ' selected' : ''}>${n}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label
          class="style-picker"
          for="generate-density"
          title="Chords per bar for Full random (ignored by other generators)"
        >
          <span class="style-picker__label">Density</span>
          <select id="generate-density" class="style-picker__select" aria-label="Random chart chord density">
            <option value="1"${generateChordDensity === 1 ? ' selected' : ''}>1 / bar</option>
            <option value="2"${generateChordDensity === 2 ? ' selected' : ''}>2 / bar</option>
          </select>
        </label>
        <label
          class="style-picker"
          for="generate-mode"
          title="Major/minor bias for Full random (ignored by other generators)"
        >
          <span class="style-picker__label">Mode</span>
          <select id="generate-mode" class="style-picker__select" aria-label="Random chart major or minor bias">
            <option value="0.85"${generateMajorBias === 0.85 ? ' selected' : ''}>Major</option>
            <option value="0.5"${generateMajorBias === 0.5 ? ' selected' : ''}>Mix</option>
            <option value="0.15"${generateMajorBias === 0.15 ? ' selected' : ''}>Minor</option>
          </select>
        </label>
        <label
          class="style-picker"
          for="generate-iiv"
          title="ii–V gravity for Full random (ignored by other generators)"
        >
          <span class="style-picker__label">ii–V</span>
          <select id="generate-iiv" class="style-picker__select" aria-label="Random chart prefer ii V">
            <option value="on"${generatePreferIiV ? ' selected' : ''}>On</option>
            <option value="off"${!generatePreferIiV ? ' selected' : ''}>Off</option>
          </select>
        </label>
        <button type="button" class="btn" id="generate-run">New chart</button>
      </div>
      <div class="generate-controls" role="group" aria-label="Reharmonize selection">
        <label class="style-picker" for="reharm-mode">
          <span class="style-picker__label">Reharm</span>
          <select id="reharm-mode" class="style-picker__select" aria-label="Reharmonization">
            ${REHARM_CATALOG.map(
              (mode) =>
                `<option value="${mode.id}"${mode.id === reharmMode ? ' selected' : ''}>${escapeHtml(mode.label)}</option>`,
            ).join('')}
          </select>
        </label>
        <button type="button" class="btn" id="reharm-run">Apply to bar</button>
      </div>
      <div class="generate-controls" role="group" aria-label="Transpose chart">
        <span class="style-picker__label">Transpose</span>
        <span class="transpose-key" id="transpose-key" aria-live="polite">${escapeHtml(formatRoot(state.chart.key))}</span>
        <button type="button" class="btn" id="transpose-down" aria-label="Transpose down one semitone">−1</button>
        <button type="button" class="btn" id="transpose-up" aria-label="Transpose up one semitone">+1</button>
        <label class="style-picker" for="transpose-target" data-preserve-edit>
          <span class="style-picker__label">To</span>
          <select id="transpose-target" class="style-picker__select" aria-label="Target key" data-preserve-edit>
            ${GENERATE_KEYS.map((key) => {
              const label = formatRoot(key)
              const selected = rootToPc(key) === rootToPc(state.chart.key)
              return `<option value="${escapeAttr(label)}"${selected ? ' selected' : ''}>${escapeHtml(label)}</option>`
            }).join('')}
          </select>
        </label>
        <button type="button" class="btn" id="transpose-to-key">Go</button>
        <button
          type="button"
          class="btn"
          id="respell-chart"
          title="Flip enharmonic spelling (F♯↔G♭) without changing pitch"
          aria-label="Respell chart enharmonically"
        >♯↔♭</button>
      </div>`
          : ''
      }
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
    </details>
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

  const refreshLibrary = (opts: { controls?: boolean } = {}): void => {
    if (opts.controls) {
      const host = root.querySelector('#library-controls-host')
      if (host) {
        host.innerHTML = libraryControlsHtml(library)
        bindLibraryControls()
        host
          .querySelector<HTMLButtonElement>(`[data-library-shelf="${library.shelf}"]`)
          ?.focus()
      }
    }
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

  const syncPracticeLoop = (next: PracticeLoop = practiceLoop): void => {
    const total = expandChartBars(editor.chart).length
    practiceLoop = normalizePracticeLoop(next, total)
    transport?.setPracticeLoop(practiceLoop)
    const aBtn = root.querySelector('#loop-set-a')
    const bBtn = root.querySelector('#loop-set-b')
    if (aBtn) aBtn.textContent = `A=${practiceLoop.startBar}`
    if (bBtn) bBtn.textContent = `B=${practiceLoop.endBar}`
    const enable = root.querySelector<HTMLInputElement>('#loop-enable')
    if (enable) enable.checked = practiceLoop.enabled
  }

  const setEditor = (next: ChartEditorState): void => {
    editor = next
    refreshChart()
    // Bar add/remove can shrink the form; keep A–B labels in range.
    syncPracticeLoop()
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
    syncPracticeLoop(practiceLoop)
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

  const shufflePracticeTune = (): void => {
    const result = shufflePractice(TUNE_LIBRARY, {
      filter: {
        query: library.query,
        tags: library.tag ? [library.tag] : [],
      },
      entropy: Date.now(),
    })
    if (!result) {
      setPersistStatus('No practice charts match the current filters.')
      return
    }
    applyChart(result.chart, { styleId: result.tune.styleId, activeTuneId: result.tune.id })
    applyDensity(result.density)
    const bits = [
      result.tune.title,
      result.transposeSemitones ? `+${result.transposeSemitones}` : null,
      result.trimmed ? 'trim' : null,
      result.density,
    ].filter(Boolean)
    setPersistStatus(`Shuffled → ${bits.join(' · ')}.`)
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
  /** Playhead scroll arming (re-scrolls on beat-1 wrap for A–B loops). */
  let playheadScroll: PlayheadScrollMemory = INITIAL_PLAYHEAD_SCROLL

  const renderTransport = (state: TransportState): void => {
    if (!playToggle || !playLabel || !tempoReadout || !barReadout || !beatReadout || !statusDot || !sessionStatus) {
      return
    }
    playToggle.setAttribute('aria-pressed', String(state.playing))
    playLabel.textContent = state.playing ? 'Stop' : 'Play'
    tempoReadout.textContent = String(state.tempoBpm)
    barReadout.textContent = String(state.bar)
    beatReadout.textContent = String(state.beat)
    statusDot.classList.toggle('status-dot--live', state.playing || followSnapshot.status === 'listening')
    const desc = getStyleDescriptor(state.styleId ?? styleId)
    let label = state.playing
      ? `${desc.label} running — ${desc.blurb}.`
      : state.audioReady
        ? `Ready — press Play for ${desc.label}.`
        : `Ready — tap Play to unlock audio (required on iOS/Safari) and start ${desc.label}.`
    if (followEnabled && followSnapshot.status !== 'idle') {
      label = `${label} Follow: ${followSnapshot.message}`
    }
    sessionStatus.lastChild!.textContent = ` ${label}`
    // Live playhead / stopped “play from here” marker on the chart grid.
    const barsRoot = root.querySelector('.bars')
    if (barsRoot) {
      const playheadBarIndex =
        state.playing && state.bar >= 1 ? state.bar - 1 : null
      const scrollDecision = nextPlayheadScroll(
        playheadScroll,
        playheadBarIndex,
        state.beat,
        state.playing,
      )
      playheadScroll = scrollDecision.memory
      const reduceMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      syncBarPlayhead(barsRoot, {
        selectedBarIndex: editor.selectedBarIndex,
        playheadBarIndex,
        playing: state.playing,
        scrollIntoView: scrollDecision.scroll,
        centerPlayhead,
        reduceMotion,
      })
    }
  }

  const stopFollow = (): void => {
    followEngine?.stop()
    followEngine = null
    followSnapshot = {
      match: null,
      locked: false,
      status: 'idle',
      message: 'Follow off',
    }
  }

  const startFollow = async (): Promise<void> => {
    stopFollow()
    try {
      const ctx = getAudioContext()
      await unlockAudioContext(ctx)
      followEngine = new FollowEngine({
        getChart: () => editor.chart,
        getCurrentBarIndex: () => {
          const state = transport?.getState()
          const bar = state?.playing ? state.bar : editor.selectedBarIndex + 1
          // Transport uses 0 during count-in; clamp to 0-based form index.
          return Math.max(0, bar - 1)
        },
        audioContext: ctx,
        onChange: (snapshot) => {
          followSnapshot = snapshot
          if (transport) renderTransport(transport.getState())
          else if (sessionStatus?.lastChild) {
            sessionStatus.lastChild.textContent = ` Follow: ${snapshot.message}`
          }
        },
        onSeekBar: (formBar) => {
          if (transport?.getState().playing) {
            transport.seekToFormBar(formBar)
          } else {
            setEditor(selectBar(editor, formBar - 1))
          }
        },
      })
      await followEngine.start()
    } catch {
      followEnabled = false
      followSnapshot = {
        match: null,
        locked: false,
        status: 'error',
        message: 'Could not start Follow.',
      }
      const toggle = root.querySelector<HTMLInputElement>('#var-follow')
      if (toggle) toggle.checked = false
      setPersistStatus('Could not start Follow.')
    }
  }

  const syncTransportStyle = (opts: { stopSources?: boolean } = {}): void => {
    if (!transport) return
    const tempoBpm = transport.getState().tempoBpm
    const styleOpts =
      opts.stopSources === undefined ? undefined : { stopSources: opts.stopSources }
    transport.setStyle(activeStyle(editor.chart, tempoBpm), styleOpts)
    transport.setCountInBars(variationCountInBars)
  }

  const applyStyle = (nextId: StyleId, opts: { adjustTempo: boolean }): void => {
    styleId = nextId
    // Only reset Generate kind / swing when the user changes the style picker
    // (adjustTempo), not when applyChart re-applies the same style after Generate.
    if (opts.adjustTempo) {
      generateKind = styleGenerateHints(nextId).defaultKind
      const kindSelect = root.querySelector<HTMLSelectElement>('#generate-kind')
      if (kindSelect) kindSelect.value = generateKind
    }
    const desc = getStyleDescriptor(nextId)
    if (opts.adjustTempo) {
      if (transport) transport.setTempo(desc.suggestedTempoBpm)
      variationSwingFeel = desc.defaultSwingFeel
      const swingInput = root.querySelector<HTMLInputElement>('#var-swing')
      const swingReadout = root.querySelector<HTMLElement>('#var-swing-readout')
      if (swingInput) swingInput.value = String(variationSwingFeel)
      if (swingReadout) swingReadout.textContent = String(variationSwingFeel)
      persistPracticePrefs()
    }
    // Style picker changes should cut the previous engine's ringing notes.
    syncTransportStyle({ stopSources: true })
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
    const tempoTap = root.querySelector<HTMLButtonElement>('#tempo-tap')
    tempoReadout = root.querySelector('#tempo-readout')
    barReadout = root.querySelector('#bar-readout')
    beatReadout = root.querySelector('#beat-readout')
    statusDot = root.querySelector('#status-dot')
    sessionStatus = root.querySelector('#session-status')

    const desc = getStyleDescriptor(styleId)
    const tempoBpm = editor.chart.defaultTempoBpm || desc.suggestedTempoBpm
    transport?.dispose()
    const totalBars = expandChartBars(editor.chart).length
    practiceLoop = normalizePracticeLoop(practiceLoop, totalBars)
    transport = new TransportController({
      onChange: renderTransport,
      beatsPerBar: editor.chart.timeSignature.numerator,
      style: activeStyle(editor.chart, tempoBpm),
      getChart: () => editor.chart,
      metronomeEnabled,
      clickLevel,
      clickSubdivision,
      midiSink,
      countInBars: variationCountInBars,
      practiceLoop,
    })
    transport.setTempo(tempoBpm)

    playToggle?.addEventListener('click', () => {
      // Start from the selected chart bar (iReal-like); Stop still via toggle.
      transport?.toggle({ formBar: editor.selectedBarIndex + 1 })
    })
    tempoDown?.addEventListener('click', () => {
      nudgeTempo(-10)
    })
    tempoUp?.addEventListener('click', () => {
      nudgeTempo(10)
    })
    tempoTap?.addEventListener('click', () => {
      applyTapTempo()
    })
  }

  const nudgeTempo = (delta: number): void => {
    if (!transport) return
    transport.setTempo(transport.getState().tempoBpm + delta)
    syncTransportStyle({ stopSources: false })
    setPersistStatus(`Tempo ${transport.getState().tempoBpm} BPM.`)
  }

  const applyDensity = (density: CompDensity): void => {
    variationDensity = density
    const select = root.querySelector<HTMLSelectElement>('#var-density')
    if (select) select.value = variationDensity
    syncTransportStyle({ stopSources: false })
    persistPracticePrefs()
    const label =
      COMP_DENSITY_OPTIONS.find((o) => o.id === variationDensity)?.label ?? variationDensity
    setPersistStatus(`Density ${label}.`)
  }

  const cycleDensity = (): void => {
    applyDensity(nextCompDensity(variationDensity))
  }

  const applyTapTempo = (): void => {
    if (!transport) return
    const bpm = tapTempo(tapTempoState, performance.now())
    if (bpm === null) {
      setPersistStatus('Tap again to set tempo…')
      return
    }
    transport.setTempo(bpm)
    syncTransportStyle({ stopSources: false })
    setPersistStatus(`Tempo ${bpm} BPM (tap).`)
  }

  const toggleMetronomeClick = (): void => {
    metronomeEnabled = !metronomeEnabled
    persistPracticePrefs()
    transport?.setMetronomeEnabled(metronomeEnabled)
    const input = root.querySelector<HTMLInputElement>('#var-metronome')
    if (input) input.checked = metronomeEnabled
    setPersistStatus(metronomeEnabled ? 'Click on.' : 'Click off.')
  }

  const bindLibraryItems = (): void => {
    root.querySelectorAll<HTMLButtonElement>('[data-tune-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.tuneId
        if (id) loadTune(id)
      })
    })
  }

  const bindLibraryControls = (): void => {
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
    root.querySelectorAll<HTMLButtonElement>('[data-library-shelf]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = button.dataset.libraryShelf
        if (!isLibraryShelfFilter(next) || next === library.shelf) return
        library = { ...library, shelf: next, tag: '', query: '' }
        refreshLibrary({ controls: true })
      })
    })
    root.querySelector<HTMLButtonElement>('[data-library-shuffle]')?.addEventListener('click', () => {
      shufflePracticeTune()
    })
  }

  const bindLibrary = (): void => {
    bindLibraryControls()
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
          if (chartEditMode && editor.selectedBarIndex === index && !editor.editing) {
            setEditor(beginEdit(editor))
          } else {
            setEditor(selectBar(editor, index))
          }
        })
        el.addEventListener('dblclick', () => {
          if (!chartEditMode) {
            setEditor(selectBar(editor, index))
            return
          }
          setEditor(beginEdit(selectBar(editor, index)))
        })
      }
    })

    root.querySelector('.chart-more')?.addEventListener('toggle', (event) => {
      chartMoreOpen = (event.currentTarget as HTMLDetailsElement).open
    })

    const toggleChartEditMode = (): void => {
      const next = !chartEditMode
      chartEditMode = next
      if (!next && editor.editing) setEditor(cancelEdit(editor))
      else refreshChart()
      setPersistStatus(next ? 'Edit mode on.' : 'View mode — turn on Edit mode to change chords.')
    }
    const editToggle = root.querySelector('#chart-edit-toggle')
    editToggle?.addEventListener('pointerdown', (event: Event) => {
      const pointer = event as PointerEvent
      if (pointer.button !== 0) return
      pointer.preventDefault()
      toggleChartEditMode()
    })
    editToggle?.addEventListener('click', (event: Event) => {
      const mouse = event as MouseEvent
      if (mouse.detail === 0) toggleChartEditMode()
    })

    root.querySelector('#edit-chord')?.addEventListener('click', () => {
      if (!chartEditMode) return
      setEditor(beginEdit(editor))
    })
    root.querySelector('#add-bar')?.addEventListener('click', () => {
      setEditor(addBarAfterSelection(editor))
    })
    root.querySelector('#remove-bar')?.addEventListener('click', () => {
      setEditor(removeSelectedBar(editor))
    })
    root.querySelector('#add-section')?.addEventListener('click', () => {
      const next = addSection(editor)
      setEditor(next)
      const added = next.chart.sections.at(-1)?.id
      setPersistStatus(added ? `Added section ${added}.` : 'Added section.')
    })
    const applyFormMove = (delta: -1 | 1): void => {
      const next = moveFormOccurrence(editor, delta)
      setEditor(next)
      if (next.error) setPersistStatus(next.error)
      else setPersistStatus(`Form ${next.chart.form.join('')}.`)
    }
    root.querySelector('#form-move-earlier')?.addEventListener('click', () => {
      applyFormMove(-1)
    })
    root.querySelector('#form-move-later')?.addEventListener('click', () => {
      applyFormMove(1)
    })
    const formInput = root.querySelector<HTMLInputElement>('#form-input')
    const commitForm = (opts: { deferRebuild?: boolean } = {}): void => {
      if (!formInput) return
      const next = setFormOrder(editor, formInput.value)
      if (next.error) {
        // Keep the draft in the input so the user can correct it.
        setPersistStatus(next.error)
        return
      }
      // Commit state immediately so a pending toolbar click (e.g. Delete)
      // does not race a deferred setEditor snapshot.
      editor = next
      const applyUi = (): void => {
        refreshChart()
        syncPracticeLoop()
        setPersistStatus(`Form ${editor.chart.form.join('')}.`)
      }
      // Defer DOM rebuild on blur so a pending click on another control can land.
      if (opts.deferRebuild) setTimeout(applyUi, 0)
      else applyUi()
    }
    formInput?.addEventListener('change', () => commitForm({ deferRebuild: true }))
    formInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        commitForm()
        formInput.blur()
      }
    })
    const sectionLabelInput = root.querySelector<HTMLInputElement>('#section-label-input')
    const commitSectionLabel = (opts: { deferRebuild?: boolean } = {}): void => {
      if (!sectionLabelInput) return
      const next = renameSelectedSection(editor, sectionLabelInput.value)
      if (next.error) {
        setPersistStatus(next.error)
        return
      }
      editor = next
      const applyUi = (): void => {
        refreshChart()
        syncPracticeLoop()
        setPersistStatus(`Section ${selectedSectionLabel(editor)}.`)
      }
      if (opts.deferRebuild) setTimeout(applyUi, 0)
      else applyUi()
    }
    sectionLabelInput?.addEventListener('change', () => commitSectionLabel({ deferRebuild: true }))
    sectionLabelInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        commitSectionLabel()
        sectionLabelInput.blur()
      }
    })
    root.querySelector('#remove-section')?.addEventListener('click', () => {
      const id = selectedSectionId(editor)
      const next = removeSelectedSection(editor)
      setEditor(next)
      if (next.error) setPersistStatus(next.error)
      else setPersistStatus(id ? `Deleted section ${id}.` : 'Deleted section.')
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
        const opts = variationOptions(editor.chart, tempoBpm)
        const bytes = chartToMidiBytes(editor.chart, activeStyle(editor.chart, tempoBpm), {
          tempoBpm,
          countInBars: opts.countInBars,
        })
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
      if (wavExporting) return
      void (async () => {
        wavExporting = true
        const button = root.querySelector<HTMLButtonElement>('#export-wav')
        if (button) button.disabled = true
        const chart = editor.chart
        const tempoBpm = transport?.getState().tempoBpm ?? chart.defaultTempoBpm
        const opts = variationOptions(chart, tempoBpm)
        const style = activeStyle(chart, tempoBpm)
        setPersistStatus('Rendering WAV…')
        try {
          const bytes = await chartToWavBytes(chart, style, {
            tempoBpm,
            countInBars: opts.countInBars,
          })
          const blob = wavToDownloadBlob(bytes)
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = wavDownloadFilename(chart)
          anchor.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          setPersistStatus(`Exported ${wavDownloadFilename(chart)}.`)
        } catch {
          setPersistStatus('Could not export WAV.')
        } finally {
          wavExporting = false
          const current = root.querySelector<HTMLButtonElement>('#export-wav')
          if (current) current.disabled = false
        }
      })()
    })
    const bindVariationToggle = (
      id: string,
      apply: (checked: boolean) => void,
    ): void => {
      root.querySelector<HTMLInputElement>(id)?.addEventListener('change', (event) => {
        apply((event.target as HTMLInputElement).checked)
        syncTransportStyle({ stopSources: false })
      })
    }
    bindVariationToggle('#var-fills', (checked) => {
      variationFills = checked
      persistPracticePrefs()
    })
    root.querySelector<HTMLSelectElement>('#var-count-in')?.addEventListener('change', (event) => {
      variationCountInBars = clampCountInBars(Number((event.target as HTMLSelectElement).value))
      syncTransportStyle({ stopSources: false })
      persistPracticePrefs()
    })
    root.querySelector<HTMLInputElement>('#var-metronome')?.addEventListener('change', (event) => {
      metronomeEnabled = (event.target as HTMLInputElement).checked
      transport?.setMetronomeEnabled(metronomeEnabled)
      persistPracticePrefs()
    })
    root.querySelector<HTMLSelectElement>('#var-click-sub')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value
      if (!isClickSubdivision(value)) return
      clickSubdivision = value
      transport?.setClickSubdivision(clickSubdivision)
      persistPracticePrefs()
    })
    const clickLevelInput = root.querySelector<HTMLInputElement>('#var-click-level')
    const clickLevelReadout = root.querySelector<HTMLElement>('#var-click-level-readout')
    clickLevelInput?.addEventListener('input', (event) => {
      const raw = Number((event.target as HTMLInputElement).value)
      clickLevel = clampClickLevel(
        Number.isFinite(raw) ? raw / 100 : DEFAULT_CLICK_LEVEL,
      )
      if (clickLevelReadout) clickLevelReadout.textContent = String(Math.round(clickLevel * 100))
      transport?.setClickLevel(clickLevel)
      persistPracticePrefs()
    })
    bindVariationToggle('#var-humanize', (checked) => {
      variationHumanize = checked
      persistPracticePrefs()
    })
    bindVariationToggle('#var-endings', (checked) => {
      variationEndings = checked
      persistPracticePrefs()
    })
    root.querySelector<HTMLInputElement>('#var-center-playhead')?.addEventListener('change', (event) => {
      centerPlayhead = (event.target as HTMLInputElement).checked
      persistPracticePrefs()
    })
    for (const voice of STYLE_VOICES) {
      root.querySelector<HTMLInputElement>(`#voice-${voice}`)?.addEventListener('change', (event) => {
        const checked = (event.target as HTMLInputElement).checked
        voiceEnabled = { ...voiceEnabled, [voice]: checked }
        // Keep transport running; only drop future realizations for unmuted peers.
        syncTransportStyle({ stopSources: false })
        persistPracticePrefs()
        // Immediately cut the muted voice's ringing audio + pending WebMIDI.
        if (!checked) transport?.silenceVoices([voice])
      })
      const levelInput = root.querySelector<HTMLInputElement>(`#voice-level-${voice}`)
      const levelReadout = root.querySelector<HTMLElement>(`#voice-level-${voice}-readout`)
      levelInput?.addEventListener('input', (event) => {
        const raw = Number((event.target as HTMLInputElement).value)
        const pct = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 100
        const prev = voiceLevels[voice]
        voiceLevels = { ...voiceLevels, [voice]: pct / 100 }
        if (levelReadout) levelReadout.textContent = String(pct)
        syncTransportStyle({ stopSources: false })
        persistPracticePrefs()
        // Silence ringing notes when the fader hits zero (same as mute).
        if (prev > 0 && voiceLevels[voice] <= 0) transport?.silenceVoices([voice])
      })
    }
    root.querySelector<HTMLInputElement>('#loop-enable')?.addEventListener('change', (event) => {
      syncPracticeLoop({
        ...practiceLoop,
        enabled: (event.target as HTMLInputElement).checked,
      })
    })
    root.querySelector('#loop-set-a')?.addEventListener('click', () => {
      const selectedBar = editor.selectedBarIndex + 1
      syncPracticeLoop({
        ...practiceLoop,
        startBar: selectedBar,
        endBar: Math.max(practiceLoop.endBar, selectedBar),
      })
      setPersistStatus(`Loop A = bar ${practiceLoop.startBar}.`)
    })
    root.querySelector('#loop-set-b')?.addEventListener('click', () => {
      const selectedBar = editor.selectedBarIndex + 1
      syncPracticeLoop({
        ...practiceLoop,
        startBar: Math.min(practiceLoop.startBar, selectedBar),
        endBar: selectedBar,
      })
      setPersistStatus(`Loop B = bar ${practiceLoop.endBar}.`)
    })
    root.querySelector<HTMLSelectElement>('#var-density')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value as CompDensity
      if (COMP_DENSITY_OPTIONS.some((o) => o.id === value)) {
        variationDensity = value
        syncTransportStyle({ stopSources: false })
        persistPracticePrefs()
      }
    })
    const swingInput = root.querySelector<HTMLInputElement>('#var-swing')
    const swingReadout = root.querySelector<HTMLElement>('#var-swing-readout')
    swingInput?.addEventListener('input', (event) => {
      const raw = Number((event.target as HTMLInputElement).value)
      variationSwingFeel = Number.isFinite(raw)
        ? Math.min(100, Math.max(0, Math.round(raw)))
        : DEFAULT_SWING_FEEL
      if (swingReadout) swingReadout.textContent = String(variationSwingFeel)
      syncTransportStyle({ stopSources: false })
      persistPracticePrefs()
    })
    root.querySelector<HTMLInputElement>('#var-follow')?.addEventListener('change', (event) => {
      const checked = (event.target as HTMLInputElement).checked
      followEnabled = checked
      if (checked) {
        void startFollow()
      } else {
        stopFollow()
        if (transport) renderTransport(transport.getState())
      }
    })
    root.querySelector<HTMLSelectElement>('#generate-kind')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value as ProgressionKind
      if (PROGRESSION_KINDS.includes(value)) generateKind = value
    })
    root.querySelector<HTMLSelectElement>('#generate-key')?.addEventListener('change', (event) => {
      const parsed = parseRoot((event.target as HTMLSelectElement).value)
      if (parsed) generateKey = parsed
    })
    root.querySelector<HTMLSelectElement>('#generate-bars')?.addEventListener('change', (event) => {
      const n = Number((event.target as HTMLSelectElement).value)
      if (n === 8 || n === 12 || n === 16) {
        generateBarCount = n
        setPreferredEngineLength(n)
      }
    })
    root.querySelector<HTMLSelectElement>('#generate-density')?.addEventListener('change', (event) => {
      const n = Number((event.target as HTMLSelectElement).value)
      if (n === 1 || n === 2) generateChordDensity = n
    })
    root.querySelector<HTMLSelectElement>('#generate-mode')?.addEventListener('change', (event) => {
      const n = Number((event.target as HTMLSelectElement).value)
      if (n === 0.85 || n === 0.5 || n === 0.15) generateMajorBias = n
    })
    root.querySelector<HTMLSelectElement>('#generate-iiv')?.addEventListener('change', (event) => {
      generatePreferIiV = (event.target as HTMLSelectElement).value !== 'off'
    })
    root.querySelector('#generate-run')?.addEventListener('click', () => {
      try {
        const chart = generateProgression({
          kind: generateKind,
          key: generateKey,
          styleId,
          barCount: generateBarCount,
          chordDensity: generateChordDensity,
          majorBias: generateMajorBias,
          preferIiV: generatePreferIiV,
        })
        applyChart(chart, { styleId, activeTuneId: chart.id })
        setPersistStatus(`Generated “${chart.title}”.`)
      } catch {
        setPersistStatus('Could not generate progression.')
      }
    })
    root.querySelector<HTMLSelectElement>('#reharm-mode')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value as ReharmMode
      if (REHARM_CATALOG.some((m) => m.id === value)) reharmMode = value
    })
    root.querySelector('#reharm-run')?.addEventListener('click', () => {
      try {
        const barIndex = editor.selectedBarIndex
        const next = reharmBar(editor.chart, barIndex, reharmMode)
        const changed =
          JSON.stringify(next.sections) !== JSON.stringify(editor.chart.sections)
        setEditor(selectBar(createEditorState(next), barIndex))
        syncTransportStyle({ stopSources: false })
        setPersistStatus(
          changed
            ? `Reharmonized bar ${barIndex + 1}.`
            : 'Selected bar is not a dominant — nothing to reharm.',
        )
      } catch {
        setPersistStatus('Could not reharmonize bar.')
      }
    })
    const applyTranspose = (semitones: number): void => {
      try {
        // Commit any in-progress chord edit first (pointerdown can interrupt blur).
        const base = editor.editing ? commitEdit(editor) : editor
        if (editor.editing && base.error) {
          setEditor(base)
          return
        }
        const next = transposeChart(base.chart, semitones)
        setEditor(selectBar(createEditorState(next), base.selectedBarIndex))
        syncTransportStyle({ stopSources: false })
        setPersistStatus(`Transposed to ${formatRoot(next.key)}.`)
      } catch {
        setPersistStatus('Could not transpose chart.')
      }
    }
    // pointerdown fires before input blur (pointer); click with detail===0 covers keyboard.
    const bindTranspose = (id: string, semitones: number): void => {
      const button = root.querySelector(id)
      button?.addEventListener('pointerdown', (event: Event) => {
        const pointer = event as PointerEvent
        if (pointer.button !== 0) return
        pointer.preventDefault()
        applyTranspose(semitones)
      })
      button?.addEventListener('click', (event: Event) => {
        const mouse = event as MouseEvent
        if (mouse.detail === 0) applyTranspose(semitones)
      })
    }
    bindTranspose('#transpose-down', -1)
    bindTranspose('#transpose-up', 1)
    const applyTransposeToKey = (): void => {
      try {
        const base = editor.editing ? commitEdit(editor) : editor
        if (editor.editing && base.error) {
          setEditor(base)
          return
        }
        const select = root.querySelector<HTMLSelectElement>('#transpose-target')
        const target = select ? parseRoot(select.value) : null
        if (!target) {
          setPersistStatus('Pick a target key.')
          return
        }
        const next = transposeChartToKey(base.chart, target)
        setEditor(selectBar(createEditorState(next), base.selectedBarIndex))
        syncTransportStyle({ stopSources: false })
        setPersistStatus(`Transposed to ${formatRoot(next.key)}.`)
      } catch {
        setPersistStatus('Could not transpose chart.')
      }
    }
    const bindTransposeAction = (id: string, action: () => void): void => {
      const button = root.querySelector(id)
      button?.addEventListener('pointerdown', (event: Event) => {
        const pointer = event as PointerEvent
        if (pointer.button !== 0) return
        pointer.preventDefault()
        action()
      })
      button?.addEventListener('click', (event: Event) => {
        const mouse = event as MouseEvent
        if (mouse.detail === 0) action()
      })
    }
    bindTransposeAction('#transpose-to-key', applyTransposeToKey)
    const applyRespell = (): void => {
      try {
        const base = editor.editing ? commitEdit(editor) : editor
        if (editor.editing && base.error) {
          setEditor(base)
          return
        }
        // Flip opposite of the current key’s accidental preference.
        const preferSharps = !preferSharpsFromRoot(base.chart.key)
        const next = respellChart(base.chart, preferSharps)
        setEditor(selectBar(createEditorState(next), base.selectedBarIndex))
        syncTransportStyle({ stopSources: false })
        setPersistStatus(`Respelled with ${preferSharps ? 'sharps' : 'flats'} (${formatRoot(next.key)}).`)
      } catch {
        setPersistStatus('Could not respell chart.')
      }
    }
    bindTransposeAction('#respell-chart', applyRespell)
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
      if (!chartEditMode) return
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
    chordInput?.addEventListener('blur', (event: FocusEvent) => {
      if (!editor.editing) return
      const related = event.relatedTarget
      // Keep the draft when focus moves to transpose target (select rebuild would kill it).
      if (related instanceof Element && related.closest('[data-preserve-edit]')) return
      setEditor(commitEdit(editor))
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
    const inFormField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    if (inFormField) return
    // Let native <details>/<summary> toggle handle Space/Enter.
    if (target instanceof HTMLElement && target.tagName === 'SUMMARY') return
    // Let Enter activate focused buttons (toolbar, transport, bar cells).
    if (event.key === 'Enter' && target instanceof HTMLButtonElement) {
      return
    }

    const practice = practiceKeyAction(event.key, {
      inFormField: false,
      editing: editor.editing,
      spaceOnButton: target instanceof HTMLButtonElement,
      withModifier: event.ctrlKey || event.metaKey || event.altKey,
    })
    if (practice !== null) {
      // Prevent page scroll / browser search.
      event.preventDefault()
      const tempoDelta = practiceTempoDelta(practice, event.repeat)
      if (tempoDelta !== null) {
        nudgeTempo(tempoDelta)
        return
      }
      // Ignore key-repeat for non-tempo actions (Space, T, M, D, digits).
      if (event.repeat) return
      if (practice === 'toggle-play') {
        transport?.toggle({ formBar: editor.selectedBarIndex + 1 })
      } else if (practice === 'tap-tempo') {
        applyTapTempo()
      } else if (practice === 'toggle-click') {
        toggleMetronomeClick()
      } else if (practice === 'cycle-density') {
        cycleDensity()
      } else {
        const density = densityFromPracticeAction(practice)
        if (density) applyDensity(density)
      }
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
      if (!chartEditMode) return
      event.preventDefault()
      setEditor(beginEdit(editor))
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      if (!chartEditMode) return
      event.preventDefault()
      setEditor(removeSelectedBar(editor))
    }
  }

  window.addEventListener('keydown', onKeyDown)
  renderShell()

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    stopFollow()
    transport?.dispose()
    midiSink?.dispose()
    midiSink = null
  }
}

