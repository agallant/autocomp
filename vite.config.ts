import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Absolute path the site is served from, with slashes at both ends. CI sets BASE_PATH
 * (`/autocomp/` on main, `/autocomp/pr-preview/pr-<N>/` for previews); local dev uses `/`.
 */
function resolveBase(env: Record<string, string>): string {
  const trimmed = (env.BASE_PATH ?? '').trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

function gitShortSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: fileURLToPath(new URL('.', import.meta.url)),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'unknown'
  }
}

const pkgVersion = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string
  }
).version

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const base = resolveBase(env)
  // CI passes the full commit SHA and a label (`main`, `PR #<N>` or `ci`); local builds use git.
  const buildSha = (env.BUILD_SHA?.trim() || gitShortSha()).slice(0, 7)
  const buildLabel = env.BUILD_LABEL?.trim() || 'dev'
  return {
    base,
    define: {
      __APP_PKG_VERSION__: JSON.stringify(pkgVersion),
      __APP_GIT_SHA__: JSON.stringify(buildSha),
      __APP_BUILD_LABEL__: JSON.stringify(buildLabel),
      __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        scope: base,
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'samples/**/*.m4a',
          'samples/LICENSE.md',
        ],
        manifest: {
          name: 'Autocomp',
          short_name: 'Autocomp',
          description:
            'Automatic musical accompaniment for practicing with chord charts and backing styles.',
          theme_color: '#0b1c24',
          background_color: '#0b1c24',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,m4a,md}'],
          navigateFallback: 'index.html',
          // PR previews live under the live site's scope; never answer them with the live app.
          navigateFallbackDenylist: [/\/pr-preview\//],
        },
      }),
    ],
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    },
  }
})
