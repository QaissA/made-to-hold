import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { stage } from '../scroll/stage'

const GRID = 24
const PITCH = 0.92
const CLEAR = 2.6
const BASE_Y = -1.25

function starShape(outer: number, inner: number, points = 8) {
  const shape = new THREE.Shape()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

type Tile = { x: number; z: number; phase: number; lift: number }

/**
 * The floor the studio stands on: a zellij lattice of extruded khatam stars,
 * receding into fog. Scrolling sends a slow wave through it, so the ground
 * feels like it is being printed too.
 */
export function ZellijFloor() {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(starShape(0.35, 0.185), {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.022,
      bevelSize: 0.018,
      bevelSegments: 1,
      curveSegments: 1,
    })
    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()
    return geo
  }, [])

  const tiles = useMemo<Tile[]>(() => {
    const out: Tile[] = []
    const half = (GRID - 1) / 2
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const x = (i - half) * PITCH
        const z = (j - half) * PITCH
        if (Math.abs(x) < CLEAR && Math.abs(z) < CLEAR) continue
        out.push({
          x,
          z,
          phase: Math.hypot(x, z),
          lift: (Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1,
        })
      }
    }
    return out
  }, [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const color = new THREE.Color()
    const accents = [
      PALETTE.majorelle,
      PALETTE.majorelleBright,
      PALETTE.jade,
      PALETTE.ember,
    ]

    for (let i = 0; i < tiles.length; i++) {
      const isAccent = i % 11 === 0
      const hex = isAccent ? accents[(i / 11) % accents.length | 0] : '#15141c'
      color.set(hex)
      if (isAccent) color.multiplyScalar(0.55)
      mesh.setColorAt(i, color)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [tiles])

  useEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry],
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const t = stage.reduced ? 0 : state.clock.elapsedTime
    const wave = stage.scroll * 9

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i]
      const ripple = Math.sin(tile.phase * 0.85 - t * 0.55 - wave) * 0.5 + 0.5
      dummy.position.set(
        tile.x,
        BASE_Y + ripple * 0.14 + tile.lift * 0.05,
        tile.z,
      )
      dummy.rotation.y = tile.lift * Math.PI
      const s = 0.82 + ripple * 0.16
      dummy.scale.set(s, 0.7 + ripple * 0.9, s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, tiles.length]}
      receiveShadow
      frustumCulled={false}
    >
      <meshStandardMaterial roughness={0.72} metalness={0.18} vertexColors />
    </instancedMesh>
  )
}
