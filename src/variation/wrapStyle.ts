import type { Chart } from '../music'
import type { StyleEngine } from '../style'
import { applyVariation } from './apply'
import { sectionBoundaryFlags } from './sectionMeta'
import type { VariationOptions } from './types'

/** Wrap a style engine so every `realizeBar` runs through `applyVariation`. */
export function createVariedStyle(base: StyleEngine, opts: VariationOptions): StyleEngine {
  let cachedChart: Chart | null = null
  let boundaries: boolean[] | null = null

  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      if (boundaries === null || cachedChart !== ctx.chart) {
        boundaries = sectionBoundaryFlags(ctx.chart)
        cachedChart = ctx.chart
      }
      return applyVariation(ctx, base.realizeBar(ctx), opts, {
        sectionBoundaries: boundaries,
      })
    },
  }
}
