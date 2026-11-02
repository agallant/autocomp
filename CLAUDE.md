# CLAUDE.md

A client-only TypeScript progressive web app for phones and tablets, deployed to GitHub Pages.
There is no backend: everything runs in the browser, and anything persistent lives on the device
(IndexedDB, localStorage, Cache Storage) or in files the user exports.

The app's own description, stack and structure belong in `README.md`. This file covers how work
gets done here. Keep it current when something below stops being true.

## This app

This repo is **Autocomp**, an existing, working app: automatic musical accompaniment (chord
charts, backing styles, live practice) as a client-side PWA. `README.md` describes the app, how to
run it and its architecture. `ROADMAP.md` tracks the plan as numbered milestones (`M<N>`), each
with an acceptance checklist.

- Ship **one milestone per PR**, titled `M<N>: <summary>`. Add the milestone to the table in
  `ROADMAP.md` and an `## M<N> acceptance` checklist, ticked off in the same PR.
- Changes that aren't a milestone (tooling, dependency or workflow fixes) get a plain title and
  don't need a ROADMAP entry.

## How changes land

- Work on a branch and open a PR into `main`. Pushing to `main` directly is blocked.
- Right after opening a PR that's ready to ship, turn on auto-merge for it:
  `gh api -X PUT repos/<owner>/<repo>/pulls/<number>/ccr/auto_merge -f merge_method=squash`.
  It then merges by itself once every required check passes, CodeRabbit approves, and all review
  threads are resolved. Turn it on this way, as the user, and never from a workflow: a merge
  made with a workflow's token triggers no other workflows, so `main` wouldn't deploy, the PR
  preview wouldn't be removed, and the branch wouldn't be deleted. Open unfinished work as a
  draft without auto-merge.
- Keep PRs small enough to review in one pass; CodeRabbit skips very large ones.
- CodeRabbit's free tier allows about one review an hour. If it comments that the review limit
  was reached, wait the time it states, then comment `@coderabbitai review` on the PR to request
  the review. That isn't an approval request, so it's fine. Pushing new commits while
  rate-limited doesn't help.
- CodeRabbit answers `@coderabbitai review` within a minute or two ("Review triggered"). If it
  hasn't after ten minutes, post the command again. If it says the review was skipped (for
  example "Bot user detected"), `@coderabbitai review` also forces a review of that PR.
- Never leave a PR waiting unattended. Before ending a turn with a PR still open, schedule a
  check-in for yourself (for after the rate limit resets, or in about 20 minutes) to pick it
  back up.
- **Dependabot PRs** need the same approval as any other PR. When you see one open, check that its
  CI passed (a major-version bump that breaks the build needs a fix in a PR of your own first),
  make sure CodeRabbit has reviewed it (request a review as above), and turn on auto-merge for it
  the same way. Space them out: each review uses the hourly allowance your own PRs need.
- After opening a PR, follow it to the end: wait for the checks and CodeRabbit's review, fix
  what's failing, and handle every review comment by either fixing it or replying with the
  reason it shouldn't change. Then resolve the thread. Unresolved threads block the merge.
- Never ask CodeRabbit to approve or resolve (`@coderabbitai approve`, `@coderabbitai resolve`),
  or dismiss its reviews.
- Don't weaken a gate to get a PR through: the workflows in `.github/`, the `main` ruleset,
  `.github/lighthouserc.json` and `.coderabbit.yaml`. If one is genuinely wrong, change it in its
  own PR that says so in the title, and only when the user has asked for or agreed to it.
- PR descriptions say what changed for the person using the app and how to try it on the preview
  (the preview bot comments the link and a QR code).

## CI contract

CI runs `package.json` scripts by name with the package manager implied by the lockfile
(`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, else npm). Commit the lockfile.

| Script | Required | Notes |
| --- | --- | --- |
| `build` | yes | Writes the static site to `dist/` (or the folder in the `BUILD_DIR` repo variable) |
| `typecheck` | if no `tsconfig.json` | Without it, CI runs `tsc --noEmit` against `tsconfig.json` |
| `lint` | no | Run when present |
| `test` | no | Run when present; tests must not need a display or network |

The build output must contain `index.html` with a `<link rel="manifest">` that points to a
manifest file in the build.

The build receives these environment variables:

- `BASE_PATH`: the absolute path the site is served from, with slashes at both ends:
  `/<repo>/` for `main`, `/<repo>/pr-preview/pr-<N>/` for a PR preview, `/` for a custom
  domain. A relative asset base (`./`) works at both URLs without it, but the manifest's
  `start_url` and `scope`, the service worker scope and any client-side router need the
  absolute path. Fall back to `/` when it's unset (local dev).
- `BUILD_SHA` and `BUILD_LABEL` (`main`, `PR #<N>` or `ci`): show them somewhere unobtrusive,
  like a settings or about screen, so it's obvious which build a device is running.

Run the same scripts locally before pushing; a red CI run costs a review round.

## PWA and mobile requirements

- **Installable**: manifest with `name`, `short_name`, `start_url` and `scope` (both from
  `BASE_PATH`), `display: standalone` (or `fullscreen` for a game), theme and background colors,
  and 192px, 512px and 512px maskable PNG icons. Also an `apple-touch-icon`.
- **Offline**: a service worker precaches the app shell, so the app opens with no network after
  the first visit. Updates must not strand users on an old version: activate new workers promptly
  or offer a reload.
- **Previews share the origin.** The live site's service worker controls `/<repo>/` and therefore
  `/<repo>/pr-preview/…` too. Exclude `pr-preview/` from its navigation fallback and runtime
  caching (for Workbox: `navigateFallbackDenylist: [/\/pr-preview\//]`), or previews show the live
  app.
- **Touch first**: pointer events, tap targets of at least 44×44 px, no hover-only interactions,
  `touch-action` set where gestures matter, no accidental double-tap zoom or text selection on
  game surfaces.
- **Every screen size**: works from a 360px-wide phone to a 13" tablet, portrait and landscape.
  Respect safe-area insets (`viewport-fit=cover` plus `env(safe-area-inset-*)`). Use `dvh`/`svh`
  rather than `100vh`.
- **iOS Safari** is the strictest target: test there (or reason carefully about it) before using
  a newer web API, and keep a fallback. Audio needs a user gesture to start, and Safari can evict
  storage for sites not added to the home screen, so offer an export for anything users would
  hate to lose.
- **Accessible**: real buttons and labels, visible focus, sufficient contrast, and
  `prefers-reduced-motion` honored. Lighthouse fails the PR below 90 on accessibility.
- **Light**: keep the initial download small and avoid blocking the main thread.

### Real-time games

- Drive the loop with `requestAnimationFrame` and a fixed-timestep update, decoupled from the
  frame rate (devices run at 60, 90 or 120 Hz).
- Size the canvas by `devicePixelRatio`, capped where fill rate hurts, and handle resize and
  rotation.
- Avoid per-frame allocation in hot paths to keep GC pauses out of gameplay.
- Pause on `visibilitychange`; resume `AudioContext` from a user gesture.
- Keep game logic pure and separate from rendering and input so it can be unit-tested headless.
