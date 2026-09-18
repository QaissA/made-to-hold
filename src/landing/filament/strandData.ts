import * as THREE from 'three'
import {
  knotCurve,
  portraitCurve,
  routeCurve,
  spoolCurve,
  STRAND_SAMPLES as N,
  vaseCurve,
  type StrandCurve,
  type StrandId,
} from './curves'

/**
 * Bakes every form of the strand into data textures the vertex shader reads.
 *
 * The tube is never built on the CPU. We upload, per curve, the sample
 * position + radius and a rotation-minimising frame (normal, binormal); the
 * shader reconstructs the tube ring by ring. Morphing between two forms is
 * then a texture-row mix, which is why the strand can flow continuously from a
 * vase into a route into a face without a single geometry rebuild.
 */

export const STRAND_ORDER: StrandId[] = [
  'vase',
  'route',
  'portrait',
  'knot',
  'spool',
]

export const STRAND_ROW: Record<StrandId, number> = {
  vase: 0,
  route: 1,
  portrait: 2,
  knot: 3,
  spool: 4,
}

export type StrandData = {
  /** xyz + radius per sample */
  position: THREE.DataTexture
  /** rotation-minimising frame */
  normal: THREE.DataTexture
  binormal: THREE.DataTexture
  /** CPU copy, so the extruder head can sit exactly on the strand */
  curves: Record<StrandId, StrandCurve>
  boundingRadius: number
  dispose: () => void
}

/**
 * Rotation-minimising frames (the same parallel transport three uses for
 * TubeGeometry). Frenet frames flip at inflection points; this does not, which
 * matters because two frames get *mixed* during a morph.
 */
function computeFrames(positions: Float32Array) {
  const normals = new Float32Array(N * 3)
  const binormals = new Float32Array(N * 3)

  const tangents: THREE.Vector3[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()

  for (let i = 0; i < N; i++) {
    const prev = Math.max(0, i - 1)
    const next = Math.min(N - 1, i + 1)
    a.fromArray(positions, next * 3)
    b.fromArray(positions, prev * 3)
    const t = a.clone().sub(b)
    if (t.lengthSq() < 1e-12) t.set(0, 0, 1)
    tangents.push(t.normalize())
  }

  // Seed the frame on the axis least aligned with the first tangent.
  const t0 = tangents[0]
  const ax = Math.abs(t0.x)
  const ay = Math.abs(t0.y)
  const az = Math.abs(t0.z)
  const seed = new THREE.Vector3()
  if (ax <= ay && ax <= az) seed.set(1, 0, 0)
  else if (ay <= az) seed.set(0, 1, 0)
  else seed.set(0, 0, 1)

  const normal = new THREE.Vector3().crossVectors(t0, seed).normalize()
  const binormal = new THREE.Vector3()
  const axis = new THREE.Vector3()

  for (let i = 0; i < N; i++) {
    if (i > 0) {
      axis.crossVectors(tangents[i - 1], tangents[i])
      if (axis.lengthSq() > 1e-12) {
        axis.normalize()
        const dot = Math.min(1, Math.max(-1, tangents[i - 1].dot(tangents[i])))
        normal.applyAxisAngle(axis, Math.acos(dot))
      }
      // Re-orthogonalise; transport accumulates drift over 4k samples.
      normal.addScaledVector(tangents[i], -normal.dot(tangents[i])).normalize()
    }

    binormal.crossVectors(tangents[i], normal).normalize()
    normal.toArray(normals, i * 3)
    binormal.toArray(binormals, i * 3)
  }

  return { normals, binormals }
}

function dataTexture(data: Float32Array, rows: number): THREE.DataTexture {
  const tex = new THREE.DataTexture(
    data,
    N,
    rows,
    THREE.RGBAFormat,
    THREE.FloatType,
  )
  // Rows are sampled exactly at texel centres, so nearest is correct and
  // avoids needing OES_texture_float_linear.
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}

export function buildStrandData(portrait: HTMLImageElement): StrandData {
  const curves: Record<StrandId, StrandCurve> = {
    vase: vaseCurve(),
    route: routeCurve(),
    portrait: portraitCurve(portrait),
    knot: knotCurve(),
    spool: spoolCurve(),
  }

  const rows = STRAND_ORDER.length
  const posData = new Float32Array(N * rows * 4)
  const nrmData = new Float32Array(N * rows * 4)
  const binData = new Float32Array(N * rows * 4)

  let boundingRadius = 0

  STRAND_ORDER.forEach((id, row) => {
    const curve = curves[id]
    const { normals, binormals } = computeFrames(curve.positions)
    const offset = row * N * 4

    for (let i = 0; i < N; i++) {
      const o = offset + i * 4
      const p = i * 3

      posData[o] = curve.positions[p]
      posData[o + 1] = curve.positions[p + 1]
      posData[o + 2] = curve.positions[p + 2]
      posData[o + 3] = curve.radii[i]

      nrmData[o] = normals[p]
      nrmData[o + 1] = normals[p + 1]
      nrmData[o + 2] = normals[p + 2]

      binData[o] = binormals[p]
      binData[o + 1] = binormals[p + 1]
      binData[o + 2] = binormals[p + 2]

      const d =
        Math.hypot(
          curve.positions[p],
          curve.positions[p + 1],
          curve.positions[p + 2],
        ) + curve.radii[i]
      if (d > boundingRadius) boundingRadius = d
    }
  })

  const position = dataTexture(posData, rows)
  const normal = dataTexture(nrmData, rows)
  const binormal = dataTexture(binData, rows)

  return {
    position,
    normal,
    binormal,
    curves,
    boundingRadius,
    dispose: () => {
      position.dispose()
      normal.dispose()
      binormal.dispose()
    },
  }
}

/** Row centre in texture V space, for sampling a specific form. */
export function rowV(id: StrandId): number {
  return (STRAND_ROW[id] + 0.5) / STRAND_ORDER.length
}
