import {
  DEFAULT_CLICK_LEVEL,
  DEFAULT_CLICK_SUBDIVISION,
  clampClickLevel,
  isClickSubdivision,
  type ClickSubdivision,
} from '../audio'
import {
  DEFAULT_VOICE_LEVELS,
  DEFAULT_VOICE_MUTE,
  STYLE_VOICES,
  normalizeVoiceLevels,
  type VoiceLevels,
  type VoiceMuteState,
} from '../style'
import {
  COMP_DENSITY_OPTIONS,
  DEFAULT_VARIATION,
  clampCountInBars,
  type CompDensity,
} from '../variation'
import { isInstrumentId, type InstrumentId } from '../music/instrument'

export const PRACTICE_PREFS_KEY = 'autocomp.practicePrefs.v1'

export type PracticePrefs = {
  version: 1
  voiceLevels: VoiceLevels
  voiceEnabled: VoiceMuteState
  clickLevel: number
  metronomeEnabled: boolean
  clickSubdivision: ClickSubdivision
  countInBars: number
  density: CompDensity
  swingFeel: number
  fills: boolean
  humanize: boolean
  endings: boolean
  /** Scroll the sounding bar to the center of the viewport while playing. */
  centerPlayhead: boolean
  /** Written-pitch display transpose for horn players (audio stays concert). */
  instrument: InstrumentId
}

export type PrefsStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function createMemoryPrefsStorage(
  initial: Record<string, string> = {},
): PrefsStorage {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

/** Browser localStorage with graceful failure when unavailable. */
export function createLocalPrefsStorage(): PrefsStorage {
  return {
    getItem(key) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        globalThis.localStorage?.setItem(key, value)
      } catch {
        // Quota / private mode — ignore.
      }
    },
  }
}

export function defaultPracticePrefs(): PracticePrefs {
  return {
    version: 1,
    voiceLevels: { ...DEFAULT_VOICE_LEVELS },
    voiceEnabled: { ...DEFAULT_VOICE_MUTE },
    clickLevel: DEFAULT_CLICK_LEVEL,
    metronomeEnabled: false,
    clickSubdivision: DEFAULT_CLICK_SUBDIVISION,
    countInBars: clampCountInBars(DEFAULT_VARIATION.countInBars),
    density: DEFAULT_VARIATION.density,
    swingFeel: DEFAULT_VARIATION.swingFeel,
    fills: DEFAULT_VARIATION.fills,
    humanize: DEFAULT_VARIATION.humanize,
    endings: DEFAULT_VARIATION.endings,
    centerPlayhead: false,
    instrument: 'concert',
  }
}

export function normalizePracticePrefs(raw: unknown): PracticePrefs {
  const base = defaultPracticePrefs()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Record<string, unknown>

  const voiceLevels =
    data.voiceLevels && typeof data.voiceLevels === 'object'
      ? normalizeVoiceLevels(data.voiceLevels as Partial<VoiceLevels>)
      : base.voiceLevels

  const voiceEnabled = { ...base.voiceEnabled }
  if (data.voiceEnabled && typeof data.voiceEnabled === 'object') {
    const enabled = data.voiceEnabled as Record<string, unknown>
    for (const voice of STYLE_VOICES) {
      if (typeof enabled[voice] === 'boolean') voiceEnabled[voice] = enabled[voice]
    }
  }

  const densityRaw = typeof data.density === 'string' ? data.density : base.density
  const density = COMP_DENSITY_OPTIONS.some((o) => o.id === densityRaw)
    ? (densityRaw as CompDensity)
    : base.density

  const swingFeel =
    typeof data.swingFeel === 'number' && Number.isFinite(data.swingFeel)
      ? Math.min(100, Math.max(0, Math.round(data.swingFeel)))
      : base.swingFeel

  return {
    version: 1,
    voiceLevels,
    voiceEnabled,
    clickLevel: clampClickLevel(
      typeof data.clickLevel === 'number' ? data.clickLevel : base.clickLevel,
    ),
    metronomeEnabled:
      typeof data.metronomeEnabled === 'boolean'
        ? data.metronomeEnabled
        : base.metronomeEnabled,
    clickSubdivision: isClickSubdivision(data.clickSubdivision)
      ? data.clickSubdivision
      : base.clickSubdivision,
    countInBars: clampCountInBars(
      typeof data.countInBars === 'number' ? data.countInBars : base.countInBars,
    ),
    density,
    swingFeel,
    fills: typeof data.fills === 'boolean' ? data.fills : base.fills,
    humanize: typeof data.humanize === 'boolean' ? data.humanize : base.humanize,
    endings: typeof data.endings === 'boolean' ? data.endings : base.endings,
    centerPlayhead:
      typeof data.centerPlayhead === 'boolean'
        ? data.centerPlayhead
        : base.centerPlayhead,
    instrument: isInstrumentId(data.instrument) ? data.instrument : base.instrument,
  }
}

export function loadPracticePrefs(
  storage: PrefsStorage = createLocalPrefsStorage(),
): PracticePrefs {
  const raw = storage.getItem(PRACTICE_PREFS_KEY)
  if (!raw) return defaultPracticePrefs()
  try {
    return normalizePracticePrefs(JSON.parse(raw) as unknown)
  } catch {
    return defaultPracticePrefs()
  }
}

export function savePracticePrefs(
  prefs: PracticePrefs,
  storage: PrefsStorage = createLocalPrefsStorage(),
): void {
  const normalized = normalizePracticePrefs(prefs)
  storage.setItem(PRACTICE_PREFS_KEY, JSON.stringify(normalized))
}
