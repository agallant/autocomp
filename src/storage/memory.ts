import { cloneChart } from './clone'
import type { ChartRepository, SavedChartMeta, SavedChartRecord } from './types'
import type { Chart } from '../music'

/** In-memory repository for tests and environments without IndexedDB. */
export function createMemoryChartRepository(
  seed: SavedChartRecord[] = [],
): ChartRepository {
  const records = new Map<string, SavedChartRecord>()
  for (const record of seed) {
    records.set(record.id, {
      ...record,
      chart: cloneChart(record.chart),
    })
  }

  return {
    async list(): Promise<SavedChartMeta[]> {
      return [...records.values()]
        .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    async get(id: string): Promise<Chart | null> {
      const record = records.get(id)
      return record ? cloneChart(record.chart) : null
    },
    async put(chart: Chart): Promise<SavedChartRecord> {
      const record: SavedChartRecord = {
        id: chart.id,
        title: chart.title,
        updatedAt: new Date().toISOString(),
        chart: cloneChart(chart),
      }
      records.set(chart.id, record)
      return { ...record, chart: cloneChart(record.chart) }
    },
    async delete(id: string): Promise<void> {
      records.delete(id)
    },
  }
}
