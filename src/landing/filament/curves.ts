/**
 * The five forms the strand takes.
 *
 * Every product in the studio is one unbroken filament path, so every curve
 * here is sampled to the SAME point count with the same parameterisation.
 * That is what lets one form melt directly into the next: morphing is a plain
 * mix between two rows of baked samples, never a cut and re-print.
 *
 * Each sample carries its own strand radius, so thickness is data — elevation
 * gradient on the route, image luminance on the portrait.
 */

export const STRAND_SAMPLES = 4096

export type StrandCurve = {
  id: StrandId
  /** xyz per sample, length STRAND_SAMPLES * 3 */
  positions: Float32Array
  /** world-unit strand radius per sample */
  radii: Float32Array
}

export type StrandId = 'vase' | 'route' | 'portrait' | 'knot' | 'spool'

const N = STRAND_SAMPLES

// --- noise ----------------------------------------------------------------

function hash(x: number): number {
  const s = Math.sin(x * 127.1) * 43758.5453
  return s - Math.floor(s)
}

function noise1(x: number): number {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i) * (1 - u) + hash(i + 1) * u
}

function fbm1(x: number, octaves = 4): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  for (let o = 0; o < octaves; o++) {
    sum += noise1(x * freq) * amp
    freq *= 2.03
    amp *= 0.5
  }
  return sum
}

// --- 01 vase --------------------------------------------------------------

/**
 * Spiralised vase — the single-wall print every FDM owner makes first, and the
 * purest statement of "one continuous line": no layer ever ends.
 */
/** Foot, belly, shoulder, neck, flared lip — read bottom to top. */
const VASE_PROFILE: [number, number][] = [
  [0.0, 0.3],
  [0.08, 0.5],
  [0.26, 0.76],
  [0.42, 0.82],
  [0.58, 0.7],
  [0.74, 0.43],
  [0.86, 0.33],
  [0.94, 0.34],
  [1.0, 0.47],
]

function vaseRadius(u: number): number {
  for (let i = 1; i < VASE_PROFILE.length; i++) {
    const [u1, r1] = VASE_PROFILE[i]
    if (u > u1) continue
    const [u0, r0] = VASE_PROFILE[i - 1]
    const t = (u - u0) / (u1 - u0)
    return r0 + (r1 - r0) * (t * t * (3 - 2 * t))
  }
  return VASE_PROFILE[VASE_PROFILE.length - 1][1]
}

export function vaseCurve(): StrandCurve {
  const positions = new Float32Array(N * 3)
  const radii = new Float32Array(N)
  const turns = 32

  for (let i = 0; i < N; i++) {
    const u = i / (N - 1)
    const a = u * turns * Math.PI * 2
    const r = vaseRadius(u) + 0.045 * Math.sin(u * Math.PI * 9)

    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 1] = -1.05 + u * 2.1
    positions[i * 3 + 2] = Math.sin(a) * r
    radii[i] = 0.021
  }

  return { id: 'vase', positions, radii }
}

// --- 02 route -------------------------------------------------------------

/** The same trace as the v1 relief, now flown as a line through space. */
const ROUTE: [number, number][] = [
  [-0.95, 0.42],
  [-0.68, -0.05],
  [-0.4, 0.2],
  [-0.14, -0.3],
  [0.1, -0.02],
  [0.32, -0.42],
  [0.55, -0.1],
  [0.76, -0.34],
  [0.95, 0.04],
]

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

/**
 * Elevation is the run's actual profile; strand thickness is gradient, so the
 * line physically swells on the climbs. The data is the object.
 */
export function routeCurve(): StrandCurve {
  const positions = new Float32Array(N * 3)
  const radii = new Float32Array(N)
  const segs = ROUTE.length - 1

  // A real run: a long climb, a false summit, a descent.
  const elevation = (u: number) =>
    0.46 * Math.sin(u * Math.PI) + 0.3 * fbm1(u * 6.5) - 0.17

  for (let i = 0; i < N; i++) {
    const u = i / (N - 1)
    const f = u * segs
    const s = Math.min(segs - 1, Math.floor(f))
    const t = f - s

    const i0 = Math.max(0, s - 1)
    const i1 = s
    const i2 = Math.min(segs, s + 1)
    const i3 = Math.min(segs, s + 2)

    const x = catmull(ROUTE[i0][0], ROUTE[i1][0], ROUTE[i2][0], ROUTE[i3][0], t)
    const z = catmull(ROUTE[i0][1], ROUTE[i1][1], ROUTE[i2][1], ROUTE[i3][1], t)
    const y = elevation(u)

    positions[i * 3] = x * 1.9
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z * 1.5

    const du = 1 / (N - 1)
    const grade = Math.abs(elevation(Math.min(1, u + du)) - y) / du
    radii[i] = 0.012 + Math.min(0.026, grade * 0.019)
  }

  return { id: 'route', positions, radii }
}

// --- 03 portrait ----------------------------------------------------------

/**
 * A single Archimedean spiral whose thickness follows image luminance. Nothing
 * is drawn — the face emerges purely from how much filament is laid down: the
 * turns touch and merge in the highlights, and open into gaps in the shadows.
 */
export function portraitCurve(image: HTMLImageElement): StrandCurve {
  const positions = new Float32Array(N * 3)
  const radii = new Float32Array(N)

  const size = 320
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)

  // Cover-fit, biased up the frame so the crop lands on the face.
  const scale = Math.max(size / image.width, size / image.height)
  const dw = image.width * scale
  const dh = image.height * scale
  ctx.filter = 'grayscale(1) contrast(1.45) brightness(1.02) blur(1px)'
  ctx.drawImage(image, (size - dw) / 2, (size - dh) * 0.26, dw, dh)

  const px = ctx.getImageData(0, 0, size, size).data
  const lumAt = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(size - 1, Math.round(x)))
    const cy = Math.max(0, Math.min(size - 1, Math.round(y)))
    const i = (cy * size + cx) * 4
    return (px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722) / 255
  }

  const turns = 48
  const rMax = 1.15

  for (let i = 0; i < N; i++) {
    const u = i / (N - 1)
    const a = u * turns * Math.PI * 2
    const r = 0.05 + u * rMax

    const x = Math.cos(a) * r
    const y = Math.sin(a) * r

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    // A whisper of depth so the coil catches light instead of reading as print.
    positions[i * 3 + 2] = Math.sin(a * 0.5) * 0.02

    const lum = lumAt(
      ((x / rMax) * 0.5 + 0.5) * size,
      (0.5 - (y / rMax) * 0.5) * size,
    )
    // Thick where the photo is BRIGHT. The filament is bone on a dark ground,
    // so mass reads as light and the gaps between thin turns read as shadow —
    // invert this and the portrait comes out as its own negative.
    radii[i] = 0.002 + lum ** 1.15 * 0.022
  }

  return { id: 'portrait', positions, radii }
}

// --- 04 knot --------------------------------------------------------------

/**
 * An (8,3) torus knot: eight-fold symmetry reached by one closed path that
 * crosses itself — which is exactly what zellij is, drawn instead of cut.
 */
export function knotCurve(): StrandCurve {
  const positions = new Float32Array(N * 3)
  const radii = new Float32Array(N)
  const p = 8
  const q = 3
  const R = 0.88

  for (let i = 0; i < N; i++) {
    const u = i / (N - 1)
    const t = u * Math.PI * 2 * p
    const qt = (q / p) * t
    const cs = Math.cos(qt)

    positions[i * 3] = R * (2 + cs) * 0.5 * Math.cos(t)
    positions[i * 3 + 1] = R * (2 + cs) * 0.5 * Math.sin(t)
    positions[i * 3 + 2] = R * Math.sin(qt) * 0.62

    radii[i] = 0.032
  }

  return { id: 'knot', positions, radii }
}

// --- 05 spool -------------------------------------------------------------

/** Filament wound back onto the reel — the job closed out. */
export function spoolCurve(): StrandCurve {
  const positions = new Float32Array(N * 3)
  const radii = new Float32Array(N)
  const layers = 8
  const turnsPerLayer = 7

  for (let i = 0; i < N; i++) {
    const u = i / (N - 1)
    const layerF = u * layers
    const layer = Math.floor(layerF)
    const across = layerF - layer

    // Alternate traverse direction so the winding criss-crosses like a real reel.
    const y = (layer % 2 === 0 ? across : 1 - across) * 0.78 - 0.39
    const r = 0.52 + layer * 0.062
    const a = across * turnsPerLayer * Math.PI * 2

    positions[i * 3] = Math.cos(a) * r
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = Math.sin(a) * r
    radii[i] = 0.014
  }

  return { id: 'spool', positions, radii }
}
