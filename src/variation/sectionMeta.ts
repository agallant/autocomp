import { assertValidChart, type Chart } from '../music'

/**
 * Flags aligned with `expandChartBars`: true on the last bar of each form section.
 * Multi-section forms (e.g. AABA) get a fill opportunity at each section end.
 */
export function sectionBoundaryFlags(chart: Chart): boolean[] {
  assertValidChart(chart)
  const byId = new Map(chart.sections.map((s) => [s.id, s]))
  const flags: boolean[] = []
  for (const id of chart.form) {
    const section = byId.get(id)
    if (!section || section.bars.length === 0) continue
    for (let i = 0; i < section.bars.length; i++) {
      flags.push(i === section.bars.length - 1)
    }
  }
  return flags
}

export function isSectionBoundary(chart: Chart, barIndex: number): boolean {
  const flags = sectionBoundaryFlags(chart)
  return flags[barIndex] === true
}
