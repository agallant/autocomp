import type { Chart } from '../music'
import type { StyleEngine } from '../style'
import { bounceChartToBuffer, type BounceOptions } from './bounce'
import { chartFormBeats, chartFormDurationSeconds } from './duration'
import {
  encodeWav,
  encodeWavFromChannels,
  wavDownloadFilename,
  wavToDownloadBlob,
} from './wav'

export {
  bounceChartToBuffer,
  chartFormBeats,
  chartFormDurationSeconds,
  encodeWav,
  encodeWavFromChannels,
  wavDownloadFilename,
  wavToDownloadBlob,
}
export type { BounceOptions }

/** Bounce a chart style offline and encode a downloadable WAV. */
export async function chartToWavBytes(
  chart: Chart,
  style: StyleEngine,
  options: BounceOptions,
): Promise<Uint8Array> {
  const buffer = await bounceChartToBuffer(chart, style, options)
  return encodeWav(buffer)
}
