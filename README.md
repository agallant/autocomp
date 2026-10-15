# Autocomp

Automatic musical accompaniment as a **client-side TypeScript PWA** — chord charts, backing styles, and live practice tools in the browser (offline-capable). Inspired by iReal Pro (UX) and Band-in-a-Box (styles / generation).

**Live site:** https://agallant.github.io/autocomp/

## Status

Milestone **M29** — chart form editor (order + section markers). See [ROADMAP.md](./ROADMAP.md) and [sample credits](./public/samples/LICENSE.md).

## Chart format (preview)

Charts are JSON documents (`version: 1`) with `sections`, a `form` list of section ids, and bars made of timed chord slots. Symbols use jazz/pop shorthand (`Dm7`, `G7b9`, `Cmaj7`, `F#m7b5`, slash chords).

## Develop

```bash
npm install
npm run dev
```

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local Vite dev server |
| `npm run build` | Typecheck + production build (`base` `/autocomp/`) |
| `npm run preview` | Preview the production build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |
| `npm run ci` | Lint + typecheck + test + build |

For a root-path local preview of the built app:

```bash
VITE_BASE=/ npm run build && npx vite preview --base /
```

## Architecture (target)

- **Chart model** — bars, chords, form, metadata (JSON)
- **Style engines** — generate bass / comping / drums from a chart + tempo
- **Audio engine** — Web Audio scheduler, CC0 sample kit, MIDI export / optional WebMIDI out
- **UI** — chart editor + transport + library (iReal-like)

Everything runs on-device; GitHub Pages only hosts static assets.

## Deploy

Successful **CI on `main`** triggers [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), which publishes `dist/` to the `gh-pages` branch (Pages source).

### Important: auto-merge token

GitHub does **not** start new workflows from events authored by `GITHUB_TOKEN`. The automerge Action therefore should use a PAT stored as repo secret `AUTO_MERGE_TOKEN` (fine-grained: Contents + Pull requests write on this repo). Without it, merges still work, but CI/deploy on `main` will not run automatically.

**Recovery without the secret:** in the Actions tab, manually **Run workflow** for **CI** on `main`, then (after it succeeds) **Run workflow** for **Deploy GitHub Pages** on `main`. Re-running a pull-request CI job is not enough — deploy only accepts successful `push` CI runs or a main `workflow_dispatch`.
