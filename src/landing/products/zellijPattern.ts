import * as THREE from 'three'

/**
 * Khatam-8 zellij, built as discrete interlocking pieces.
 *
 * This is the real tessellation, not a texture of one: an eight-pointed star
 * (khatam) at every node of a square grid, a smaller rotated star at every cell
 * centre, and the elongated hexagons (safts) that bridge adjacent khatams.
 * Those three shapes tile the plane with a grout gap, which is exactly what
 * makes it a puzzle — every piece has a place and only one.
 *
 * Geometry is generated per distinct shape and shared; only transforms and
 * colours differ per piece, so the whole panel is a handful of geometries.
 */

export type PieceKind = 'khatam' | 'knot' | 'saft'

export type ZellijPiece = {
  kind: PieceKind
  /** Position in the panel's local XZ plane. */
  x: number
  z: number
  /** Rotation about Y. */
  rotation: number
  /** Index into the colourway. */
  colour: number
  /** Distance from panel centre, for staggering the assembly. */
  radius: number
}

/** Grid pitch between khatam centres, in world units. */
export const PITCH = 0.44
/** Grout gap left between neighbouring pieces. */
const GROUT = 0.016
/** Outer radius of the big star. Deliberately short of half-pitch — the safts
 *  need room, and khatams that touch read as a lattice, not a tessellation. */
const KHATAM_R = PITCH * 0.38
/** A true 8-point star from two overlapped squares. */
const STAR_INNER_RATIO = 0.5412

function starShape(outer: number, points = 8, rotation = 0): THREE.Shape {
  const shape = new THREE.Shape()
  const inner = outer * STAR_INNER_RATIO
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 + rotation
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

/**
 * The saft: the elongated hexagon that fills the gap between two adjacent
 * khatams. Its width is set by the flat the star presents to its neighbour,
 * and its length by whatever the two stars leave between them.
 */
function saftShape(): THREE.Shape {
  const halfLen = PITCH * 0.5 - KHATAM_R * STAR_INNER_RATIO - GROUT * 0.5
  const halfWid = KHATAM_R * STAR_INNER_RATIO * 0.92
  const tip = halfLen * 0.42

  const shape = new THREE.Shape()
  shape.moveTo(-halfLen, 0)
  shape.lineTo(-halfLen + tip, halfWid)
  shape.lineTo(halfLen - tip, halfWid)
  shape.lineTo(halfLen, 0)
  shape.lineTo(halfLen - tip, -halfWid)
  shape.lineTo(-halfLen + tip, -halfWid)
  shape.closePath()
  return shape
}

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.05,
  bevelEnabled: true,
  bevelThickness: 0.008,
  bevelSize: 0.007,
  bevelSegments: 2,
  curveSegments: 1,
}

/**
 * One geometry per shape, laid flat in XZ with the top face up, so pieces can
 * simply be positioned and rotated about Y.
 */
export function buildPieceGeometries(): Record<PieceKind, THREE.BufferGeometry> {
  const make = (shape: THREE.Shape, depth: number) => {
    const geo = new THREE.ExtrudeGeometry(shape, { ...EXTRUDE, depth })
    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()
    return geo
  }

  return {
    khatam: make(starShape(KHATAM_R, 8, Math.PI / 8), 0.056),
    knot: make(starShape(PITCH * 0.17, 8, 0), 0.05),
    saft: make(saftShape(), 0.05),
  }
}

/**
 * Lay out a square panel of `tiles` × `tiles` khatams plus the knots and safts
 * that lock them together.
 */
export function buildPanel(tiles = 4): ZellijPiece[] {
  const pieces: ZellijPiece[] = []
  const half = (tiles - 1) / 2

  const push = (
    kind: PieceKind,
    x: number,
    z: number,
    rotation: number,
    colour: number,
  ) => {
    pieces.push({ kind, x, z, rotation, colour, radius: Math.hypot(x, z) })
  }

  for (let j = 0; j < tiles; j++) {
    for (let i = 0; i < tiles; i++) {
      const x = (i - half) * PITCH
      const z = (j - half) * PITCH

      // The khatam itself.
      push('khatam', x, z, 0, (i * 3 + j * 5) % 3)

      // The small star locking four khatams together.
      if (i < tiles - 1 && j < tiles - 1) {
        push('knot', x + PITCH / 2, z + PITCH / 2, Math.PI / 8, 3 + ((i + j) % 2))
      }

      // Safts bridge horizontally and vertically to the next khatam.
      if (i < tiles - 1) push('saft', x + PITCH / 2, z, 0, (i + j) % 2)
      if (j < tiles - 1) {
        push('saft', x, z + PITCH / 2, Math.PI / 2, (i + j + 1) % 2)
      }
    }
  }

  return pieces
}

/** Panel half-extent, for sizing the tray it sits in. */
export function panelExtent(tiles = 4): number {
  return ((tiles - 1) * PITCH) / 2 + PITCH / 2
}
