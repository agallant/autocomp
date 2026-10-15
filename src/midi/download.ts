import type { Chart } from '../music'

/** Build a downloadable MIDI Blob from SMF bytes. */
export function midiToDownloadBlob(bytes: Uint8Array): Blob {
  // Copy into a standalone buffer so Blob typing stays happy across TS lib targets.
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], { type: 'audio/midi' })
}

export function midiDownloadFilename(chart: Chart): string {
  const slug = chart.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || chart.id || 'chart'}.mid`
}
