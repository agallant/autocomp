import { APP_VERSION } from '../lib/version'
import { TransportController, type TransportState } from './transport'

/** Demo changes for the M0 chart placeholder (ii–V–I family). */
const DEMO_BARS = ['Dm7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7', 'Cmaj7'] as const

function barCells(): string {
  return DEMO_BARS.map(
    (chord, i) => `
      <div class="bar" data-bar="${i + 1}">
        <span class="bar__chord">${chord}</span>
        <span class="bar__beat">|</span>
      </div>`,
  ).join('')
}

export function mountApp(root: HTMLElement): () => void {
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
            Practice-ready chord charts with style-driven backing. This milestone ships the offline PWA shell;
            editable charts and audio styles land next.
          </p>
          <div class="chart-stage" role="group" aria-label="Demo chord chart">
            <div class="chart-stage__label">Demo · 4/4 · Swing</div>
            <h3 class="chart-stage__title">Autumn Practice</h3>
            <div class="bars">
              ${barCells()}
            </div>
          </div>
        </section>

        <section class="panel" aria-labelledby="status-heading">
          <h2 id="status-heading" class="panel__title">Session</h2>
          <p class="panel__copy" id="session-status">
            <span class="status-dot" id="status-dot" aria-hidden="true"></span>
            Ready — transport is a visual stub until the audio engine lands.
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
          <span>Tempo <strong id="tempo-readout">120</strong> BPM</span>
          <span>Bar <strong id="bar-readout">1</strong></span>
          <span>Beat <strong id="beat-readout">1</strong></span>
        </div>
      </footer>
    </div>
  `

  const playToggle = root.querySelector<HTMLButtonElement>('#play-toggle')!
  const tempoDown = root.querySelector<HTMLButtonElement>('#tempo-down')!
  const tempoUp = root.querySelector<HTMLButtonElement>('#tempo-up')!
  const tempoReadout = root.querySelector<HTMLElement>('#tempo-readout')!
  const barReadout = root.querySelector<HTMLElement>('#bar-readout')!
  const beatReadout = root.querySelector<HTMLElement>('#beat-readout')!
  const statusDot = root.querySelector<HTMLElement>('#status-dot')!
  const sessionStatus = root.querySelector<HTMLElement>('#session-status')!

  const playLabel = playToggle.querySelector<HTMLElement>('span')!

  const render = (state: TransportState): void => {
    // Stable accessible name ("Play") + aria-pressed; visual label may say Stop.
    playToggle.setAttribute('aria-pressed', String(state.playing))
    playLabel.textContent = state.playing ? 'Stop' : 'Play'
    tempoReadout.textContent = String(state.tempoBpm)
    barReadout.textContent = String(state.bar)
    beatReadout.textContent = String(state.beat)
    statusDot.classList.toggle('status-dot--live', state.playing)
    const label = state.playing
      ? 'Counting — audio engine arrives in a later milestone.'
      : 'Ready — transport is a visual stub until the audio engine lands.'
    sessionStatus.lastChild!.textContent = ` ${label}`
  }

  const transport = new TransportController({ onChange: render })

  const onPlay = (): void => transport.toggle()
  const onTempoDown = (): void => transport.setTempo(transport.getState().tempoBpm - 10)
  const onTempoUp = (): void => transport.setTempo(transport.getState().tempoBpm + 10)

  playToggle.addEventListener('click', onPlay)
  tempoDown.addEventListener('click', onTempoDown)
  tempoUp.addEventListener('click', onTempoUp)

  return () => {
    playToggle.removeEventListener('click', onPlay)
    tempoDown.removeEventListener('click', onTempoDown)
    tempoUp.removeEventListener('click', onTempoUp)
    transport.dispose()
  }
}
