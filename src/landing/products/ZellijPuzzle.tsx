import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { stage } from '../scroll/stage'
import type { RevealRef } from '../scenes/ProductStage'
import {
  buildPanel,
  buildPieceGeometries,
  panelExtent,
  type PieceKind,
} from './zellijPattern'

/**
 * The zellij puzzle — pigmented PLA, five colours, forty-one pieces.
 *
 * Every piece is real geometry with its own place, because that is the product:
 * a khatam tessellation that comes apart in your hands and goes back together
 * only one way. Assembly is staggered by distance from centre, so it reads as
 * the pattern resolving inward rather than a batch of objects appearing.
 */

/** Pigmented PLA, five colours — matches the spec copy. */
const COLOURWAY = [
  PALETTE.majorelle,
  PALETTE.jade,
  PALETTE.ember,
  PALETTE.amber,
  '#E8E2D6',
] as const

const TILES = 4

export function ZellijPuzzle({ reveal }: { reveal: RevealRef }) {
  const geometries = useMemo(() => buildPieceGeometries(), [])
  const pieces = useMemo(() => buildPanel(TILES), [])
  const extent = useMemo(() => panelExtent(TILES), [])

  // One InstancedMesh per (shape, colour) pair keeps the whole panel down to a
  // handful of draw calls while still letting every piece move on its own.
  const groups = useMemo(() => {
    const byKey = new Map<
      string,
      { kind: PieceKind; colour: number; items: typeof pieces }
    >()
    pieces.forEach((piece) => {
      const key = `${piece.kind}:${piece.colour}`
      let group = byKey.get(key)
      if (!group) {
        group = { kind: piece.kind, colour: piece.colour, items: [] }
        byKey.set(key, group)
      }
      group.items.push(piece)
    })
    return [...byKey.values()]
  }, [pieces])

  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const maxRadius = useMemo(
    () => pieces.reduce((m, p) => Math.max(m, p.radius), 0),
    [pieces],
  )

  useEffect(
    () => () => {
      Object.values(geometries).forEach((g) => g.dispose())
    },
    [geometries],
  )

  useFrame((state) => {
    const t = stage.reduced ? 0 : state.clock.elapsedTime

    groups.forEach((group, gi) => {
      const mesh = meshes.current[gi]
      if (!mesh) return

      group.items.forEach((piece, i) => {
        // Pieces settle from the outside in, so the rosette resolves toward
        // its centre instead of all landing at once.
        const delay = (piece.radius / Math.max(maxRadius, 0.001)) * 0.45
        const local = THREE.MathUtils.clamp(
          (reveal.current - delay) / (1 - delay || 1),
          0,
          1,
        )
        const eased = 1 - (1 - local) ** 3

        const drop = (1 - eased) * 0.75
        const float = stage.reduced
          ? 0
          : Math.sin(t * 0.7 + piece.radius * 2.4) * 0.006 * eased

        dummy.position.set(piece.x, drop + float, piece.z)
        dummy.rotation.set(0, piece.rotation + (1 - eased) * 0.7, 0)
        dummy.scale.setScalar(0.35 + eased * 0.65)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })

      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <group>
      {/* The tray the puzzle sits in — gives the pieces somewhere to belong */}
      <mesh position={[0, -0.055, 0]} receiveShadow castShadow>
        <boxGeometry args={[extent * 2 + 0.16, 0.07, extent * 2 + 0.16]} />
        <meshStandardMaterial color="#1A1512" roughness={0.9} metalness={0} />
      </mesh>
      {/* Recessed floor, so the grout gaps read as depth not as holes */}
      <mesh position={[0, -0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[extent * 2, extent * 2]} />
        <meshStandardMaterial color="#0E0B09" roughness={0.95} />
      </mesh>

      {groups.map((group, gi) => (
        <instancedMesh
          key={`${group.kind}-${group.colour}`}
          ref={(node) => {
            meshes.current[gi] = node
          }}
          args={[geometries[group.kind], undefined, group.items.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        >
          <meshStandardMaterial
            color={COLOURWAY[group.colour % COLOURWAY.length]}
            roughness={0.44}
            metalness={0.02}
          />
        </instancedMesh>
      ))}
    </group>
  )
}
