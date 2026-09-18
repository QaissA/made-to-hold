import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'

/**
 * The Strava relief — a real walk, printed as terrain.
 *
 * The track is genuine lat/lon, not a decorative squiggle, and it is projected
 * the way a map has to be: longitude is compressed by cos(latitude), because a
 * degree of longitude is only cos(lat) as wide as a degree of latitude. Skip
 * that and a coastal walk comes out stretched east-west — at Casablanca's
 * latitude by about 12%.
 *
 * Height is the elevation profile; ribbon thickness is gradient, so the line
 * physically swells on the climbs. Nothing is drawn on the tile. The geometry
 * is the data.
 */

/** Corniche walk, Casablanca — [lon, lat, elevation m]. */
const TRACK: [number, number, number][] = [
  [-7.6699, 33.5921, 12],
  [-7.6742, 33.5938, 15],
  [-7.6781, 33.5961, 19],
  [-7.6809, 33.5994, 26],
  [-7.6828, 33.6031, 34],
  [-7.6835, 33.6072, 41],
  [-7.6826, 33.6114, 46],
  [-7.6798, 33.6146, 43],
  [-7.6757, 33.6163, 36],
  [-7.6712, 33.6168, 28],
  [-7.6668, 33.6157, 22],
  [-7.6634, 33.6132, 18],
  [-7.6617, 33.6098, 16],
  [-7.6621, 33.6059, 14],
  [-7.6646, 33.6024, 13],
  [-7.6678, 33.5988, 12],
  [-7.6697, 33.5951, 11],
]

const TILE = 1.9
const TILE_DEPTH = 0.1

/** Value noise for the surrounding terrain. */
function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  return (
    hash2(xi, yi) * (1 - u) * (1 - v) +
    hash2(xi + 1, yi) * u * (1 - v) +
    hash2(xi, yi + 1) * (1 - u) * v +
    hash2(xi + 1, yi + 1) * u * v
  )
}

function fbm(x: number, y: number, octaves = 4) {
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

type Projected = { points: THREE.Vector3[]; radii: number[] }

/**
 * Equirectangular projection with the cos(latitude) correction, centred and
 * scaled to fit the tile. Elevation is normalised against the track's own
 * range so any walk fills the same relief depth.
 */
function projectTrack(): Projected {
  const lat0 =
    TRACK.reduce((sum, p) => sum + p[1], 0) / TRACK.length
  const lonScale = Math.cos((lat0 * Math.PI) / 180)

  const raw = TRACK.map(([lon, lat, ele]) => ({
    x: lon * lonScale,
    z: lat,
    ele,
  }))

  const xs = raw.map((p) => p.x)
  const zs = raw.map((p) => p.z)
  const eles = raw.map((p) => p.ele)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...zs) - Math.min(...zs),
  )
  // Aspect is preserved: one scale for both axes, never fitted per-axis.
  const scale = (TILE * 0.74) / span

  const eleMin = Math.min(...eles)
  const eleMax = Math.max(...eles)
  const eleSpan = Math.max(1, eleMax - eleMin)

  const points = raw.map(
    (p) =>
      new THREE.Vector3(
        (p.x - cx) * scale,
        0.055 + ((p.ele - eleMin) / eleSpan) * 0.2,
        // Latitude increases north; -Z is "up" the tile as viewed.
        -(p.z - cz) * scale,
      ),
  )

  // Gradient between samples drives ribbon thickness.
  const radii = points.map((_, i) => {
    const prev = points[Math.max(0, i - 1)]
    const next = points[Math.min(points.length - 1, i + 1)]
    const run = prev.distanceTo(next)
    const rise = Math.abs(next.y - prev.y)
    const grade = run > 1e-5 ? rise / run : 0
    return 0.018 + Math.min(0.022, grade * 0.09)
  })

  return { points, radii }
}

export function RouteRelief() {

  const { terrain, ribbon, markers } = useMemo(() => {
    const { points, radii } = projectTrack()

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)
    const samples = 420
    const frames = curve.computeFrenetFrames(samples, false)

    // Hand-built tube so the radius can vary along the path.
    const radial = 8
    const pos: number[] = []
    const nor: number[] = []
    const idx: number[] = []
    const tmp = new THREE.Vector3()

    for (let i = 0; i <= samples; i++) {
      const u = i / samples
      const p = curve.getPointAt(u)
      const n = frames.normals[Math.min(i, samples - 1)]
      const b = frames.binormals[Math.min(i, samples - 1)]
      // Radii are per control point; resample along the curve.
      const r = radii[Math.min(radii.length - 1, Math.round(u * (radii.length - 1)))]

      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2
        tmp
          .copy(n)
          .multiplyScalar(Math.cos(a))
          .addScaledVector(b, Math.sin(a))
        nor.push(tmp.x, tmp.y, tmp.z)
        pos.push(p.x + tmp.x * r, p.y + tmp.y * r, p.z + tmp.z * r)
      }
    }

    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < radial; j++) {
        const jn = (j + 1) % radial
        const a = i * radial + j
        const b2 = i * radial + jn
        const c = (i + 1) * radial + j
        const d = (i + 1) * radial + jn
        idx.push(a, c, b2, b2, c, d)
      }
    }

    const ribbonGeo = new THREE.BufferGeometry()
    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    ribbonGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
    ribbonGeo.setIndex(idx)

    // Terrain: noise, pushed down into a valley near the track so the route
    // sits in the landscape rather than floating over it.
    const seg = 140
    const terrainGeo = new THREE.PlaneGeometry(TILE, TILE, seg, seg)
    terrainGeo.rotateX(-Math.PI / 2)
    const attr = terrainGeo.attributes.position

    for (let i = 0; i < attr.count; i++) {
      const x = attr.getX(i)
      const z = attr.getZ(i)
      let near = Infinity
      for (let k = 0; k < points.length; k++) {
        const dx = points[k].x - x
        const dz = points[k].z - z
        const d = dx * dx + dz * dz
        if (d < near) near = d
      }
      const dist = Math.sqrt(near)

      const hills = fbm((x + 5) * 2.4, (z + 5) * 2.4, 4) * 0.13
      const valley = Math.exp(-(dist * dist) * 26) * 0.055
      attr.setY(i, 0.02 + hills - valley)
    }
    attr.needsUpdate = true
    terrainGeo.computeVertexNormals()

    return {
      terrain: terrainGeo,
      ribbon: ribbonGeo,
      markers: [points[0], points[points.length - 1]],
    }
  }, [])

  useEffect(
    () => () => {
      terrain.dispose()
      ribbon.dispose()
    },
    [terrain, ribbon],
  )

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, -TILE_DEPTH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[TILE, TILE_DEPTH, TILE]} />
        <meshStandardMaterial color="#2C2A26" roughness={0.78} metalness={0.05} />
      </mesh>

      {/* Terrain */}
      <mesh geometry={terrain} castShadow receiveShadow>
        <meshStandardMaterial color="#6C7358" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* The route */}
      <mesh geometry={ribbon} castShadow receiveShadow>
        <meshStandardMaterial
          color={PALETTE.ember}
          roughness={0.5}
          metalness={0.03}
        />
      </mesh>

      {/* Start and finish */}
      {markers.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + 0.03, p.z]} castShadow>
          <sphereGeometry args={[0.028, 16, 12]} />
          <meshStandardMaterial
            color={i === 0 ? '#F2EDE3' : PALETTE.majorelle}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}
