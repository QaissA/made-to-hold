import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { printClipY } from '../scroll/printReveal'

const Y_MIN = -0.95
const Y_MAX = 1.05
const PRINT_SMOOTH = 1.15
const PORTRAIT_URL = '/textures/lithophane-portrait.jpg'

function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}

type Props = {
  scrollProgressRef?: RefObject<number>
}

/**
 * Marketing lithophane — real portrait map + displacement,
 * MeshPhysicalMaterial transmission, drifting saffron backlight.
 */
export function LithophaneHero({ scrollProgressRef }: Props) {
  const rootRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const printRef = useRef({ value: 0 })

  const portrait = useTexture(PORTRAIT_URL)
  useMemo(() => {
    portrait.colorSpace = THREE.SRGBColorSpace
    portrait.anisotropy = 8
    portrait.wrapS = portrait.wrapT = THREE.ClampToEdgeWrapping
    portrait.needsUpdate = true
  }, [portrait])

  // Linear data copy for displacement (textures skill: data maps stay linear)
  const displacementMap = useMemo(() => {
    const map = portrait.clone()
    map.colorSpace = THREE.NoColorSpace
    map.needsUpdate = true
    return map
  }, [portrait])

  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), Y_MIN),
    [],
  )
  const clippingPlanes = useMemo(() => [clipPlane], [clipPlane])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    damp(printRef.current, 'value', 1, PRINT_SMOOTH, dt)
    const print = easeOutCubic(printRef.current.value)
    clipPlane.constant = printClipY(print, Y_MIN, Y_MAX)

    const t = state.clock.elapsedTime
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.32) * 0.65
      lightRef.current.position.y = 0.2 + Math.cos(t * 0.27) * 0.35
      lightRef.current.intensity = 9 + Math.sin(t * 0.45) * 1.2
    }

    if (rootRef.current) {
      const p = scrollProgressRef?.current ?? 0
      const e = easeOutCubic(Math.min(1, Math.max(0, p)))
      damp(rootRef.current.rotation, 'y', 0.12 + e * 0.1, 0.55, dt)
      damp(rootRef.current.rotation, 'x', -e * 0.05, 0.55, dt)
      rootRef.current.position.y = print * Math.sin(t * 0.35) * 0.018
    }
  })

  return (
    <group ref={rootRef} position={[0.55, 0.08, 0]}>
      <spotLight
        position={[-2.8, 3.2, 3.5]}
        angle={0.5}
        penumbra={0.9}
        intensity={1.6}
        color="#fff2e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00025}
      />
      <hemisphereLight args={['#1e1a30', '#08070a', 0.28]} />

      <pointLight
        ref={lightRef}
        position={[0, 0.15, -1.05]}
        color={PALETTE.saffron}
        intensity={10}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[0.55, -0.35, -1.2]}
        color={PALETTE.majorelleBright}
        intensity={1.6}
        distance={5}
        decay={2}
      />

      {/* Plinth */}
      <mesh
        castShadow
        receiveShadow
        position={[0, -0.92, 0.04]}
        rotation={[0, 0.1, 0]}
      >
        <boxGeometry args={[1.55, 0.07, 0.32]} />
        <meshStandardMaterial color="#14110f" roughness={0.5} metalness={0.2} />
      </mesh>

      <group rotation={[0, 0.22, 0]}>
        {/* Frame */}
        <mesh position={[0, 0.02, -0.035]} castShadow>
          <boxGeometry args={[1.42, 1.78, 0.04]} />
          <meshStandardMaterial
            color="#b9ae9c"
            roughness={0.42}
            metalness={0.08}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>

        {/* Back catcher */}
        <mesh position={[0, 0.02, -0.055]}>
          <planeGeometry args={[1.32, 1.68]} />
          <meshStandardMaterial
            color="#1c1712"
            roughness={0.9}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>

        {/* Lithophane plane — high tessellation for displacement */}
        <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
          <planeGeometry args={[1.28, 1.62, 192, 240]} />
          <meshPhysicalMaterial
            color="#f3ebe0"
            map={portrait}
            displacementMap={displacementMap}
            displacementScale={0.07}
            displacementBias={-0.02}
            transmission={0.78}
            thickness={1.35}
            roughness={0.18}
            metalness={0}
            ior={1.42}
            attenuationColor="#e6d5bc"
            attenuationDistance={0.65}
            transparent
            side={THREE.DoubleSide}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
      </group>
    </group>
  )
}

useTexture.preload(PORTRAIT_URL)
