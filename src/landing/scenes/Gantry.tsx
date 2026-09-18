import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { stage } from '../scroll/stage'
import { BED_AMP, BED_SIZE, printer } from './printerState'

const POST_X = BED_SIZE / 2 + 0.28
const POST_TOP = 2.35
const TRAVEL_Z = BED_SIZE * 0.84

/**
 * The machine around the bed: build-volume cage, a Y-beam that rides the print
 * frontier, and a nozzle that rasters across it carrying its own hot light.
 * Nothing here is decoration — it is the reason the object exists.
 */
export function Gantry() {
  const beamRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const tipLight = useRef<THREE.PointLight>(null)
  const tipRef = useRef<THREE.Mesh>(null)

  const cage = useMemo(() => {
    const box = new THREE.BoxGeometry(
      BED_SIZE + 0.5,
      POST_TOP + 0.2,
      BED_SIZE + 0.5,
    )
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [])

  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1c1a24',
        roughness: 0.5,
        metalness: 0.62,
      }),
    [],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    // Job finished: park off the part so the object is never cut by the beam.
    const parked = printer.printY > 0.985

    const y = parked
      ? printer.printY * BED_AMP + 0.55
      : printer.printY * BED_AMP + 0.205
    const z = parked ? -TRAVEL_Z * 0.66 : printer.nozzleZ * TRAVEL_Z
    const x = parked ? -POST_X * 0.72 : (printer.nozzleX - 0.5) * BED_SIZE

    if (beamRef.current) {
      beamRef.current.position.y += (y - beamRef.current.position.y) * Math.min(1, dt * (parked ? 2.4 : 9))
      beamRef.current.position.z += (z - beamRef.current.position.z) * Math.min(1, dt * (parked ? 2.4 : 6))
    }
    if (headRef.current) {
      headRef.current.position.x += (x - headRef.current.position.x) * Math.min(1, dt * (parked ? 3 : 14))
    }

    const hot = stage.reduced ? 0 : printer.hot
    if (tipLight.current) {
      tipLight.current.intensity = 0.12 + hot * 0.55
    }
    if (tipRef.current) {
      const mat = tipRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.2 + hot * 5.5
    }
  })

  return (
    <group>
      {/* Build volume */}
      <lineSegments position={[0, (POST_TOP + 0.2) / 2 - 0.16, 0]}>
        <primitive object={cage} attach="geometry" />
        <lineBasicMaterial
          color={PALETTE.majorelle}
          transparent
          opacity={0.16}
        />
      </lineSegments>

      {/* Uprights */}
      {[-POST_X, POST_X].map((x) => (
        <mesh
          key={x}
          position={[x, POST_TOP / 2 - 0.15, 0]}
          material={steel}
          castShadow
        >
          <boxGeometry args={[0.09, POST_TOP, 0.09]} />
        </mesh>
      ))}

      {/* Y-beam riding the print frontier */}
      <group ref={beamRef} position={[0, 0.2, 0]}>
        <mesh material={steel} castShadow>
          <boxGeometry args={[POST_X * 2 + 0.1, 0.075, 0.13]} />
        </mesh>

        {/* Print head */}
        <group ref={headRef}>
          <mesh position={[0, 0.02, 0]} material={steel} castShadow>
            <boxGeometry args={[0.22, 0.17, 0.2]} />
          </mesh>
          <mesh position={[0, -0.13, 0]} castShadow>
            <coneGeometry args={[0.052, 0.13, 20]} />
            <meshStandardMaterial
              color="#3a3640"
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
          <mesh ref={tipRef} position={[0, -0.198, 0]}>
            <sphereGeometry args={[0.019, 14, 12]} />
            <meshStandardMaterial
              color={PALETTE.ember}
              emissive={PALETTE.ember}
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            ref={tipLight}
            position={[0, -0.06, 0]}
            color={PALETTE.ember}
            intensity={0.4}
            distance={2.2}
            decay={2}
          />
        </group>
      </group>
    </group>
  )
}
