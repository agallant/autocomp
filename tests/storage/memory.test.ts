import { describe, expect, it } from 'vitest'
import { createAutumnPracticeChart } from '../../src/data/practiceCharts'
import { serializeChart } from '../../src/music'
import { createMemoryChartRepository, parseChartImport } from '../../src/storage'

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

  it('round-trips import/export JSON text', () => {
    const chart = createAutumnPracticeChart()
    const text = serializeChart(chart)
    const restored = parseChartImport(text)
    expect(restored.id).toBe(chart.id)
    expect(restored.title).toBe(chart.title)
    expect(serializeChart(restored)).toBe(serializeChart(chart))
  })
})
