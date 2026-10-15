import type { StyleBarContext, StyleNote } from '../style'
import { applySectionFill } from './fills'
import { humanizeNotes } from './humanize'
import { sectionBoundaryFlags } from './sectionMeta'
import type { VariationOptions } from './types'

export type ApplyVariationContext = {
  /** Precomputed flags aligned with `expandChartBars` (avoids per-bar rescans). */
  sectionBoundaries?: readonly boolean[]
}

/** Post-process one bar of style notes. Shared by live / MIDI / bounce. */
export function applyVariation(
  ctx: StyleBarContext,
  notes: StyleNote[],
  opts: VariationOptions,
  applyCtx: ApplyVariationContext = {},
): StyleNote[] {
  let out = notes
  if (opts.fills) {
    const flags = applyCtx.sectionBoundaries ?? sectionBoundaryFlags(ctx.chart)
    if (flags[ctx.barIndex]) {
      out = applySectionFill(ctx, out)
    }
  }
  if (opts.humanize) {
    out = humanizeNotes(out, opts.seed, ctx.barIndex, opts.tempoBpm, ctx.beatsPerBar)
  }
  return out
}
