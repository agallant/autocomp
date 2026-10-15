import { formatChord, type Bar, type Chart } from '../music'

function slotLabel(bar: Bar): string {
  const chords = bar.slots.filter((s) => s.chord).map((s) => formatChord(s.chord!))
  if (chords.length === 0) return '·'
  return chords.join(' ')
}

export function renderChartBars(chart: Chart): string {
  return chart.form
    .flatMap((id) => chart.sections.find((s) => s.id === id)?.bars ?? [])
    .map(
      (bar, i) => `
      <div class="bar" data-bar="${i + 1}">
        <span class="bar__chord">${slotLabel(bar)}</span>
        <span class="bar__beat">|</span>
      </div>`,
    )
    .join('')
}

export function chartMetaLine(chart: Chart): string {
  const style = chart.styleHint ? ` · ${capitalize(chart.styleHint)}` : ''
  return `Demo · ${chart.timeSignature.numerator}/${chart.timeSignature.denominator}${style}`
}

function capitalize(value: string): string {
  return value.length ? value[0]!.toUpperCase() + value.slice(1) : value
}
