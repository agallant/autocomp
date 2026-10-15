import type { Chart } from '../music'

/** Encode channel PCM (float -1..1) as a 16-bit stereo/mono WAV file. */
export function encodeWavFromChannels(channels: Float32Array[], sampleRate: number): Uint8Array {
  if (channels.length === 0) {
    throw new Error('WAV encode requires at least one channel')
  }
  const numChannels = channels.length
  const numFrames = channels[0]!.length
  for (const ch of channels) {
    if (ch.length !== numFrames) {
      throw new Error('WAV channels must have equal length')
    }
  }

  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c]![i]!))
      const int16 = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff)
      view.setInt16(offset, int16, true)
      offset += 2
    }
  }

  return new Uint8Array(buffer)
}

/** Encode an AudioBuffer as 16-bit PCM WAV. */
export function encodeWav(buffer: AudioBuffer): Uint8Array {
  const channels: Float32Array[] = []
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }
  return encodeWavFromChannels(channels, buffer.sampleRate)
}

export function wavToDownloadBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], { type: 'audio/wav' })
}

export function wavDownloadFilename(chart: Chart): string {
  const slug = chart.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || chart.id || 'chart'}.wav`
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i) & 0x7f)
  }
}
