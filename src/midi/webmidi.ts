import type { StyleNote, StyleVoice } from '../style'
import { VOICE_CHANNEL, VOICE_PROGRAM } from './types'

export type MidiOutputInfo = {
  id: string
  name: string
}

export type WebMidiSink = {
  /** Schedule a note relative to an AudioContext timeline. */
  scheduleNote: (
    note: StyleNote,
    whenAudioTime: number,
    audioCurrentTime: number,
    secondsPerBeat: number,
  ) => void
  /** Cancel pending note timers and send All Notes Off. */
  clear: () => void
  /** Cancel pending timers / All Notes Off for the given voices only. */
  clearVoices: (voices: readonly StyleVoice[]) => void
  dispose: () => void
}

type TimerFns = {
  setTimeoutFn: typeof setTimeout
  clearTimeoutFn: typeof clearTimeout
}

/** True when the WebMIDI API is present (typically desktop Chromium/Firefox). */
export function isWebMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function'
}

/**
 * Request MIDI access and list available outputs.
 * Rejects when WebMIDI is unavailable or the user denies permission.
 */
export async function listMidiOutputs(): Promise<MidiOutputInfo[]> {
  if (!isWebMidiSupported()) {
    throw new Error('WebMIDI is not supported in this browser.')
  }
  const access = await navigator.requestMIDIAccess({ sysex: false })
  return [...access.outputs.values()].map((output) => ({
    id: output.id,
    name: output.name || output.id,
  }))
}

/**
 * Resolve a live MIDIOutput by id (re-requests access so the handle stays fresh).
 */
export async function getMidiOutput(id: string): Promise<MIDIOutput | null> {
  if (!isWebMidiSupported()) return null
  const access = await navigator.requestMIDIAccess({ sysex: false })
  return access.outputs.get(id) ?? null
}

/** Create a timer-based sink that sends Note On/Off to a MIDIOutput. */
export function createWebMidiSink(
  output: MIDIOutput,
  timers: TimerFns = {
    setTimeoutFn: setTimeout,
    clearTimeoutFn: clearTimeout,
  },
): WebMidiSink {
  type Pending = { timer: ReturnType<typeof setTimeout>; voice: StyleVoice }
  const pending = new Set<Pending>()
  let programsSent = false

  const sendPrograms = (): void => {
    if (programsSent) return
    programsSent = true
    try {
      output.send([0xc0 | VOICE_CHANNEL.bass, VOICE_PROGRAM.bass])
      output.send([0xc0 | VOICE_CHANNEL.piano, VOICE_PROGRAM.piano])
    } catch {
      // Output may have disconnected.
    }
  }

  const allNotesOff = (voices: readonly StyleVoice[]): void => {
    for (const voice of voices) {
      try {
        // CC 123 All Notes Off
        output.send([0xb0 | VOICE_CHANNEL[voice], 123, 0])
      } catch {
        // ignore disconnect
      }
    }
  }

  const clearVoices = (voices: readonly StyleVoice[]): void => {
    const mute = new Set(voices)
    for (const entry of [...pending]) {
      if (!mute.has(entry.voice)) continue
      timers.clearTimeoutFn(entry.timer)
      pending.delete(entry)
    }
    allNotesOff(voices)
  }

  const clear = (): void => {
    for (const entry of pending) {
      timers.clearTimeoutFn(entry.timer)
    }
    pending.clear()
    allNotesOff(['bass', 'piano', 'drums'])
  }

  return {
    scheduleNote(note, whenAudioTime, audioCurrentTime, secondsPerBeat) {
      if (note.velocity <= 0) return
      sendPrograms()
      const channel = VOICE_CHANNEL[note.voice]
      const midi = Math.max(0, Math.min(127, Math.round(note.midi)))
      const velocity = Math.max(1, Math.min(127, Math.round(note.velocity * 127)))
      const onDelay = Math.max(0, (whenAudioTime - audioCurrentTime) * 1000)
      const offDelay = onDelay + Math.max(0.01, note.durationBeats) * secondsPerBeat * 1000

      const onEntry: Pending = {
        voice: note.voice,
        timer: timers.setTimeoutFn(() => {
          pending.delete(onEntry)
          try {
            output.send([0x90 | channel, midi, velocity])
          } catch {
            // ignore
          }
        }, onDelay),
      }
      pending.add(onEntry)

      const offEntry: Pending = {
        voice: note.voice,
        timer: timers.setTimeoutFn(() => {
          pending.delete(offEntry)
          try {
            output.send([0x80 | channel, midi, 0])
          } catch {
            // ignore
          }
        }, offDelay),
      }
      pending.add(offEntry)
    },
    clear,
    clearVoices,
    dispose: clear,
  }
}
