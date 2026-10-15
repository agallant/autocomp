import type { Chart } from '../music'
import type { StyleEngine } from '../style'
import { midiDownloadFilename, midiToDownloadBlob } from './download'
import { realizeChartMidi } from './realize'
import { encodeSmf, encodeVlq, type EncodeSmfOptions } from './smf'
import {
  MIDI_PPQ,
  VOICE_CHANNEL,
  VOICE_PROGRAM,
  type AbsoluteMidiNote,
} from './types'
import {
  createWebMidiSink,
  getMidiOutput,
  isWebMidiSupported,
  listMidiOutputs,
  type MidiOutputInfo,
  type WebMidiSink,
} from './webmidi'

export {
  MIDI_PPQ,
  VOICE_CHANNEL,
  VOICE_PROGRAM,
  createWebMidiSink,
  encodeSmf,
  encodeVlq,
  getMidiOutput,
  isWebMidiSupported,
  listMidiOutputs,
  midiDownloadFilename,
  midiToDownloadBlob,
  realizeChartMidi,
}
export type { AbsoluteMidiNote, EncodeSmfOptions, MidiOutputInfo, WebMidiSink }
export { chartBeatsPerQuarter, quartersPerChartBeat } from './realize'

/** Realize a chart style and encode a downloadable Standard MIDI File. */
export function chartToMidiBytes(
  chart: Chart,
  style: StyleEngine,
  options?: EncodeSmfOptions,
): Uint8Array {
  return encodeSmf(chart, realizeChartMidi(chart, style), options)
}
