import type { StyleEngine, StyleNote, StyleVoice } from './types'

/** Which accompaniment voices are audible (checked = on). */
export type VoiceMuteState = Record<StyleVoice, boolean>

export const DEFAULT_VOICE_MUTE: VoiceMuteState = {
  bass: true,
  piano: true,
  drums: true,
}

export const STYLE_VOICES: readonly StyleVoice[] = ['bass', 'piano', 'drums']

/** Drop notes whose voice is muted (false in `enabled`). */
export function filterMutedVoices(
  notes: StyleNote[],
  enabled: VoiceMuteState,
): StyleNote[] {
  return notes.filter((n) => enabled[n.voice] !== false)
}

/** Wrap a style so muted voices never leave `realizeBar`. */
export function createMutedStyle(
  base: StyleEngine,
  enabled: VoiceMuteState = DEFAULT_VOICE_MUTE,
): StyleEngine {
  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      return filterMutedVoices(base.realizeBar(ctx), enabled)
    },
  }
}
