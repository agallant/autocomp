export type VariationOptions = {
  /** Replace late-bar drums with a fill on section boundaries. */
  fills: boolean
  /** Bars of metronome (live) / silence (export) before the form. */
  countInBars: number
  /** Light velocity + timing jitter (seeded). */
  humanize: boolean
  /** Deterministic RNG seed (e.g. hash of chart id). */
  seed: number
  /** Tempo used to convert humanize ms → beats. */
  tempoBpm: number
}

export const DEFAULT_VARIATION: Omit<VariationOptions, 'seed' | 'tempoBpm'> = {
  fills: true,
  countInBars: 0,
  humanize: true,
}
