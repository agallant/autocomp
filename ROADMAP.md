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
| M2 | Chart editor | done | iReal-like bar grid editor (select, navigate, chord entry); multi-slot duration editing deferred |
| M3 | Audio clock | done | Web Audio transport, metronome, lookahead scheduler |
| M4 | Jazz swing style | done | Walking bass + piano comp + kit pattern for swing |
| M5 | Style pack | done | Bossa, ballad, Latin/salsa-lite; style picker |
| M6 | Tune library | done | Built-in practice progressions + search/tags |
| M7 | Persistence | in progress | Local save/load charts (IndexedDB), import/export JSON |
| M8 | MIDI I/O | planned | MIDI file export; optional WebMIDI out where supported |
| M9 | Audio render | planned | Offline bounce to WAV/MP3 (client-side encode) |
| M10 | Variation | planned | Fills, intros/endings, solo density, humanization |
| M11 | Generative | planned | Style-conditioned progression / reharm helpers |
| M12 | Listen & follow | planned | Experimental mic/chord following for dynamic backing |

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

## Process notes

- Protected `main`: squash-only; Cubic required check; CodeQL scanning; conversation resolution.
- Prefer ≤ ~100 files touched per PR; space PRs if Cubic free tier rate-limits.
- After each merge, verify Pages deploy before starting the next milestone when deploy-related.
