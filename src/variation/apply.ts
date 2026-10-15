import { expandChartBars } from '../music'
import type { StyleBarContext, StyleNote } from '../style'
import { applyCompDensity } from './density'
import { applyFormEnding, formEndingFlags } from './endings'
import { applySectionFill } from './fills'
import { humanizeNotes } from './humanize'
import { sectionBoundaryFlags } from './sectionMeta'
import type { VariationOptions } from './types'

export type ApplyVariationContext = {
  /** Precomputed flags aligned with `expandChartBars` (avoids per-bar rescans). */
  sectionBoundaries?: readonly boolean[]
  formPenultimate?: readonly boolean[]
  formFinal?: readonly boolean[]
}

/** Post-process one bar of style notes. Shared by live / MIDI / bounce. */
export function applyVariation(
  ctx: StyleBarContext,
  notes: StyleNote[],
  opts: VariationOptions,
  applyCtx: ApplyVariationContext = {},
): StyleNote[] {
  let out = notes
  // Density before fills so Sparse does not strip section-end snare fills.
  out = applyCompDensity(ctx, out, opts.density)
  if (opts.fills) {
    const flags = applyCtx.sectionBoundaries ?? sectionBoundaryFlags(ctx.chart)
    if (flags[ctx.barIndex]) {
      out = applySectionFill(ctx, out)
    }
  }
  if (opts.endings) {
    let penultimate = applyCtx.formPenultimate
    let final = applyCtx.formFinal
    if (!penultimate || !final) {
      const computed = formEndingFlags(expandChartBars(ctx.chart).length)
      penultimate = computed.penultimate
      final = computed.final
    }
    out = applyFormEnding(ctx, out, {
      penultimate: penultimate[ctx.barIndex] === true,
      final: final[ctx.barIndex] === true,
    })
  }
  if (opts.humanize) {
    out = humanizeNotes(out, opts.seed, ctx.barIndex, opts.tempoBpm, ctx.beatsPerBar)
  }
  return out
}
