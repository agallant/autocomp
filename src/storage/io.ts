import { deserializeChart, serializeChart, type Chart } from '../music'

/** Build a downloadable JSON Blob for a chart. */
export function chartToDownloadBlob(chart: Chart): Blob {
  return new Blob([serializeChart(chart)], { type: 'application/json' })
}

export function chartDownloadFilename(chart: Chart): string {
  const slug = chart.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || chart.id || 'chart'}.json`
}

/** Parse chart JSON text (throws on invalid input). */
export function parseChartImport(text: string): Chart {
  return deserializeChart(text)
}
