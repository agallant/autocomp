import { expandChartBars } from '../music'
import type { StyleBarContext, StyleNote } from '../style'
import { applyCompDensity } from './density'
import { applyFormEnding, formEndingFlags } from './endings'
import { applySectionFill } from './fills'
import { humanizeNotes } from './humanize'
import { sectionBoundaryFlags } from './sectionMeta'
import { applySwingFeel } from './swingFeel'
import type { VariationOptions } from './types'

export type ApplyVariationContext = {
  /** Precomputed flags aligned with `expandChartBars` (avoids per-bar rescans). */
  sectionBoundaries?: readonly boolean[]
  formPenultimate?: readonly boolean[]
  formFinal?: readonly boolean[]
  /**
   * Style engine id. Swing feel only warps jazz-swing upbeats so bossa/Latin
   * syncopation at beat+0.5 stays untouched.
   */
  styleId?: string
}

/** Styles whose even-eighth skips are meant to follow the Swing control. */
const SWING_FEEL_STYLES = new Set(['jazz-swing'])

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
  const solo = opts.density === 'solo'
  // Solo stays kick/ride-only — skip snare section fills.
  if (opts.fills && !solo) {
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
      // Solo skips penultimate snare setup; still allow held final cadence.
      penultimate: !solo && penultimate[ctx.barIndex] === true,
      final: final[ctx.barIndex] === true,
    })
  }
  // Swing before humanize so jitter sits on the swung grid (jazz-swing only).
  if (applyCtx.styleId === undefined || SWING_FEEL_STYLES.has(applyCtx.styleId)) {
    out = applySwingFeel(out, opts.swingFeel)
  }
  if (opts.humanize) {
    out = humanizeNotes(out, opts.seed, ctx.barIndex, opts.tempoBpm, ctx.beatsPerBar)
  }
  return out
}
