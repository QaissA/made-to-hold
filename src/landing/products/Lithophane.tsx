import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { stage } from '../scroll/stage'
import type { RevealRef } from '../scenes/ProductStage'

/**
 * The lithophane — a photograph made of thickness.
 *
 * Flat light and it is a blank bone panel; light behind it and the image comes
 * out. That is the product, so the render has to actually do it: real vertex
 * displacement from the photo's luminance, and `MeshPhysicalMaterial`
 * transmission so the backlight genuinely passes through the thin parts.
 *
 * Per the parity map this is Eevee's screen-space refraction, not raytraced —
 * close enough for a panel this thin, and the honest limitation is that thick
 * regions do not occlude as hard as they would in Cycles.
 */

const PANEL_W = 0.92
const PANEL_H = 1.16
const FRAME = 0.075

export function Lithophane({
  portrait,
  reveal,
}: {
  portrait: THREE.Texture
  reveal: RevealRef
}) {
  const panelRef = useRef<THREE.Group>(null)
  const backlight = useRef<THREE.PointLight>(null)

  // Displacement wants linear data, not colour — see the color-foundation
  // playbook. A second view of the same image, tagged NoColorSpace.
  const displacement = useMemo(() => {
    const map = portrait.clone()
    map.colorSpace = THREE.NoColorSpace
    map.needsUpdate = true
    return map
  }, [portrait])

  useEffect(() => () => displacement.dispose(), [displacement])

  useFrame((state) => {
    const t = stage.reduced ? 0 : state.clock.elapsedTime
    const eased = 1 - (1 - reveal.current) ** 3

    if (panelRef.current) {
      panelRef.current.position.y = (1 - eased) * -0.5
      panelRef.current.rotation.x = (1 - eased) * 0.5
      // A slow breath so the raking light keeps moving across the relief.
      panelRef.current.rotation.y = stage.reduced
        ? 0
        : Math.sin(t * 0.22) * 0.07
    }
    if (backlight.current) {
      backlight.current.intensity = eased * (14 + Math.sin(t * 0.6) * 1.6)
    }
  })

  return (
    <group ref={panelRef}>
      {/* Warm source directly behind the panel — the whole point of the object */}
      <pointLight
        ref={backlight}
        position={[0, 0.15, -0.5]}
        color={PALETTE.amber}
        intensity={0}
        distance={5}
        decay={2}
      />

      {/* Walnut frame */}
      <mesh position={[0, 0.02, -0.03]} castShadow receiveShadow>
        <boxGeometry args={[PANEL_W + FRAME * 2, PANEL_H + FRAME * 2, 0.045]} />
        <meshStandardMaterial color="#4A3524" roughness={0.55} metalness={0.02} />
      </mesh>

      {/* Aperture behind the panel, so the backlight is not just a lamp */}
      <mesh position={[0, 0.02, -0.052]}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial color="#120D08" />
      </mesh>

      {/* The lithophane itself */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <planeGeometry args={[PANEL_W, PANEL_H, 200, 250]} />
        <meshPhysicalMaterial
          color="#F4EEE4"
          displacementMap={displacement}
          displacementScale={0.085}
          displacementBias={-0.03}
          transmission={0.82}
          thickness={1.1}
          roughness={0.26}
          metalness={0}
          ior={1.46}
          attenuationColor="#E8D2AC"
          attenuationDistance={0.55}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Stand */}
      <mesh position={[0, -PANEL_H / 2 - 0.09, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[PANEL_W * 0.62, 0.05, 0.22]} />
        <meshStandardMaterial color="#4A3524" roughness={0.6} />
      </mesh>
    </group>
  )
}
