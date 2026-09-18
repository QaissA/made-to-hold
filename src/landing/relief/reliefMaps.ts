import * as THREE from 'three'
import { PALETTE } from '../../config/palette'

/**
 * Relief plates for the print bed.
 *
 * Every product on the site is the same bed printing a different plate, so all
 * three plates share one contract: a linear `height` map (bed = 0, rim ~0.33,
 * relief up to 1) and an sRGB `albedo` map. The bed shader clamps height to the
 * rising print frontier, which is what makes the object grow layer by layer.
 */
export type ReliefPlate = {
  height: THREE.CanvasTexture
  albedo: THREE.CanvasTexture
}

export const RELIEF_SIZE = 512

/** Normalised plaque inset inside the texture (leaves visible bare bed). */
const INSET = 0.085
const BED_H = 0.0
const BASE_H = 0.2
const RIM_H = 0.33

// --- noise ----------------------------------------------------------------

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}

function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp
    freq *= 2.07
    amp *= 0.5
  }
  return sum
}

// --- canvas helpers -------------------------------------------------------

function makeCanvas(size = RELIEF_SIZE) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx, size }
}

function gray(v: number): string {
  const c = Math.round(Math.min(1, Math.max(0, v)) * 255)
  return 'rgb(' + c + ',' + c + ',' + c + ')'
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

type Plaque = { x: number; y: number; w: number; h: number; r: number }

function plaqueRect(size: number): Plaque {
  const pad = size * INSET
  return { x: pad, y: pad, w: size - pad * 2, h: size - pad * 2, r: size * 0.045 }
}

/** Bed + plaque base + raised rim, shared by every height plate. */
function drawHeightBase(ctx: CanvasRenderingContext2D, size: number): Plaque {
  ctx.fillStyle = gray(BED_H)
  ctx.fillRect(0, 0, size, size)

  const p = plaqueRect(size)
  ctx.fillStyle = gray(RIM_H)
  roundRect(ctx, p.x, p.y, p.w, p.h, p.r)
  ctx.fill()

  const inner = size * 0.028
  ctx.fillStyle = gray(BASE_H)
  roundRect(
    ctx,
    p.x + inner,
    p.y + inner,
    p.w - inner * 2,
    p.h - inner * 2,
    p.r * 0.7,
  )
  ctx.fill()

  return p
}

function drawAlbedoBase(
  ctx: CanvasRenderingContext2D,
  size: number,
  plate: string,
  rim: string,
): Plaque {
  ctx.fillStyle = '#0b0b0f'
  ctx.fillRect(0, 0, size, size)

  const p = plaqueRect(size)
  ctx.fillStyle = rim
  roundRect(ctx, p.x, p.y, p.w, p.h, p.r)
  ctx.fill()

  const inner = size * 0.028
  ctx.fillStyle = plate
  roundRect(
    ctx,
    p.x + inner,
    p.y + inner,
    p.w - inner * 2,
    p.h - inner * 2,
    p.r * 0.7,
  )
  ctx.fill()

  return p
}

function heightTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}

function albedoTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

// --- 01 EFFORT: the route relief ------------------------------------------

/** Normalised GPX-ish trace, in plaque space (0-1). */
const ROUTE: [number, number][] = [
  [0.11, 0.72],
  [0.2, 0.55],
  [0.3, 0.62],
  [0.38, 0.4],
  [0.47, 0.5],
  [0.55, 0.28],
  [0.64, 0.42],
  [0.72, 0.3],
  [0.8, 0.46],
  [0.89, 0.26],
]

function traceRoute(
  ctx: CanvasRenderingContext2D,
  p: Plaque,
  width: number,
  stroke: string,
) {
  ctx.save()
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = stroke
  ctx.beginPath()
  for (let i = 0; i < ROUTE.length; i++) {
    const x = p.x + ROUTE[i][0] * p.w
    const y = p.y + ROUTE[i][1] * p.h
    if (i === 0) {
      ctx.moveTo(x, y)
      continue
    }
    const px = p.x + ROUTE[i - 1][0] * p.w
    const py = p.y + ROUTE[i - 1][1] * p.h
    ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2)
    ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.restore()
}

export function createRoutePlate(): ReliefPlate {
  const h = makeCanvas()
  const p = drawHeightBase(h.ctx, h.size)

  // Terrain inside the plaque, painted per-pixel.
  const img = h.ctx.getImageData(0, 0, h.size, h.size)
  const data = img.data
  const floor = BASE_H * 255 - 4
  for (let y = 0; y < h.size; y++) {
    for (let x = 0; x < h.size; x++) {
      const i = (y * h.size + x) * 4
      if (data[i] < floor) continue // bare bed
      if (data[i] > RIM_H * 255 - 4) continue // rim stays flat
      const terrain = fbm((x / h.size) * 5.5, (y / h.size) * 5.5, 4)
      const ridged = 1 - Math.abs(terrain - 0.5) * 2
      const v = BASE_H + terrain * 0.16 + ridged * ridged * 0.07
      const c = Math.round(Math.min(1, v) * 255)
      data[i] = data[i + 1] = data[i + 2] = c
    }
  }
  h.ctx.putImageData(img, 0, 0)

  traceRoute(h.ctx, p, h.size * 0.062, gray(0.44))
  traceRoute(h.ctx, p, h.size * 0.034, gray(0.62))
  traceRoute(h.ctx, p, h.size * 0.013, gray(0.78))

  const a = makeCanvas()
  const ap = drawAlbedoBase(a.ctx, a.size, '#39402f', '#20231b')
  const grad = a.ctx.createLinearGradient(0, 0, a.size, a.size)
  grad.addColorStop(0, 'rgba(31,110,92,0.55)')
  grad.addColorStop(0.6, 'rgba(58,62,44,0.2)')
  grad.addColorStop(1, 'rgba(120,88,52,0.45)')
  a.ctx.fillStyle = grad
  roundRect(a.ctx, ap.x, ap.y, ap.w, ap.h, ap.r)
  a.ctx.fill()

  traceRoute(a.ctx, ap, a.size * 0.05, 'rgba(255,106,43,0.35)')
  traceRoute(a.ctx, ap, a.size * 0.024, PALETTE.ember)
  traceRoute(a.ctx, ap, a.size * 0.009, '#ffd9b0')

  return { height: heightTexture(h.canvas), albedo: albedoTexture(a.canvas) }
}

// --- 02 LIGHT: the lithophane ---------------------------------------------

export function createFacePlate(image: HTMLImageElement): ReliefPlate {
  const h = makeCanvas()
  const p = drawHeightBase(h.ctx, h.size)

  const inner = h.size * 0.028
  const box = {
    x: p.x + inner * 2,
    y: p.y + inner * 2,
    w: p.w - inner * 4,
    h: p.h - inner * 4,
  }

  // Cover-fit the portrait into the square window, biased up the frame so the
  // crop lands on the face rather than on the shoulders.
  const scale = Math.max(box.w / image.width, box.h / image.height)
  const dw = image.width * scale
  const dh = image.height * scale
  const FACE_BIAS = 0.26

  const tmp = makeCanvas(h.size)
  tmp.ctx.save()
  tmp.ctx.beginPath()
  tmp.ctx.rect(box.x, box.y, box.w, box.h)
  tmp.ctx.clip()
  // Slight blur: a lithophane is a thickness field, not a photo. Without it,
  // high-frequency detail (stripes, hair) prints as noise.
  tmp.ctx.filter = 'grayscale(1) contrast(1.08) brightness(1.04) blur(1.6px)'
  tmp.ctx.drawImage(
    image,
    box.x + (box.w - dw) / 2,
    box.y + (box.h - dh) * FACE_BIAS,
    dw,
    dh,
  )
  tmp.ctx.restore()

  const src = tmp.ctx.getImageData(0, 0, h.size, h.size)
  const dst = h.ctx.getImageData(0, 0, h.size, h.size)
  for (let y = 0; y < h.size; y++) {
    for (let x = 0; x < h.size; x++) {
      if (x < box.x || x > box.x + box.w || y < box.y || y > box.y + box.h) {
        continue
      }
      const i = (y * h.size + x) * 4
      const lum =
        (src.data[i] * 0.2126 +
          src.data[i + 1] * 0.7152 +
          src.data[i + 2] * 0.0722) /
        255
      // Bright photo -> thick relief, so raking light rebuilds the face.
      const v = BASE_H + lum * 0.66
      const c = Math.round(Math.min(1, v) * 255)
      dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = c
    }
  }
  h.ctx.putImageData(dst, 0, 0)

  // Albedo: a lithophane is uniformly bone. The image is pure geometry.
  const a = makeCanvas()
  drawAlbedoBase(a.ctx, a.size, '#efe7da', '#d9cfbe')

  return { height: heightTexture(h.canvas), albedo: albedoTexture(a.canvas) }
}

// --- 03 HERITAGE: the zellij khatam ---------------------------------------

function starPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  rotation = 0,
  points = 8,
) {
  const r = R * 0.552
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? R : r
    const ang = (i / (points * 2)) * Math.PI * 2 + rotation
    const x = cx + Math.cos(ang) * rad
    const y = cy + Math.sin(ang) * rad
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function diamondPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r, cy)
  ctx.lineTo(cx, cy + r)
  ctx.lineTo(cx - r, cy)
  ctx.closePath()
}

const ZELLIJ_TILES = 4

type ZellijPaint = {
  ground: string
  star: (i: number, j: number) => string
  knot: (i: number, j: number) => string
  grout?: string
  groutWidth?: number
}

function drawZellij(
  ctx: CanvasRenderingContext2D,
  p: Plaque,
  paint: ZellijPaint,
) {
  ctx.save()
  ctx.beginPath()
  const inner = 6
  ctx.rect(p.x + inner, p.y + inner, p.w - inner * 2, p.h - inner * 2)
  ctx.clip()

  ctx.fillStyle = paint.ground
  ctx.fillRect(p.x, p.y, p.w, p.h)

  const pitch = p.w / ZELLIJ_TILES
  const R = pitch * 0.46
  ctx.lineWidth = paint.groutWidth ?? 2
  ctx.strokeStyle = paint.grout ?? 'transparent'

  for (let j = -1; j <= ZELLIJ_TILES + 1; j++) {
    for (let i = -1; i <= ZELLIJ_TILES + 1; i++) {
      const cx = p.x + (i + 0.5) * pitch
      const cy = p.y + (j + 0.5) * pitch

      starPath(ctx, cx, cy, R, Math.PI / 8)
      ctx.fillStyle = paint.star(i, j)
      ctx.fill()
      if (paint.grout) ctx.stroke()

      diamondPath(ctx, cx + pitch / 2, cy + pitch / 2, pitch * 0.2)
      ctx.fillStyle = paint.knot(i, j)
      ctx.fill()
      if (paint.grout) ctx.stroke()
    }
  }

  ctx.restore()
}

export function createZellijPlate(): ReliefPlate {
  const h = makeCanvas()
  const p = drawHeightBase(h.ctx, h.size)

  drawZellij(h.ctx, p, {
    ground: gray(0.26),
    star: (i, j) => gray(Math.abs(i + j) % 2 === 0 ? 0.88 : 0.72),
    knot: () => gray(0.52),
    grout: gray(0.2),
    groutWidth: 3,
  })

  const a = makeCanvas()
  const ap = drawAlbedoBase(a.ctx, a.size, '#15131f', '#0f0d16')
  const starColors = [PALETTE.majorelle, PALETTE.majorelleBright, PALETTE.jade]
  const knotColors = [PALETTE.ember, PALETTE.amber]

  drawZellij(a.ctx, ap, {
    ground: 'rgba(23,21,34,0.32)',
    star: (i, j) => starColors[Math.abs(i * 3 + j * 5) % starColors.length],
    knot: (i, j) => knotColors[Math.abs(i + j) % knotColors.length],
    grout: 'rgba(242,237,227,0.32)',
    groutWidth: 2,
  })

  return { height: heightTexture(h.canvas), albedo: albedoTexture(a.canvas) }
}

export function disposePlate(plate: ReliefPlate) {
  plate.height.dispose()
  plate.albedo.dispose()
}
