import type { StyleEngine } from '../style'
import { applyVariation } from './apply'
import type { VariationOptions } from './types'

/** Wrap a style engine so every `realizeBar` runs through `applyVariation`. */
export function createVariedStyle(base: StyleEngine, opts: VariationOptions): StyleEngine {
  return {
    id: base.id,
    label: base.label,
    realizeBar(ctx) {
      return applyVariation(ctx, base.realizeBar(ctx), opts)
    },
  }
}
