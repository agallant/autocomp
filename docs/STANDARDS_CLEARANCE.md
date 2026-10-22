# Standards pack clearance

Autocomp’s **Standards** shelf is a practice catalogue of **real song titles with harmony skeletons** (chord progressions), in the same spirit as iReal and other legal chord-chart resources. Charts ship **without** copyrighted melodies, lyrics, or lead-sheet heads unless the work is public-domain and a future notation mode adds them.

## Legal framing (product policy)

- **Chord progressions are not copyrightable** under US law. Autocomp therefore includes **real jazz and pop standards by their common titles** as harmony-only practice charts.
- What we **omit by default** is the copyrightable **head** (melody) and lyrics. That matches common legal chord-chart practice (guitar books, iReal-style apps, etc.).
- **Public-domain works** (including jazz standards that have entered the US public domain—e.g. late-1920s / 1930 repertoire) may later gain optional **notation / melody** display. Prefer true jazz PD material over folk novelties when adding melodies.

## What we include (priority order)

1. **Real jazz standards** — common session/real-book repertoire under **real titles**, harmony only. Prefer jazz over folk/traditional fillers.
2. **Public-domain jazz** — recently PD and earlier jazz repertoire (titles + harmony now; melody/notation when suitable).
3. **Stock workshop skeletons** — still useful (rhythm A, modal pedal, cadence labs) under practice titles.
4. **Traditional / folk PD** — fine as extras; do not crowd out jazz priorities.

## Chart notes field

Document basis in `chart.notes` via the Spec `clearance` value:

| Value | Use |
| --- | --- |
| `harmony-only standard` | Real song title; chords only (default for modern session repertoire) |
| `public-domain jazz` | Jazz work in the US public domain (harmony now; melody eligible later) |
| `public-domain traditional` | Folk / traditional PD material |
| `stock educational progression` | Workshop skeleton with a practice title |

## Maintenance

Keep tags accurate for search (`standard`, feel/form tags). When adding PD jazz that may get notation later, prefer well-known jazz standards over non-jazz folk tunes.
