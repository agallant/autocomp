# Autocomp Roadmap

Client-side TypeScript PWA for automatic musical accompaniment (iReal Pro UX, Band-in-a-Box style depth). Deployed to GitHub Pages; runs offline on-device.

## Principles

- **Practice first**: live accompaniment is the north star; rendering/export follow.
- **Charts are data**: a stable JSON chart format is the source of truth.
- **Styles are engines**: backing styles generate bass / comping / drums from the chart.
- **Offline by default**: no server runtime; optional later features may use APIs.
- **Small PRs**: one milestone per PR when practical; keep Cubic/CodeQL green.

## Milestones

| ID | Milestone | Status | Goal |
| --- | --- | --- | --- |
| M0 | PWA scaffold | done | Vite + TS + PWA, CI, Pages deploy, app shell + transport stub |
| M1 | Music model | done | Chords, bars, forms, chart JSON schema + parse/serialize + tests |
| M2 | Chart editor | done | iReal-like bar grid editor (select, navigate, chord entry) |
| M3 | Audio clock | done | Web Audio transport, metronome, lookahead scheduler |
| M4 | Jazz swing style | done | Walking bass + piano comp + kit pattern for swing |
| M5 | Style pack | done | Bossa, ballad, Latin/salsa-lite; style picker |
| M6 | Tune library | done | Built-in practice progressions + search/tags |
| M7 | Persistence | done | Local save/load charts (IndexedDB), import/export JSON |
| M8 | MIDI I/O | done | MIDI file export; optional WebMIDI out where supported |
| M9 | Audio render | done | Offline bounce to WAV (MP3 deferred); client-side encode |
| M10 | Variation | done | Fills, intros/endings, solo density, humanization |
| M11 | Generative | done | Style-conditioned progression / reharm helpers |
| M12 | Listen & follow | in progress | Experimental mic/chord following for dynamic backing |
| M13 | Transpose | done | Full-chart transpose (±semitone) with key-aware spelling |
| M14 | Jump to key | done | Transpose to a selected concert key in one step |
| M15 | Comp density | done | Sparse / normal / dense piano–drum texture |
| M16 | Multi-slot bars | in progress | Space-separated chords → timed slots in a bar |

## M0 acceptance

- [x] TypeScript Vite app builds for `/autocomp/` base path
- [x] PWA manifest + service worker (offline shell)
- [x] CI: lint, typecheck, test, build
- [x] Deploy workflow publishes `dist/` to `gh-pages`
- [x] App shell with brand, demo chart, transport stub
- [x] Live at https://agallant.github.io/autocomp/ after merge (verified; published via direct `gh-pages` push after `GITHUB_TOKEN` automerge skipped Actions)

## M1 acceptance

- [x] Chord symbol parser (jazz/pop shorthand) + formatter
- [x] Chord-tone pitch-class helper
- [x] Chart model (sections, form, bars, slots) with validation
- [x] JSON serialize/deserialize round-trip
- [x] Demo chart driven by the model in the UI shell
- [x] Unit tests for parser + chart

## M2 acceptance

- [x] Select bars (click / arrow keys)
- [x] Inline chord symbol editing with validation
- [x] Add / remove bars
- [x] Editable chart title
- [x] Editor unit tests

## M3 acceptance

- [x] Shared AudioContext lifecycle (create + resume on Play)
- [x] Lookahead beat scheduler driven by `audioContext.currentTime`
- [x] Metronome clicks (accent on beat 1)
- [x] Tempo / meter changes apply without resetting musical position mid-phrase incorrectly
- [x] Transport UI bar/beat synced from scheduled audio time
- [x] Unit tests for scheduler, metronome, and transport (mocked AudioContext)

## M4 acceptance

- [x] Style engine interface (`realizeBar` → timed notes)
- [x] Jazz swing walking bass (root / chord tones / approach)
- [x] Piano guide-tone comps on 2 & 4
- [x] Swing ride + hat + kick pattern
- [x] Synth voices scheduled from the audio transport
- [x] Unit tests for style realization + synth scheduling

## M5 acceptance

- [x] Bossa Nova style (syncopated bass / soft comps / light hats)
- [x] Ballad style (sparse bass / sustained piano / soft pulse)
- [x] Latin / salsa-lite style (tumbao bass / montuno shells / clave skeleton)
- [x] Style registry + in-app style picker
- [x] Suggested tempo applied when changing styles
- [x] Unit tests covering each pack style

## M6 acceptance

- [x] Built-in practice progression catalog (original educational charts)
- [x] Tags on each tune (style / harmony / feel)
- [x] Search by title, blurb, and tags
- [x] Tag filter in the library UI
- [x] Loading a tune replaces the editor chart and applies style + tempo
- [x] Unit tests for catalog filtering and chart validity

## M7 acceptance

- [x] IndexedDB repository for saved charts (memory fallback)
- [x] Save current chart / list / load / delete on device
- [x] Export chart JSON download
- [x] Import chart JSON file into editor (+ save)
- [x] Unit tests for memory store and JSON round-trip

## M8 acceptance

- [x] Offline style realization into absolute-beat MIDI notes
- [x] Standard MIDI File (Format 1) export download
- [x] Optional WebMIDI output (feature-detected; desktop browsers)
- [x] Export uses current transport tempo when available
- [x] Unit tests for realize, SMF encoding, and WebMIDI sink

## M9 acceptance

- [x] OfflineAudioContext bounce of one form pass through the live synth path
- [x] 16-bit PCM WAV encode + download
- [x] Export uses current transport tempo when available
- [x] Unit tests for duration, WAV header, and bounce scheduling
- [ ] MP3 encode deferred (keep PR small; add when a lightweight encoder fits)

## M10 acceptance

- [x] Section-boundary drum fills (shared live / MIDI / WAV path)
- [x] Optional 1-bar count-in (metronome live; silence in exports)
- [x] Seeded velocity/timing humanization
- [x] UI toggles: Fills / Count-in / Humanize
- [ ] Solo density deferred
- [ ] Complex endings deferred

## M11 acceptance

- [x] Style-aware progression factory (ii–V–I, minor iiø–V–i, turnaround, blues, style vamp)
- [x] Reharm helpers on selected bar: ii-before-V and tritone substitute (dominant bars)
- [x] UI: Generate kind/key → loads chart via existing apply path; Reharm applies to selection
- [x] Unit tests for generators + reharm; charts validate
- [ ] Generative melody deferred

## M12 acceptance

- [x] Mic capture via getUserMedia + AnalyserNode (feature-detected)
- [x] Chroma fold + chord-tone matching against the live chart
- [x] Follow toggle: stable lock seeks playing transport (or selects bar when stopped)
- [x] Unit tests for chroma, match, follow engine, scheduler seek
- [ ] Manual microphone and playback scenarios verified
- [ ] Polyphonic pitch tracking / ML chord ID deferred

## M13 acceptance

- [x] `transposeChart` / `transposeChord` with destination-key sharp/flat spelling
- [x] Toolbar ±1 semitone controls; chart meta shows concert key
- [x] Unit tests for chord, flat-key spelling, and octave round-trip
- [x] Jump-to-key picker (M14)

## M14 acceptance

- [x] `transposeChartToKey` / `semitonesToKey` (shortest signed distance)
- [x] Toolbar target-key select + Go (pointer + keyboard safe)
- [x] Unit tests for jump and no-op
- [ ] Enharmonic respell-only picker (F#↔Gb) deferred

## M15 acceptance

- [x] `applyCompDensity` sparse (thin piano/hats) / dense (extra comps) / normal
- [x] Density select in variation toolbar; live style refresh
- [x] Unit tests for sparse/dense/normal through `applyVariation`
- [ ] Per-voice density sliders deferred

## M16 acceptance

- [x] Space-separated draft (e.g. `Dm7 G7`) → equal/near-equal duration slots
- [x] Begin-edit loads all bar slots into the draft; display joins with spaces
- [x] Reject more chords than beats; preserve meter/rehearsal mark
- [ ] Explicit per-slot duration UI (e.g. 3+1) deferred

## Process notes

- Protected `main`: squash-only; Cubic required check; CodeQL scanning; conversation resolution.
- Prefer ≤ ~100 files touched per PR; space PRs if Cubic free tier rate-limits.
- After each merge, verify Pages deploy before starting the next milestone when deploy-related.
