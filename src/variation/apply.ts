import type { StyleBarContext, StyleNote } from '../style'
import { applySectionFill } from './fills'
import { humanizeNotes } from './humanize'
import { isSectionBoundary } from './sectionMeta'
import type { VariationOptions } from './types'

/** Post-process one bar of style notes. Shared by live / MIDI / bounce. */
export function applyVariation(
  ctx: StyleBarContext,
  notes: StyleNote[],
  opts: VariationOptions,
): StyleNote[] {
  let out = notes
  if (opts.fills && isSectionBoundary(ctx.chart, ctx.barIndex)) {
    out = applySectionFill(ctx, out)
  }
  if (opts.humanize) {
    out = humanizeNotes(out, opts.seed, ctx.barIndex, opts.tempoBpm, ctx.beatsPerBar)
  }
  return out
}
