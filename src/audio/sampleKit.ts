/** Drum one-shots used by style engines. */
export type DrumSampleId = 'kick' | 'snare' | 'hat' | 'ride' | 'clave'

export type PitchedSample = {
  midi: number
  buffer: AudioBuffer
}

export type SampleKit = {
  drums: Partial<Record<DrumSampleId, AudioBuffer>>
  bass: PitchedSample[]
  piano: PitchedSample[]
}

/** AAC/M4A — decodes in Safari/iOS where Ogg Vorbis does not. */
const DRUM_FILES: Array<[DrumSampleId, string]> = [
  ['kick', 'drums/kick.m4a'],
  ['snare', 'drums/snare.m4a'],
  ['hat', 'drums/hat.m4a'],
  ['ride', 'drums/ride.m4a'],
  ['clave', 'drums/clave.m4a'],
]

/** Bass root MIDI for each vendored Meatbass pizz sample. */
const BASS_FILES: Array<[number, string]> = [
  [24, 'bass/c1.m4a'],
  [27, 'bass/eb1.m4a'],
  [30, 'bass/gb1.m4a'],
  [33, 'bass/a1.m4a'],
  [36, 'bass/c2.m4a'],
  [39, 'bass/eb2.m4a'],
  [42, 'bass/gb2.m4a'],
  [45, 'bass/a2.m4a'],
  [48, 'bass/c3.m4a'],
  [54, 'bass/gb3.m4a'],
]

/** Piano root MIDI for each vendored Splendid Grand sample. */
const PIANO_FILES: Array<[number, string]> = [
  [48, 'piano/C3.m4a'],
  [52, 'piano/E3.m4a'],
  [55, 'piano/G3.m4a'],
  [60, 'piano/C4.m4a'],
  [64, 'piano/E4.m4a'],
  [67, 'piano/G4.m4a'],
  [69, 'piano/A4.m4a'],
]

let cachedKit: SampleKit | null = null
let loadPromise: Promise<SampleKit> | null = null

/** Resolve a sample URL under the Vite `base` path (`/` or `/autocomp/`). */
export function sampleAssetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}samples/${relativePath.replace(/^\//, '')}`
}

export function getSampleKit(): SampleKit | null {
  return cachedKit
}

/** Nearest pitched sample by absolute MIDI distance. */
export function nearestPitchedSample(
  samples: readonly PitchedSample[],
  midi: number,
): PitchedSample | null {
  if (samples.length === 0) return null
  let best = samples[0]!
  let bestDist = Math.abs(best.midi - midi)
  for (let i = 1; i < samples.length; i++) {
    const candidate = samples[i]!
    const dist = Math.abs(candidate.midi - midi)
    if (dist < bestDist) {
      best = candidate
      bestDist = dist
    }
  }
  return best
}

export function playbackRateForMidi(rootMidi: number, targetMidi: number): number {
  return 2 ** ((targetMidi - rootMidi) / 12)
}

/**
 * Safari/WebKit historically required the callback form of `decodeAudioData`.
 * Prefer the Promise return when present; always supply callbacks as a fallback.
 */
export function decodeAudioDataCompat(
  ctx: BaseAudioContext,
  bytes: ArrayBuffer,
): Promise<AudioBuffer> {
  const copy = bytes.slice(0)
  return new Promise((resolve, reject) => {
    let settled = false
    const ok = (buffer: AudioBuffer): void => {
      if (settled) return
      settled = true
      resolve(buffer)
    }
    const fail = (err?: unknown): void => {
      if (settled) return
      settled = true
      reject(err instanceof Error ? err : new Error('decodeAudioData failed'))
    }
    try {
      const ret = ctx.decodeAudioData(copy, ok, fail) as Promise<AudioBuffer> | undefined
      if (ret && typeof ret.then === 'function') {
        ret.then(ok, fail)
      }
    } catch (err) {
      fail(err)
    }
  })
}

async function decodeAsset(
  ctx: BaseAudioContext,
  relativePath: string,
  fetchFn: typeof fetch,
): Promise<AudioBuffer> {
  const response = await fetchFn(sampleAssetUrl(relativePath))
  if (!response.ok) {
    throw new Error(`Failed to load sample ${relativePath} (${response.status})`)
  }
  const bytes = await response.arrayBuffer()
  return decodeAudioDataCompat(ctx, bytes)
}

/**
 * Load and decode the bundled sample kit once. Safe to call from live AudioContext
 * or OfflineAudioContext (bounce). Drum/bass/piano groups load concurrently.
 */
export async function ensureSampleKit(
  ctx: BaseAudioContext,
  fetchFn: typeof fetch = fetch,
): Promise<SampleKit> {
  if (cachedKit) return cachedKit
  if (loadPromise) return loadPromise
  if (typeof ctx.decodeAudioData !== 'function') {
    throw new Error('decodeAudioData is not available on this audio context')
  }

  loadPromise = (async () => {
    const [drumEntries, bass, piano] = await Promise.all([
      Promise.all(
        DRUM_FILES.map(async ([id, path]) => [id, await decodeAsset(ctx, path, fetchFn)] as const),
      ),
      Promise.all(
        BASS_FILES.map(async ([midi, path]) => ({
          midi,
          buffer: await decodeAsset(ctx, path, fetchFn),
        })),
      ),
      Promise.all(
        PIANO_FILES.map(async ([midi, path]) => ({
          midi,
          buffer: await decodeAsset(ctx, path, fetchFn),
        })),
      ),
    ])

    const drums: SampleKit['drums'] = {}
    for (const [id, buffer] of drumEntries) {
      drums[id] = buffer
    }

    cachedKit = { drums, bass, piano }
    return cachedKit
  })()

  try {
    return await loadPromise
  } catch (error) {
    loadPromise = null
    throw error
  }
}

/** Test helper — clear the singleton kit. */
export function resetSampleKitForTests(): void {
  cachedKit = null
  loadPromise = null
}

/** Test helper — inject a prebuilt kit. */
export function setSampleKitForTests(kit: SampleKit | null): void {
  cachedKit = kit
  loadPromise = kit ? Promise.resolve(kit) : null
}
