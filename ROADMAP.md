# Autocomp Roadmap

Client-side TypeScript PWA for automatic musical accompaniment (iReal Pro UX, Band-in-a-Box style depth). Deployed to GitHub Pages; runs offline on-device.

## Principles

- **Practice first**: live accompaniment is the north star; rendering/export follow.
- **Charts are data**: a stable JSON chart format is the source of truth.
- **Styles are engines**: backing styles generate bass / comping / drums from the chart.
- **Offline by default**: no server runtime; optional later features may use APIs.
- **Small PRs**: one milestone per PR when practical; keep Cubic/CodeQL green; prefer ≤~80 changed lines.

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
| M12 | Listen & follow | done | Experimental mic/chord following for dynamic backing |
| M13 | Transpose | done | Full-chart transpose (±semitone) with key-aware spelling |
| M14 | Jump to key | done | Transpose to a selected concert key in one step |
| M15 | Comp density | done | Sparse / normal / dense piano–drum texture |
| M16 | Multi-slot bars | done | Space-separated chords → timed slots in a bar |
| M17 | Form endings | done | Penultimate fill + held final-bar cadence |
| M18 | Voice mute | done | Mute bass / piano / drums for practice |
| M19 | Practice loop | done | A–B form-bar loop for focused practice |
| M20 | Tap tempo | done | Tap to set tempo from a beat pulse |
| M21 | Metronome click | done | Toggle click track during playback |
| M22 | Play from bar | done | Start playback at the selected chart bar |
| M23 | Solo density | done | Thinner backing for solo practice |
| M24 | Swing feel | done | Straight → triplet → hard shuffle amount |
| M25 | Voice volume | done | Per-voice level for bass / piano / drums |
| M26 | Guide melody | done | Generative guide-tone practice line |
| M27 | Keyboard shortcuts | done | Space play/pause, T tap, M click |
| M28 | Playhead affordance | done | Play-from-here marker + live playhead |
| M29 | Form editor | done | Edit form order + section markers on the grid |
| M30 | Click volume | done | Adjustable metronome / count-in click level |
| M31 | Playhead scroll | done | Keep the sounding bar in view during playback |
| M32 | Section ops | done | Rename / delete chart sections |
| M33 | Count-in length | done | Choose 0 / 1 / 2 / 4 bar count-in |
| M34 | Tempo shortcuts | done | Keyboard tempo ±10 ([ ] / - =) |
| M35 | Density shortcut | done | D cycles Solo → Sparse → Normal → Dense |
| M36 | Practice prefs | done | Persist mix / click / count-in / density locally |
| M37 | Density keys | done | 1–4 jump to Solo / Sparse / Normal / Dense |
| M38 | Center playhead | done | Optional centered playhead scroll while playing |
| M39 | Tempo ramp | done | Hold tempo keys to fine-ramp ±1 BPM |
| M40 | Click subdivision | done | Metronome Beat vs 8th subdivision |
| M41 | Library shelves | done | Practice / Standards / Generate shelves; default = Practice |
| M42 | Practice pack v2 | done | More educational drills; richer tags; keep landing assortment |
| M43 | Practice shuffle | done | Random pick / seeded variants of practice charts |
| M44 | Full random chart | done | Constrained fully-random progressions (key, length, density) |
| M45 | Harmonic engines | done | Rule-based generators: ii–V chains, rhythm changes, Coltrane/Giant Steps |
| M46 | Standards library | done | Curated jazz-standard progressions + search into deep catalogue |
| M47 | Standards + engines v2 | done | More cleared standards; minor iiø–V–i chain engine |
| M48 | Enharmonic respell | done | ♯↔♭ spelling flip without changing pitch |
| M49 | Form slot reorder | done | Move selected form occurrence earlier/later |
| M50 | Style swing defaults | done | Per-style default swing feel on style picker change |
| M51 | All-shelves search | done | Library All filter searches Practice + Standards + Generate |
| M52 | Random knobs | done | Full random bar count + chord density controls |
| M53 | Random mode knobs | done | Full random major/minor bias + ii–V gravity toggles |
| M54 | Engine length | done | Bars control also sizes Generate-shelf harmonic engines |
| M55 | Standards +1 | done | Add cleared traditional: Swing Low, Sweet Chariot |
| M56 | Standards +1 | done | Add cleared traditional: Auld Lang Syne |
| M57 | Standards +1 | done | Add cleared traditional: Oh! Susanna |
| M58 | Standards +1 | done | Add hip stock: Modal Pedal Form (practice label) |
| M59 | Standards +1 | done | Add hip stock: Bebop Blues Stock (practice label) |
| M60 | Standards +1 | done | Add hip stock: Minor Flat-Six Form (practice label) |
| M61 | Standards +1 | done | Add hip stock: Tritone Sub Lab (practice label) |
| M62 | Standards +1 | done | Add hip stock: Cycle Cadence AABA (practice label) |
| M63 | Standards +1 | done | Add hip stock: Secondary Dominant Lab (practice label) |
| M64 | Standards +1 | done | Add hip stock: Bossa Cadence AABA (practice label) |
| M65 | Standards +1 | done | Add hip stock: Turnaround Lab (practice label) |
| M66 | Real jazz standards | done | Real titles + chords (PD or not); Body and Soul + Autumn Leaves |
| M67 | Standards +1 | done | Add All the Things You Are (harmony only) |
| M68 | Standards +1 | done | Add Blue Bossa (harmony only) |
| M69 | Songs shelf cleanup | done | Stock drills → Practice; Songs = repertoire; alpha sort |
| M70 | Song metadata filters | done | Composer/era on Songs; genre-grouped tag filter; search hits meta |
| M71 | PD notation mode | planned | Optional melody/notation for public-domain jazz standards |
| M72 | Playback focus | done | Chords-first chart; settings after bars; collapsible library |
| M73 | Build stamp | done | Semver bump + git SHA + build time in the shell header |
| M74 | View / Edit mode | done | Default view mode; Edit unlocks chord and form changes |
| M75 | Standards +1 | done | Add Satin Doll (harmony only) |
| M76 | Standards +1 | done | Add Take the A Train (harmony only) |
| M77 | Standards +1 | done | Add Solar (harmony only) |
| M78 | Standards +1 | done | Add Tune Up (harmony only) |
| M79 | Standards +1 | done | Add So What (harmony only) |
| M80 | Standards +1 | done | Add Freddie Freeloader (harmony only) |
| M81 | Instrument + filters | done | Transposing instrument display; genre category + multi feel tags |
| M82 | Standards +1 | done | Add Footprints (harmony only) |
| M83 | Standards +1 | done | Add Cantaloupe Island (harmony only) |
| M84 | Standards +1 | done | Add Maiden Voyage (harmony only) |

## Library & generative depth (product intent)

Default first-run experience stays the **current compact Practice assortment** (short educational charts). Advanced users should reach a deeper catalogue and stronger generators without cluttering that default:

1. **More practice material** — expand the educational pack (M42) while Practice remains the default shelf.
2. **Variation / randomization** — shuffle and seedable variants of existing drills (M43).
3. **Full random + generative** — fully randomized, constraint-bounded charts (M44) plus harmony-rule engines (M45: ii–V–I chains, blues, rhythm changes, Coltrane/Giant Steps matrices, etc.). Build on M11’s factories.
4. **Songs library** — **real song titles with chord charts** (M46+), jazz through pop/rock/R&B/funk, **whether or not PD**. Stock drills stay on Practice. Progressions are practice material; omit copyrighted melodies/lyrics by default. PD unlocks optional heads/notation (M71). Scale toward hundreds of gig-ready tunes with rich filters (M70).
5. **Discoverability** — shelves, categories, tags, and filters (M41) so the default list stays simple while Songs / Generate are one shelf away and searchable.

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
- [x] Library shelves / categories (M41)
- [x] Expanded practice pack (M42)
- [x] Standards catalogue (M46)

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
- [x] Solo density (M23)
- [x] Complex endings (M17)

## M11 acceptance

- [x] Style-aware progression factory (ii–V–I, minor iiø–V–i, turnaround, blues, style vamp)
- [x] Reharm helpers on selected bar: ii-before-V and tritone substitute (dominant bars)
- [x] UI: Generate kind/key → loads chart via existing apply path; Reharm applies to selection
- [x] Unit tests for generators + reharm; charts validate
- [x] Generative guide melody (M26)
- [x] Practice shuffle / seeded variants (M43)
- [x] Fully random constrained generator (M44)
- [x] Advanced harmonic engines — Coltrane/Giant Steps, extended ii–V chains, rhythm changes (M45)

## M12 acceptance

- [x] Mic capture via getUserMedia + AnalyserNode (feature-detected)
- [x] Chroma fold + chord-tone matching against the live chart
- [x] Follow toggle: stable lock seeks playing transport (or selects bar when stopped)
- [x] Unit tests for chroma, match, follow engine, scheduler seek
- [ ] Manual microphone and playback scenarios verified (deferred)
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
- [x] Enharmonic respell-only picker (F#↔Gb) (M48)

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

## M17 acceptance

- [x] Form ending flags (penultimate + final)
- [x] Penultimate setup fill; final held piano + kick/ride
- [x] Toolbar **Ending** toggle; shared live/MIDI/WAV path
- [x] Unit tests for flags and ending treatment
- [ ] Multi-chorus / tag coda form editing deferred

## M18 acceptance

- [x] Per-voice mute (bass / piano / drums) via style wrapper
- [x] Toolbar voice toggles; live refresh without stopping transport
- [x] Applies to live playback, MIDI export, and WAV bounce
- [x] Unit tests for filter + muted `realizeBar`
- [ ] Manual playback and export scenarios verified (deferred)
- [x] Per-voice volume / balance (M25)

## M19 acceptance

- [x] Normalize / resolve A–B form-bar loop helpers
- [x] Transport maps post-count-in bars through the loop window
- [x] Toolbar Loop toggle + Set A / Set B from selection
- [x] Unit tests for normalize + resolve mapping
- [ ] Manual loop playback scenarios verified (deferred)
- [ ] Loop-aware approach tones / ending fills deferred

## M20 acceptance

- [x] Sliding-window tap-tempo estimator (40–300 BPM clamp)
- [x] Transport **Tap** button; live style refresh on estimate
- [x] Unit tests for estimate, reset gap, and clamp
- [x] Keyboard shortcut for tap (M27)

## M21 acceptance

- [x] Toolbar **Click** toggle wired to `setMetronomeEnabled`
- [x] Count-in still clicks when the toggle is off
- [x] Unit test for enabling clicks mid-session
- [x] Click volume (M30); subdivision (M40)

## M22 acceptance

- [x] `play({ formBar })` / toggle start from a 1-based chart bar
- [x] Play button uses the selected bar; count-in still leads in
- [x] Compatible with A–B loop clamp via `passIndexForFormBar`
- [x] Unit test for mid-form start
- [x] Visual “playhead from here” affordance (M28)
- [ ] Manual playback checks (mid-form start, restart from top, loop clamp) deferred

## M23 acceptance

- [x] `solo` density: no piano, even-beat bass, kick+ride only
- [x] Density picker includes Solo; shared live/MIDI/WAV path
- [x] Unit tests for solo thinning
- [ ] Per-voice solo mix deferred

## M24 acceptance

- [x] `swingFeel` (0–100) warps even-eighth upbeats (straight → hard)
- [x] Jazz swing ride skips authored as even eighths; default ~triplet
- [x] Toolbar Swing range; shared live/MIDI/WAV path
- [x] Unit tests for ratio mapping and ride skip warping
- [x] Per-style swing defaults (M50)

## M25 acceptance

- [x] `applyVoiceLevels` / `createLeveledStyle` scale note velocities 0–1
- [x] Per-voice range next to mute toggles; zero silences ringing notes
- [x] Shared live / MIDI / WAV path via style wrap
- [x] Unit tests for clamp, scale, and style wrap
- [x] Persist mix locally (M36); per-chart mix deferred

## M26 acceptance

- [x] `realizeGuideMelody` quarter-note guide-tone line with voice leading
- [x] New `melody` voice (opt-in mute; Flute GM / piano samples)
- [x] `createGuideMelodyStyle` on the live / MIDI / WAV path
- [x] Unit tests for tones, realization, and mute default
- [ ] Phrase-level / style-conditioned solo lines deferred

## M27 acceptance

- [x] Space toggles play/pause from the selected bar (when not editing)
- [x] `T` taps tempo; `M` toggles metronome click
- [x] Shortcuts ignored in form fields / chord edit
- [x] Unit tests for `practiceKeyAction`
- [x] Tempo ±10 shortcuts (M34)
- [x] Density cycle shortcut (M35)

## M28 acceptance

- [x] Selected bar shows a “play from here” marker when stopped
- [x] Live playhead class tracks the sounding form bar during playback
- [x] `syncBarPlayhead` updates the grid without a full re-render
- [x] Unit tests for markers and sync
- [x] Scroll-into-view for off-screen playhead (M31)

## M29 acceptance

- [x] Form field edits space-separated section order (`A A B A`)
- [x] Add section appends a new empty lettered section to the form
- [x] Section-start markers on the chart grid (including repeats)
- [x] Meta line shows compact form string
- [x] Unit tests for form rewrite, add section, and markers
- [x] Rename / delete sections (M32)

## M30 acceptance

- [x] `clickLevel` (0–1) scales metronome / count-in click amplitude
- [x] Toolbar Click lvl range; live updates without restart
- [x] Zero level schedules no click oscillators
- [x] Unit tests for clamp, scaling, and silence
- [x] Persist click level locally (M36); per-chart deferred

## M31 acceptance

- [x] Sounding bar scrolls into view when the playhead advances
- [x] Scroll uses `nearest` (no jump when already visible); smooth unless reduced-motion
- [x] Only scrolls once per bar (not every beat); re-arms on beat-1 loop wrap
- [x] Unit tests for scroll options
- [x] Center-on-playhead preference (M38)

## M32 acceptance

- [x] Rename selected section label (id / form tokens unchanged)
- [x] Delete selected section; strip from form; keep ≥1 section
- [x] Toolbar Section field + Delete section control
- [x] Unit tests for rename, delete, and last-section guard
- [x] Reorder form slots (Form ↑ / Form ↓) (M49)

## M33 acceptance

- [x] Count-in length select: Off / 1 / 2 / 4 bars (`clampCountInBars` 0–8)
- [x] Shared live / MIDI / WAV path via `variationOptions.countInBars`
- [x] Unit tests for clamp and multi-bar beat length
- [x] Persist count-in preference locally (M36)

## M34 acceptance

- [x] `[` / `-` decrease tempo 10 BPM; `]` / `=` / `+` increase
- [x] Same guards as other practice keys (form fields, chord edit, key-repeat)
- [x] Unit tests for tempo key mapping
- [x] Hold-to-ramp tempo (M39)

## M35 acceptance

- [x] `D` cycles Solo → Sparse → Normal → Dense
- [x] Updates density select + live style wrap
- [x] Unit tests for key map and cycle order
- [x] Direct density number keys (M37)

## M36 acceptance

- [x] `localStorage` practice prefs: voice mix/mute, click level, metronome, count-in, density, swing, fills, humanize, endings
- [x] Load on mount; save on change (injectable storage for tests)
- [x] Unit tests for normalize / round-trip / corrupt payloads
- [ ] Per-chart prefs deferred

## M37 acceptance

- [x] Digits `1`–`4` set Solo / Sparse / Normal / Dense
- [x] Same guards as other practice keys (form fields, chord edit, modifiers)
- [x] Updates density select + live style wrap + persisted prefs
- [x] Unit tests for digit map and action → density helper

## M38 acceptance

- [x] `centerPlayhead` practice pref (default off = nearest scroll)
- [x] Center toggle in variation toolbar; persists via localStorage
- [x] `syncBarPlayhead` uses `block`/`inline: 'center'` when enabled
- [x] Unit tests for scroll options + prefs normalize

## M39 acceptance

- [x] Initial tempo key press still ±10 BPM
- [x] Browser key-repeat while held ramps ±1 BPM
- [x] Non-tempo practice keys still ignore key-repeat
- [x] Unit tests for `practiceTempoDelta`

## M40 acceptance

- [x] Click subdivision select: Beat / 8th
- [x] 8th schedules unaccented off-beat mid-beat (live + count-in)
- [x] Persisted in practice prefs; invalid values fall back to Beat
- [x] Unit tests for subdivision scheduling + prefs normalize
- [ ] Manual playback and preference-persistence checks verified (deferred)

## M41 acceptance

- [x] Library shelves: **Practice** (default) / **Standards** / **Generate**
- [x] Shelf switcher + tag/category filters scoped to the active shelf
- [x] Search still works across the active shelf; All shelves filter (M51)
- [x] Empty Standards/Generate shelves show clear CTA until packs/engines land
- [x] Unit tests for shelf filtering; default shelf remains Practice

## M42 acceptance

- [x] Grow Practice catalogue (≥ ~20–30 educational charts) without changing default landing shelf
- [x] Richer tags (harmony device, feel, length, difficulty)
- [x] All new charts validate; existing search/filter still works
- [x] Unit tests for catalog size + tag coverage

## M43 acceptance

- [x] “Shuffle practice” / random pick from Practice shelf
- [x] Seeded variants of practice charts (transpose, density hint, optional form trim)
- [x] UI affordance next to library (one click; no deep menus)
- [x] Unit tests for seeded determinism

## M44 acceptance

- [x] Fully random chart generator with knobs: key, bar count, time sig, chord density, major/minor bias
- [x] Optional “avoid too-wild” filters (max consecutive non-diatonic, prefer ii–V gravity)
- [x] Generate shelf entry + Load into editor
- [x] Unit tests for constraints / validity

## M45 acceptance

- [x] Harmonic rule engines (at least): extended ii–V–I / iiø–V–i chains; rhythm-changes A; Coltrane/Giant Steps matrix cycles
- [x] Parameterized length + starting key; style hint applied on load
- [x] Listed under Generate shelf alongside M44 random
- [x] Unit tests for cycle correctness and chart validation

## M46 acceptance

- [x] Curated standards pack: real-title harmony charts plus stock educational extras (omit copyrighted melodies/lyrics by default)
- [x] Searchable via Standards shelf + tags (form, key feel, era/style labels)
- [x] In-repo legal note: clearance criteria (real titles + harmony-only; see docs/STANDARDS_CLEARANCE.md)
- [x] Unit tests for chart validity; library search finds standards by tag/title

## M47 acceptance

- [x] Expand Standards pack with additional traditional + stock educational charts
- [x] Minor iiø–V–i chain engine on the Generate shelf
- [x] Unit tests for minor chain spelling + larger standards catalogue

## M48 acceptance

- [x] `respellChart` flips enharmonic spelling (key + all chords) without changing pitch classes
- [x] Toolbar ♯↔♭ control next to transpose (pointer + keyboard safe)
- [x] Unit tests for F♯↔G♭ round-trip

## M49 acceptance

- [x] `moveFormOccurrence` swaps the selected form slot with its neighbor
- [x] Form ↑ / Form ↓ toolbar controls; caret stays on the moved occurrence
- [x] Unit tests for move + edge no-ops

## M50 acceptance

- [x] Each style declares `defaultSwingFeel` (jazz ~triplet; bossa/latin straight)
- [x] Changing the style picker applies that default and persists prefs
- [x] Unit tests for pack defaults

## M51 acceptance

- [x] Library shelf switcher includes **All** (default remains Practice)
- [x] All-shelf search/filter spans Practice + Standards + Generate; list shows shelf labels
- [x] Unit tests for all-shelf filtering and tag union

## M52 acceptance

- [x] Generate toolbar Bars (8/12/16) and Density (1–2 / bar) knobs for Full random
- [x] Options flow through `generateProgression` → `generateRandomChart`
- [x] Unit tests for knobs via generateProgression

## M53 acceptance

- [x] Generate toolbar Mode (Major / Mix / Minor) and ii–V (On / Off) knobs for Full random
- [x] Options flow through `generateProgression` → `generateRandomChart`
- [x] Unit tests for knobs via generateProgression

## M54 acceptance

- [x] Bars (8/12/16) sets preferred length for Generate-shelf engines
- [x] Library engine presets omit fixed length and use the preference
- [x] Unit tests for preferred length + library createChart
- [x] Rhythm A / Coltrane keep 8 bars at default Bars=12; Bars=16 selects the long form

## M55 acceptance

- [x] Standards pack gains Swing Low, Sweet Chariot (public-domain traditional; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M56 acceptance

- [x] Standards pack gains Auld Lang Syne (public-domain traditional; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M57 acceptance

- [x] Standards pack gains Oh! Susanna (public-domain traditional; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M58 acceptance

- [x] Standards pack gains Modal Pedal Form (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M59 acceptance

- [x] Standards pack gains Bebop Blues Stock (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M60 acceptance

- [x] Standards pack gains Minor Flat-Six Form (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M61 acceptance

- [x] Standards pack gains Tritone Sub Lab (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M62 acceptance

- [x] Standards pack gains Cycle Cadence AABA (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M63 acceptance

- [x] Standards pack gains Secondary Dominant Lab (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M64 acceptance

- [x] Standards pack gains Bossa Cadence AABA (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M65 acceptance

- [x] Standards pack gains Turnaround Lab (stock educational; practice label; no melody/lyrics)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M66 acceptance

- [x] Clearance docs: non-PD standards still get real titles + chords; PD only unlocks optional notation later
- [x] Standards pack gains Body and Soul (PD jazz) and Autumn Leaves (non-PD harmony-only)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search
- [x] ROADMAP notes PD notation mode as planned

## M67 acceptance

- [x] Standards pack gains All the Things You Are (harmony-only standard; real title)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M68 acceptance

- [x] Standards pack gains Blue Bossa (harmony-only standard; real title)
- [x] Searchable on Standards shelf; clearance note present
- [x] Unit tests for pack size + title search

## M69 acceptance

- [x] Stock educational charts move to Practice (not Songs)
- [x] Songs shelf lists only real-title repertoire; UI label “Songs”
- [x] Library results default to alphabetical by title
- [x] Unit tests for shelf split + alpha sort

## M70 acceptance

- [x] Songs entries carry optional composer + era; search matches them
- [x] Library tag control groups Genre vs Feel / form
- [x] List meta shows composer/era when present; unit coverage for meta search

## M72 acceptance

- [x] Chord bars render above chart settings (progressive disclosure)
- [x] Settings wrapped in a collapsible details block (open by default; state survives re-renders)
- [x] Library panel collapsible so the song list can be tucked away

## M73 acceptance

- [x] Header shows `v{semver}+{gitSha}` from package.json + `git rev-parse --short HEAD`
- [x] Build ISO timestamp available (header tooltip); injected via Vite `define`
- [x] Smoke test covers pkg version, SHA, and stamp composition

## M74 acceptance

- [x] Chart defaults to view mode (bar click selects / play-from only)
- [x] Edit / Done toggle unlocks chord editing, form controls, and destructive bar keys
- [x] Leaving Edit cancels an in-progress chord draft

## M75 acceptance

- [x] Standards pack gains Satin Doll (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack size + title search

## M76 acceptance

- [x] Standards pack gains Take the A Train (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack size + title search

## M77 acceptance

- [x] Standards pack gains Solar (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack size + title search

## M78 acceptance

- [x] Standards pack gains Tune Up (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack size + title search

## M79 acceptance

- [x] Standards pack gains So What (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack size + title search

## M80 acceptance

- [x] Standards pack gains Freddie Freeloader (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack size + title search

## M81 acceptance

- [x] Settings Instrument control: Concert / B♭ / E♭ / F (persisted); chords show written pitch; audio stays concert
- [x] Library Category (single genre) + Feel tags (multi-select AND); shelf markers hidden from UI/meta
- [x] Unit tests for instrument offsets, prefs, and filter controls
- [ ] Manual UI checks for transposed display/playback and combined filters verified (deferred)

## M82 acceptance

- [x] Standards pack gains Footprints (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack title search + changes

## M83 acceptance

- [x] Standards pack gains Cantaloupe Island (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack title search + changes

## M84 acceptance

- [x] Standards pack gains Maiden Voyage (harmony-only standard; real title)
- [x] Searchable on Songs shelf; composer/era meta present
- [x] Unit tests for pack title search + AABA sus changes

## Process notes

- Protected `main`: squash-only; Cubic required check; CodeQL scanning; conversation resolution.
- Prefer ≤ ~80 changed lines and ≤ ~100 files per PR; space PRs if Cubic reviewed-line quota is tight.
- After each merge, verify Pages deploy before starting the next milestone when deploy-related.
- Library depth (M41–M46): ship shelves first so catalogue growth never buries the default Practice UX.
