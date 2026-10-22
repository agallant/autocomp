import { describe, expect, it } from 'vitest'
import {
  PRACTICE_PREFS_KEY,
  createMemoryPrefsStorage,
  defaultPracticePrefs,
  loadPracticePrefs,
  normalizePracticePrefs,
  savePracticePrefs,
} from '../../src/storage'

describe('practicePrefs', () => {
  it('round-trips through memory storage', () => {
    const storage = createMemoryPrefsStorage()
    const prefs = defaultPracticePrefs()
    prefs.clickLevel = 0.4
    prefs.countInBars = 2
    prefs.density = 'sparse'
    prefs.voiceLevels.bass = 0.5
    prefs.voiceEnabled.melody = true
    prefs.metronomeEnabled = true
    prefs.swingFeel = 80
    prefs.fills = false
    prefs.humanize = false
    prefs.endings = true
    prefs.centerPlayhead = true
    prefs.clickSubdivision = 'eighth'
    prefs.instrument = 'bb'
    savePracticePrefs(prefs, storage)
    expect(storage.getItem(PRACTICE_PREFS_KEY)).toContain('"density":"sparse"')
    const loaded = loadPracticePrefs(storage)
    expect(loaded.clickLevel).toBe(0.4)
    expect(loaded.countInBars).toBe(2)
    expect(loaded.density).toBe('sparse')
    expect(loaded.voiceLevels.bass).toBe(0.5)
    expect(loaded.voiceEnabled.melody).toBe(true)
    expect(loaded.metronomeEnabled).toBe(true)
    expect(loaded.swingFeel).toBe(80)
    expect(loaded.fills).toBe(false)
    expect(loaded.humanize).toBe(false)
    expect(loaded.endings).toBe(true)
    expect(loaded.centerPlayhead).toBe(true)
    expect(loaded.clickSubdivision).toBe('eighth')
    expect(loaded.instrument).toBe('bb')
  })

  it('returns defaults for missing or invalid storage', () => {
    expect(loadPracticePrefs(createMemoryPrefsStorage())).toEqual(defaultPracticePrefs())
    const broken = createMemoryPrefsStorage({ [PRACTICE_PREFS_KEY]: '{not-json' })
    expect(loadPracticePrefs(broken)).toEqual(defaultPracticePrefs())
  })

  it('clamps and repairs partial payloads', () => {
    const normalized = normalizePracticePrefs({
      version: 1,
      clickLevel: 9,
      countInBars: -3,
      density: 'loud',
      swingFeel: 150,
      voiceLevels: { bass: -1, piano: 2 },
      voiceEnabled: { bass: false, melody: 'yes' },
    })
    expect(normalized.clickLevel).toBe(1)
    expect(normalized.countInBars).toBe(0)
    expect(normalized.density).toBe('normal')
    expect(normalized.swingFeel).toBe(100)
    expect(normalized.voiceLevels.bass).toBe(0)
    expect(normalized.voiceLevels.piano).toBe(1)
    expect(normalized.voiceEnabled.bass).toBe(false)
    expect(normalized.voiceEnabled.melody).toBe(false)
  })

  it('keeps default swingFeel when the stored value is non-numeric', () => {
    const defaults = defaultPracticePrefs()
    expect(normalizePracticePrefs({ swingFeel: null }).swingFeel).toBe(defaults.swingFeel)
    expect(normalizePracticePrefs({ swingFeel: false }).swingFeel).toBe(defaults.swingFeel)
    expect(normalizePracticePrefs({ swingFeel: '80' }).swingFeel).toBe(defaults.swingFeel)
  })

  it('defaults instrument to concert and rejects unknown ids', () => {
    expect(defaultPracticePrefs().instrument).toBe('concert')
    expect(normalizePracticePrefs({ instrument: 'bb' }).instrument).toBe('bb')
    expect(normalizePracticePrefs({ instrument: 'piccolo' }).instrument).toBe('concert')
  })

  it('defaults centerPlayhead to false and rejects non-booleans', () => {
    expect(defaultPracticePrefs().centerPlayhead).toBe(false)
    expect(normalizePracticePrefs({}).centerPlayhead).toBe(false)
    expect(normalizePracticePrefs({ centerPlayhead: 'yes' }).centerPlayhead).toBe(false)
    expect(normalizePracticePrefs({ centerPlayhead: true }).centerPlayhead).toBe(true)
  })

  it('defaults clickSubdivision to beat and rejects unknown values', () => {
    expect(defaultPracticePrefs().clickSubdivision).toBe('beat')
    expect(normalizePracticePrefs({ clickSubdivision: '16th' }).clickSubdivision).toBe('beat')
    expect(normalizePracticePrefs({ clickSubdivision: 'eighth' }).clickSubdivision).toBe(
      'eighth',
    )
  })
})
