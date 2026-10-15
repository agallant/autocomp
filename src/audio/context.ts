let sharedContext: AudioContext | null = null

/** Lazily create a shared AudioContext (browser only). */
export function getAudioContext(): AudioContext {
  if (sharedContext) return sharedContext
  const Ctor =
    globalThis.AudioContext ??
    (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) {
    throw new Error('Web Audio API is not available in this environment')
  }
  // interactive latency helps mobile Safari schedule short percussion hits.
  sharedContext = new Ctor({ latencyHint: 'interactive' })
  return sharedContext
}

/** True when the context needs `resume()` before audio can play. */
export function audioContextNeedsResume(state: string): boolean {
  // iOS Safari may report "interrupted" after backgrounding (not in all TS libs).
  return state === 'suspended' || state === 'interrupted'
}

/** Resume a suspended/interrupted context (required after a user gesture). */
export async function resumeAudioContext(ctx: AudioContext): Promise<void> {
  if (audioContextNeedsResume(ctx.state)) {
    await ctx.resume()
  }
}

/**
 * Unlock Web Audio for Safari / iOS: resume the context and play a silent
 * buffer in the same gesture-derived turn. Resume alone often leaves iPad
 * Safari silent even when `state` briefly reports "running".
 */
export async function unlockAudioContext(ctx: AudioContext): Promise<void> {
  if (audioContextNeedsResume(ctx.state)) {
    await ctx.resume()
  }

  // Silent one-shot — primes the audio session on WebKit.
  const sampleRate = ctx.sampleRate || 44100
  const buffer = ctx.createBuffer(1, 1, sampleRate)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  try {
    source.start(0)
  } catch {
    // ignore — some engines reject if the context is still closed
  }

  if (audioContextNeedsResume(ctx.state)) {
    await ctx.resume()
  }

  if (ctx.state !== 'running') {
    throw new Error(`AudioContext failed to unlock (state: ${ctx.state})`)
  }
}

/** Test helper — clears the shared singleton. */
export function resetAudioContextForTests(): void {
  if (sharedContext) {
    void sharedContext.close().catch(() => undefined)
  }
  sharedContext = null
}
