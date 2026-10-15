import type { StyleEngine, StyleNote, StyleVoice } from './types'
import { STYLE_VOICES } from './mute'

/** Per-voice loudness as 0–1 linear gain on note velocity. */
export type VoiceLevels = Record<StyleVoice, number>

export const DEFAULT_VOICE_LEVELS: VoiceLevels = {
  bass: 1,
  piano: 1,
  drums: 1,
  melody: 1,
}

/** Clamp a raw level into the playable 0–1 range. */
export function clampVoiceLevel(level: number): number {
  if (!Number.isFinite(level)) return 1
  return Math.min(1, Math.max(0, level))
}

/** Normalize a partial levels map onto a full {@link VoiceLevels}. */
export function normalizeVoiceLevels(
  levels: Partial<VoiceLevels> | VoiceLevels = DEFAULT_VOICE_LEVELS,
): VoiceLevels {
  return {
    bass: clampVoiceLevel(levels.bass ?? DEFAULT_VOICE_LEVELS.bass),
    piano: clampVoiceLevel(levels.piano ?? DEFAULT_VOICE_LEVELS.piano),
    drums: clampVoiceLevel(levels.drums ?? DEFAULT_VOICE_LEVELS.drums),
    melody: clampVoiceLevel(levels.melody ?? DEFAULT_VOICE_LEVELS.melody),
  }
}

/**
 * Scale note velocities by per-voice levels.
 * Near-silent notes (level 0 / tiny velocity) are dropped.
 */
export function applyVoiceLevels(
  notes: StyleNote[],
  levels: VoiceLevels = DEFAULT_VOICE_LEVELS,
): StyleNote[] {
  const normalized = normalizeVoiceLevels(levels)
  const out: StyleNote[] = []
  for (const note of notes) {
    const level = normalized[note.voice]
    if (level <= 0) continue
    if (level >= 1) {
      out.push(note)
      continue
    }
    const velocity = note.velocity * level
    if (velocity <= 1e-3) continue
    out.push({ ...note, velocity })
  }
  return out
}

/** True when every listed voice is fully audible at default level. */
export function voiceLevelsAreDefault(levels: VoiceLevels): boolean {
  return STYLE_VOICES.every((voice) => Math.abs(levels[voice] - 1) < 1e-9)
}

/** Wrap a style so realized notes respect per-voice levels. */
export function createLeveledStyle(
  base: StyleEngine,
  levels: VoiceLevels = DEFAULT_VOICE_LEVELS,
): StyleEngine {
  const normalized = normalizeVoiceLevels(levels)
  if (voiceLevelsAreDefault(normalized)) return base
  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      return applyVoiceLevels(base.realizeBar(ctx), normalized)
    },
  }
}
