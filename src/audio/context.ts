let sharedContext: AudioContext | null = null

/** Lazily create a shared AudioContext (browser only). */
export function getAudioContext(): AudioContext {
  if (sharedContext) return sharedContext
  const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) {
    throw new Error('Web Audio API is not available in this environment')
  }
  sharedContext = new Ctor()
  return sharedContext
}

/** Resume a suspended context (required after a user gesture on many browsers). */
export async function resumeAudioContext(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/** Test helper — clears the shared singleton. */
export function resetAudioContextForTests(): void {
  if (sharedContext) {
    void sharedContext.close().catch(() => undefined)
  }
  sharedContext = null
}
