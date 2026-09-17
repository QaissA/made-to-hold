import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { printClipY } from '../scroll/printReveal'

const Y_MIN = -0.2
const Y_MAX = 1.6
/** maath smoothTime — asymptotic approach lands near 1 in ~2s */
const PRINT_SMOOTH_TIME = 0.55
const TURNTABLE_SPEED = 0.18

function createRibbonGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, 0.12, 0.35),
    new THREE.Vector3(-0.15, 0.42, -0.25),
    new THREE.Vector3(0.35, 0.22, 0.3),
    new THREE.Vector3(0.75, 0.65, -0.15),
    new THREE.Vector3(0.95, 0.9, 0.2),
  ])
  return new THREE.TubeGeometry(curve, 96, 0.038, 8, false)
}

export function HeroTrio() {
  const groupRef = useRef<THREE.Group>(null)
  const printRef = useRef({ value: 0 })
  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), Y_MIN),
    [],
  )
  const clippingPlanes = useMemo(() => [clipPlane], [clipPlane])
  const ribbonGeo = useMemo(() => createRibbonGeometry(), [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * TURNTABLE_SPEED
    }
    damp(printRef.current, 'value', 1, PRINT_SMOOTH_TIME, delta)
    clipPlane.constant = printClipY(printRef.current.value, Y_MIN, Y_MAX)
  })

  return (
    <group ref={groupRef}>
      {/* Lithophane slab */}
      <mesh castShadow position={[-0.9, 0.55, 0.05]} rotation={[0, 0.28, 0]}>
        <boxGeometry args={[0.5, 0.95, 0.055]} />
        <meshPhysicalMaterial
          color={PALETTE.bone}
          transmission={0.32}
          thickness={0.45}
          roughness={0.12}
          metalness={0}
          ior={1.4}
          transparent
          clippingPlanes={clippingPlanes}
          clipShadows
        />
      </mesh>

      {/* Zellij star — octahedron / icosahedron + rotated boxes */}
      <group position={[0.05, 0.72, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color={PALETTE.majorelle}
            roughness={0.35}
            metalness={0.08}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
        <mesh castShadow rotation={[0, Math.PI / 5, 0]} scale={0.7}>
          <icosahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={PALETTE.terracotta}
            roughness={0.4}
            metalness={0.05}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
        {[0, 60, 120].map((deg) => (
          <mesh
            key={deg}
            castShadow
            rotation={[0, 0, (deg * Math.PI) / 180]}
          >
            <boxGeometry args={[0.1, 0.68, 0.1]} />
            <meshStandardMaterial
              color={deg === 60 ? PALETTE.terracotta : PALETTE.majorelle}
              roughness={0.38}
              metalness={0.06}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
        ))}
      </group>

      {/* Strava ribbon */}
      <mesh castShadow geometry={ribbonGeo} position={[0.1, 0.02, 0.08]}>
        <meshStandardMaterial
          color={PALETTE.saffron}
          roughness={0.88}
          metalness={0}
          clippingPlanes={clippingPlanes}
          clipShadows
        />
      </mesh>
    </group>
  )
}
