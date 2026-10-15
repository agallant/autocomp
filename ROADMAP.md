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
| M2 | Chart editor | in progress | iReal-like bar grid editor (entry, navigate, quality, duration) |
| M3 | Audio clock | planned | Web Audio transport, metronome, lookahead scheduler |
| M4 | Jazz swing style | planned | Walking bass + piano comp + kit pattern for swing |
| M5 | Style pack | planned | Bossa, ballad, Latin/salsa-lite; style picker |
| M6 | Tune library | planned | Built-in standards/progressions + search/tags |
| M7 | Persistence | planned | Local save/load charts (IndexedDB), import/export JSON |
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

## Process notes

- Protected `main`: squash-only; Cubic required check; CodeQL scanning; conversation resolution.
- Prefer ≤ ~100 files touched per PR; space PRs if Cubic free tier rate-limits.
- After each merge, verify Pages deploy before starting the next milestone when deploy-related.
