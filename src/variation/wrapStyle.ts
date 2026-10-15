import type { Chart } from '../music'
import type { StyleEngine } from '../style'
import { applyVariation } from './apply'
import { sectionBoundaryFlags } from './sectionMeta'
import type { VariationOptions } from './types'

/**
 * Fingerprint of form layout (section ids + bar counts).
 * Detects in-place form/bar-count edits even when the Chart object is reused.
 */
export function chartLayoutKey(chart: Chart): string {
  const byId = new Map(chart.sections.map((s) => [s.id, s]))
  return chart.form
    .map((id) => {
      const section = byId.get(id)
      return `${id}:${section?.bars.length ?? 0}`
    })
    .join('|')
}

/** Wrap a style engine so every `realizeBar` runs through `applyVariation`. */
export function createVariedStyle(base: StyleEngine, opts: VariationOptions): StyleEngine {
  let cachedKey: string | null = null
  let boundaries: boolean[] | null = null

  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      const key = chartLayoutKey(ctx.chart)
      if (boundaries === null || cachedKey !== key) {
        boundaries = sectionBoundaryFlags(ctx.chart)
        cachedKey = key
      }
      return applyVariation(ctx, base.realizeBar(ctx), opts, {
        sectionBoundaries: boundaries,
      })
    },
  }
}
