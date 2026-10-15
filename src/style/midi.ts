import { rootToPc, type Chord, type PitchClass } from '../music'

/** Map a pitch class into a MIDI note near `preferMidi` (default bass register). */
export function pcToMidiNear(pc: PitchClass, preferMidi: number): number {
  const base = preferMidi - (preferMidi % 12)
  let midi = base + pc
  while (midi < preferMidi - 6) midi += 12
  while (midi > preferMidi + 6) midi -= 12
  return midi
}

export function chordBassPc(chord: Chord): PitchClass {
  return rootToPc(chord.bass ?? chord.root)
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}
