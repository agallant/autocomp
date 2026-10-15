export { cloneChart } from './clone'
export { createIdbChartRepository } from './idb'
export { createMemoryChartRepository } from './memory'
export { chartDownloadFilename, chartToDownloadBlob, parseChartImport } from './io'
export type { ChartRepository, SavedChartMeta, SavedChartRecord } from './types'

import { createIdbChartRepository } from './idb'
import { createMemoryChartRepository } from './memory'
import type { ChartRepository } from './types'

/** Prefer IndexedDB in browsers; fall back to memory when unavailable. */
export function createDefaultChartRepository(): ChartRepository {
  if (typeof indexedDB === 'undefined') {
    return createMemoryChartRepository()
  }
  return createIdbChartRepository()
}
