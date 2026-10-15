import { expandChartBars, type Chart } from '../music'
import type { StyleEngine } from '../style'
import { applyVariation } from './apply'
import { formEndingFlags } from './endings'
import { sectionBoundaryFlags } from './sectionMeta'
import type { VariationOptions } from './types'

/**
 * Fingerprint of form layout (section ids + bar counts).
 * Detects in-place form/bar-count edits even when the Chart object is reused.
 */
export function chartLayoutKey(chart: Chart): string {
  const byId = new Map(chart.sections.map((s) => [s.id, s]))
  // JSON tuples avoid collisions when section ids contain `:` or `|`.
  return JSON.stringify(
    chart.form.map((id) => [id, byId.get(id)?.bars.length ?? 0] as const),
  )
}

/** Wrap a style engine so every `realizeBar` runs through `applyVariation`. */
export function createVariedStyle(base: StyleEngine, opts: VariationOptions): StyleEngine {
  let cachedKey: string | null = null
  let boundaries: boolean[] | null = null
  let formPenultimate: boolean[] | null = null
  let formFinal: boolean[] | null = null

  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      const key = chartLayoutKey(ctx.chart)
      if (boundaries === null || cachedKey !== key) {
        boundaries = sectionBoundaryFlags(ctx.chart)
        const ending = formEndingFlags(expandChartBars(ctx.chart).length)
        formPenultimate = ending.penultimate
        formFinal = ending.final
        cachedKey = key
      }
      const applyCtx: {
        sectionBoundaries: boolean[]
        formPenultimate?: boolean[]
        formFinal?: boolean[]
        styleId: string
      } = { sectionBoundaries: boundaries, styleId: base.id }
      if (formPenultimate) applyCtx.formPenultimate = formPenultimate
      if (formFinal) applyCtx.formFinal = formFinal
      return applyVariation(ctx, base.realizeBar(ctx), opts, applyCtx)
    },
  }
}
