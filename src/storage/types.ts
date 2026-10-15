import type { Chart } from '../music'

export type SavedChartMeta = {
  id: string
  title: string
  updatedAt: string
}

export type SavedChartRecord = SavedChartMeta & {
  chart: Chart
}

export type ChartRepository = {
  list(): Promise<SavedChartMeta[]>
  get(id: string): Promise<Chart | null>
  put(chart: Chart): Promise<SavedChartRecord>
  delete(id: string): Promise<void>
}
