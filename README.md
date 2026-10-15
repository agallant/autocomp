# Autocomp

Automatic musical accompaniment as a **client-side TypeScript PWA** — chord charts, backing styles, and live practice tools in the browser (offline-capable). Inspired by iReal Pro (UX) and Band-in-a-Box (styles / generation).

**Live site:** https://agallant.github.io/autocomp/

## Status

Milestone **M0** — PWA scaffold, CI, GitHub Pages deploy, and practice-room app shell. See [ROADMAP.md](./ROADMAP.md).

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
- **Audio engine** — Web Audio scheduler (MIDI out optional via WebMIDI)
- **UI** — chart editor + transport + library (iReal-like)

Everything runs on-device; GitHub Pages only hosts static assets.

## Deploy

Pushes to `main` run [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), which builds and publishes `dist/` to the `gh-pages` branch (Pages source).
