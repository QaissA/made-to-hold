import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { stage } from '../scroll/stage'

/**
 * The machine itself — a bed-slinger FDM printer, mid-job.
 *
 * This is the hero because it is the one object that says what the studio IS
 * before a visitor reads a word. Everything else on the page is something this
 * made.
 *
 * It actually runs: the gantry climbs as the part grows, the carriage rasters
 * across X, the bed slings in Y, and the nozzle carries its own hot light.
 */

const FRAME_W = 1.5
const FRAME_H = 1.7
const FRAME_D = 1.25
const EXTRUSION = 0.055

export function Printer() {
  const gantryRef = useRef<THREE.Group>(null)
  const carriageRef = useRef<THREE.Group>(null)
  const bedRef = useRef<THREE.Group>(null)
  const partRef = useRef<THREE.Mesh>(null)
  const tipLight = useRef<THREE.PointLight>(null)

  const aluminium = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#5A6069',
        roughness: 0.42,
        metalness: 0.7,
      }),
    [],
  )
  const dark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#15171C',
        roughness: 0.55,
        metalness: 0.3,
      }),
    [],
  )

  // The part on the bed: a spiralised vase, lathed so it can grow in height.
  const partGeometry = useMemo(() => {
    const profile: THREE.Vector2[] = []
    const steps = 48
    for (let i = 0; i <= steps; i++) {
      const u = i / steps
      const r =
        0.055 +
        0.105 * Math.sin(Math.PI * (0.08 + 0.86 * u)) ** 1.5 +
        0.01 * Math.sin(u * Math.PI * 8)
      profile.push(new THREE.Vector2(r, u * 0.62))
    }
    return new THREE.LatheGeometry(profile, 64)
  }, [])

  const spoolGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.21, 0.21, 0.09, 40, 1, true),
    [],
  )

  useFrame((state) => {
    const t = stage.reduced ? 0 : state.clock.elapsedTime
    // Job progress: loops so the machine is always working.
    const job = stage.reduced ? 0.7 : (t * 0.045) % 1

    if (partRef.current) {
      partRef.current.scale.set(1, Math.max(0.04, job), 1)
    }
    if (gantryRef.current) {
      gantryRef.current.position.y = 0.16 + job * 0.46
    }
    if (carriageRef.current) {
      carriageRef.current.position.x = Math.sin(t * 2.4) * 0.3
    }
    if (bedRef.current) {
      bedRef.current.position.z = Math.sin(t * 0.9) * 0.16
    }
    if (tipLight.current) {
      tipLight.current.intensity = 0.35 + Math.abs(Math.sin(t * 2.4)) * 0.25
    }
  })

  const post = (x: number, z: number) => (
    <mesh
      key={`${x}-${z}`}
      position={[x, FRAME_H / 2 - 0.1, z]}
      material={aluminium}
      castShadow
    >
      <boxGeometry args={[EXTRUSION, FRAME_H, EXTRUSION]} />
    </mesh>
  )

  return (
    <group position={[0, -0.55, 0]}>
      {/* Base frame */}
      <mesh position={[0, -0.06, 0]} material={dark} castShadow receiveShadow>
        <boxGeometry args={[FRAME_W, 0.12, FRAME_D]} />
      </mesh>

      {/* Uprights */}
      {[
        [-FRAME_W / 2 + EXTRUSION, -FRAME_D / 2 + EXTRUSION],
        [FRAME_W / 2 - EXTRUSION, -FRAME_D / 2 + EXTRUSION],
        [-FRAME_W / 2 + EXTRUSION, FRAME_D / 2 - EXTRUSION],
        [FRAME_W / 2 - EXTRUSION, FRAME_D / 2 - EXTRUSION],
      ].map(([x, z]) => post(x, z))}

      {/* Top rails */}
      {[-FRAME_D / 2 + EXTRUSION, FRAME_D / 2 - EXTRUSION].map((z) => (
        <mesh
          key={z}
          position={[0, FRAME_H - 0.1, z]}
          material={aluminium}
          castShadow
        >
          <boxGeometry args={[FRAME_W, EXTRUSION, EXTRUSION]} />
        </mesh>
      ))}

      {/* Bed — slings in Y (world Z) as it prints */}
      <group ref={bedRef}>
        <mesh position={[0, 0.1, 0]} material={dark} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.05, 0.92]} />
        </mesh>
        {/* PEI sheet */}
        <mesh position={[0, 0.128, 0]} receiveShadow>
          <boxGeometry args={[0.88, 0.008, 0.88]} />
          <meshStandardMaterial
            color="#1B1E24"
            roughness={0.42}
            metalness={0.55}
          />
        </mesh>
        {/* The part being printed */}
        <mesh
          ref={partRef}
          geometry={partGeometry}
          position={[0, 0.132, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={PALETTE.majorelle}
            roughness={0.62}
            metalness={0.02}
          />
        </mesh>
      </group>

      {/* Gantry: X beam riding the uprights */}
      <group ref={gantryRef}>
        <mesh material={aluminium} castShadow>
          <boxGeometry args={[FRAME_W, EXTRUSION, EXTRUSION * 1.4]} />
        </mesh>

        {/* Carriage + hotend */}
        <group ref={carriageRef}>
          <mesh position={[0, -0.02, 0.06]} material={dark} castShadow>
            <boxGeometry args={[0.2, 0.17, 0.12]} />
          </mesh>
          {/* Fan shroud */}
          <mesh position={[0, -0.03, 0.13]} material={dark} castShadow>
            <boxGeometry args={[0.16, 0.12, 0.03]} />
          </mesh>
          {/* Heater block */}
          <mesh position={[0, -0.13, 0.06]} castShadow>
            <boxGeometry args={[0.07, 0.06, 0.06]} />
            <meshStandardMaterial
              color="#8A6A3A"
              roughness={0.45}
              metalness={0.7}
            />
          </mesh>
          {/* Nozzle */}
          <mesh position={[0, -0.185, 0.06]} castShadow>
            <coneGeometry args={[0.028, 0.06, 20]} />
            <meshStandardMaterial
              color="#B08D4E"
              roughness={0.3}
              metalness={0.85}
            />
          </mesh>
          <pointLight
            ref={tipLight}
            position={[0, -0.22, 0.06]}
            color={PALETTE.ember}
            intensity={0.4}
            distance={1.1}
            decay={2}
          />
        </group>
      </group>

      {/* Filament spool on a side holder */}
      <group position={[FRAME_W / 2 + 0.16, FRAME_H - 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={spoolGeometry} castShadow>
          <meshStandardMaterial
            color={PALETTE.majorelle}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        {[-0.05, 0.05].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.012, 40]} />
            <meshStandardMaterial
              color="#2B2E35"
              roughness={0.55}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
