import { describe, expect, it, vi } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { serializeChart } from '../../src/music'
import {
  createFallbackChartRepository,
  createMemoryChartRepository,
  parseChartImport,
  type ChartRepository,
} from '../../src/storage'

describe('chart persistence', () => {
  it('saves, lists, loads, and deletes charts in memory', async () => {
    const repo = createMemoryChartRepository()
    const chart = createAutumnPracticeChart()
    chart.title = 'My Autumn'
    await repo.put(chart)

    const listed = await repo.list()
    expect(listed).toHaveLength(1)
    expect(listed[0]).toMatchObject({ id: 'autumn-practice', title: 'My Autumn' })

    const loaded = await repo.get('autumn-practice')
    expect(loaded?.title).toBe('My Autumn')
    expect(loaded?.sections[0]?.bars).toHaveLength(8)

    await repo.delete('autumn-practice')
    expect(await repo.list()).toEqual([])
    expect(await repo.get('autumn-practice')).toBeNull()
  })

  it('rejects invalid charts in the memory repository', async () => {
    const repo = createMemoryChartRepository()
    const chart = createAutumnPracticeChart()
    chart.title = ''
    await expect(repo.put(chart)).rejects.toThrow()
  })

  it('falls back when the primary repository fails', async () => {
    const primary: ChartRepository = {
      list: vi.fn(async () => {
        throw new Error('idb down')
      }),
      get: vi.fn(async () => null),
      put: vi.fn(async () => {
        throw new Error('idb down')
      }),
      delete: vi.fn(async () => undefined),
    }
    const fallback = createMemoryChartRepository()
    const repo = createFallbackChartRepository(primary, fallback)
    const chart = createAutumnPracticeChart()
    await repo.put(chart)
    expect(await repo.list()).toHaveLength(1)
    expect(primary.put).toHaveBeenCalledTimes(1)
  })

  it('does not fall back on chart validation errors', async () => {
    const primary: ChartRepository = {
      list: vi.fn(async () => []),
      get: vi.fn(async () => null),
      put: vi.fn(async () => {
        throw new Error('Invalid chart: title: title is required')
      }),
      delete: vi.fn(async () => undefined),
    }
    const fallback = createMemoryChartRepository()
    const repo = createFallbackChartRepository(primary, fallback)
    const chart = createAutumnPracticeChart()
    await expect(repo.put(chart)).rejects.toThrow(/Invalid chart/)
    // Next valid-looking call should still hit primary (not memory).
    primary.put = vi.fn(async (next) => ({
      id: next.id,
      title: next.title,
      updatedAt: new Date().toISOString(),
      chart: next,
    }))
    await repo.put(chart)
    expect(primary.put).toHaveBeenCalledTimes(1)
    expect(await fallback.list()).toHaveLength(0)
  })

  it('round-trips import/export JSON text', () => {
    const chart = createAutumnPracticeChart()
    const text = serializeChart(chart)
    const restored = parseChartImport(text)
    expect(restored.id).toBe(chart.id)
    expect(restored.title).toBe(chart.title)
    expect(serializeChart(restored)).toBe(serializeChart(chart))
  })
})

