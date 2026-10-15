export { cloneChart } from './clone'
export { createIdbChartRepository, openDb } from './idb'
export { createMemoryChartRepository } from './memory'
export { chartDownloadFilename, chartToDownloadBlob, parseChartImport } from './io'
export type { ChartRepository, SavedChartMeta, SavedChartRecord } from './types'

import { createIdbChartRepository } from './idb'
import { createMemoryChartRepository } from './memory'
import type { ChartRepository } from './types'

/** Prefer IndexedDB; fall back to memory when IDB is missing or fails at runtime. */
export function createDefaultChartRepository(): ChartRepository {
  if (typeof indexedDB === 'undefined') {
    return createMemoryChartRepository()
  }
  return createFallbackChartRepository(createIdbChartRepository(), createMemoryChartRepository())
}

/** Use `primary` until it throws, then permanently switch to `fallback`. */
export function createFallbackChartRepository(
  primary: ChartRepository,
  fallback: ChartRepository,
): ChartRepository {
  let active: ChartRepository = primary
  let usingFallback = false

  const run = async <T>(fn: (repo: ChartRepository) => Promise<T>): Promise<T> => {
    if (usingFallback) return fn(fallback)
    try {
      return await fn(active)
    } catch {
      usingFallback = true
      active = fallback
      return fn(fallback)
    }
  }

  return {
    list: () => run((repo) => repo.list()),
    get: (id) => run((repo) => repo.get(id)),
    put: (chart) => run((repo) => repo.put(chart)),
    delete: (id) => run((repo) => repo.delete(id)),
  }
}
