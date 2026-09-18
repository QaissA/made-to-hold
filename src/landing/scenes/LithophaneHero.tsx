import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { printClipY } from '../scroll/printReveal'

const Y_MIN = -0.85
const Y_MAX = 0.95
const PRINT_SMOOTH = 1.05
const SCROLL_YAW = 0.12
const SCROLL_PITCH = 0.06

function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}

/**
 * Higher-res portrait heightfield for lithophane transmission.
 * Color map = sRGB albedo; displacement = linear luminance (textures skill).
 */
function createLithophaneMaps(size = 512) {
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = size
  colorCanvas.height = size
  const ctx = colorCanvas.getContext('2d')!

  // Bone plaster field
  const bg = ctx.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0, '#d8d0c2')
  bg.addColorStop(0.5, '#ebe4d6')
  bg.addColorStop(1, '#c9c0b0')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  // Soft vignette (thicker edges = darker lithophane rim)
  const vig = ctx.createRadialGradient(
    size * 0.5,
    size * 0.48,
    size * 0.15,
    size * 0.5,
    size * 0.5,
    size * 0.62,
  )
  vig.addColorStop(0, 'rgba(255,248,236,0)')
  vig.addColorStop(0.55, 'rgba(200,190,170,0.15)')
  vig.addColorStop(1, 'rgba(90,80,70,0.55)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, size, size)

  // Face mass — lighter = thinner = brighter when backlit
  const face = ctx.createRadialGradient(
    size * 0.5,
    size * 0.42,
    size * 0.04,
    size * 0.5,
    size * 0.46,
    size * 0.34,
  )
  face.addColorStop(0, '#fff8ee')
  face.addColorStop(0.35, '#e8ddd0')
  face.addColorStop(0.7, '#a89888')
  face.addColorStop(1, 'rgba(70,60,52,0)')
  ctx.fillStyle = face
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.46, size * 0.26, size * 0.34, 0, 0, Math.PI * 2)
  ctx.fill()

  // Hair / crown shadow
  ctx.fillStyle = 'rgba(55,45,40,0.45)'
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.28, size * 0.24, size * 0.12, 0, Math.PI, Math.PI * 2)
  ctx.fill()

  // Eye sockets (thicker = darker in transmission)
  ctx.fillStyle = 'rgba(40,32,28,0.4)'
  ctx.beginPath()
  ctx.ellipse(size * 0.4, size * 0.44, size * 0.045, size * 0.028, -0.15, 0, Math.PI * 2)
  ctx.ellipse(size * 0.6, size * 0.44, size * 0.045, size * 0.028, 0.15, 0, Math.PI * 2)
  ctx.fill()

  // Highlight catchlights
  ctx.fillStyle = 'rgba(255,250,240,0.55)'
  ctx.beginPath()
  ctx.arc(size * 0.41, size * 0.435, size * 0.012, 0, Math.PI * 2)
  ctx.arc(size * 0.61, size * 0.435, size * 0.012, 0, Math.PI * 2)
  ctx.fill()

  // Nose bridge + tip
  const nose = ctx.createLinearGradient(size * 0.5, size * 0.42, size * 0.5, size * 0.56)
  nose.addColorStop(0, 'rgba(255,245,230,0.35)')
  nose.addColorStop(1, 'rgba(160,140,120,0.25)')
  ctx.fillStyle = nose
  ctx.beginPath()
  ctx.moveTo(size * 0.5, size * 0.4)
  ctx.lineTo(size * 0.46, size * 0.55)
  ctx.lineTo(size * 0.54, size * 0.55)
  ctx.closePath()
  ctx.fill()

  // Mouth
  ctx.strokeStyle = 'rgba(90,60,55,0.35)'
  ctx.lineWidth = size * 0.008
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.6, size * 0.07, size * 0.025, 0, 0.15, Math.PI - 0.15)
  ctx.stroke()

  // Fine grain for print-layer feel
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n))
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n))
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  const map = new THREE.CanvasTexture(colorCanvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  map.needsUpdate = true

  // Displacement from luminance (linear data — no sRGB)
  const dispCanvas = document.createElement('canvas')
  dispCanvas.width = size
  dispCanvas.height = size
  const dctx = dispCanvas.getContext('2d')!
  const src = ctx.getImageData(0, 0, size, size)
  const disp = dctx.createImageData(size, size)
  for (let i = 0; i < src.data.length; i += 4) {
    // Invert: light areas → less displacement (thinner wall)
    const l = (src.data[i] * 0.299 + src.data[i + 1] * 0.587 + src.data[i + 2] * 0.114)
    const v = 255 - l
    disp.data[i] = disp.data[i + 1] = disp.data[i + 2] = v
    disp.data[i + 3] = 255
  }
  dctx.putImageData(disp, 0, 0)
  const displacementMap = new THREE.CanvasTexture(dispCanvas)
  displacementMap.anisotropy = 8
  displacementMap.needsUpdate = true

  return { map, displacementMap }
}

type Props = {
  scrollProgressRef?: RefObject<number>
}

/**
 * Single marketing hero: cinematic lithophane panel.
 * MeshPhysicalMaterial transmission + drifting saffron backlight.
 */
export function LithophaneHero({ scrollProgressRef }: Props) {
  const rootRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const printRef = useRef({ value: 0 })
  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), Y_MIN),
    [],
  )
  const clippingPlanes = useMemo(() => [clipPlane], [clipPlane])
  const maps = useMemo(() => createLithophaneMaps(512), [])

  useEffect(() => {
    return () => {
      maps.map.dispose()
      maps.displacementMap.dispose()
    }
  }, [maps])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    damp(printRef.current, 'value', 1, PRINT_SMOOTH, dt)
    const print = easeOutCubic(printRef.current.value)
    clipPlane.constant = printClipY(print, Y_MIN, Y_MAX)

    const t = state.clock.elapsedTime
    // Drifting backlight — the emotional beat
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.35) * 0.55
      lightRef.current.position.y = 0.15 + Math.cos(t * 0.28) * 0.25
      lightRef.current.intensity = 6.5 + Math.sin(t * 0.5) * 0.8
    }

    if (rootRef.current) {
      const p = scrollProgressRef?.current ?? 0
      const e = easeOutCubic(Math.min(1, Math.max(0, p)))
      damp(rootRef.current.rotation, 'y', e * SCROLL_YAW, 0.5, dt)
      damp(rootRef.current.rotation, 'x', -e * SCROLL_PITCH, 0.5, dt)
      // Settled float after print
      rootRef.current.position.y = print * Math.sin(t * 0.4) * 0.02
    }
  })

  return (
    <group ref={rootRef} position={[0.35, 0.15, 0]}>
      {/* Warm key from front-left — keeps bone readable in dark */}
      <spotLight
        position={[-2.2, 2.4, 3.2]}
        angle={0.55}
        penumbra={0.85}
        intensity={2.2}
        color="#fff5e8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
      />
      <hemisphereLight
        args={['#2a2540', '#0a090c', 0.35]}
      />

      {/* Saffron backlight — reveals the face through the panel */}
      <pointLight
        ref={lightRef}
        position={[0, 0.2, -0.85]}
        color={PALETTE.saffron}
        intensity={7}
        distance={5}
        decay={2}
      />
      {/* Soft fill glow behind */}
      <pointLight
        position={[0.4, -0.2, -1.1]}
        color={PALETTE.majorelleBright}
        intensity={1.2}
        distance={4}
        decay={2}
      />

      {/* Thin ebony plinth */}
      <mesh
        castShadow
        receiveShadow
        position={[0, -0.78, 0.02]}
        rotation={[-0.02, 0.08, 0]}
      >
        <boxGeometry args={[1.35, 0.06, 0.28]} />
        <meshStandardMaterial
          color="#1a1614"
          roughness={0.55}
          metalness={0.15}
          clippingPlanes={clippingPlanes}
          clipShadows
        />
      </mesh>

      {/* Lithophane panel */}
      <group rotation={[0, 0.18, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
          <planeGeometry args={[1.15, 1.45, 128, 160]} />
          <meshPhysicalMaterial
            color={PALETTE.bone}
            map={maps.map}
            displacementMap={maps.displacementMap}
            displacementScale={0.055}
            displacementBias={-0.01}
            transmission={0.72}
            thickness={1.1}
            roughness={0.22}
            metalness={0}
            ior={1.4}
            attenuationColor="#e8dcc8"
            attenuationDistance={0.85}
            transparent
            side={THREE.DoubleSide}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
        {/* Back plate catches glow */}
        <mesh position={[0, 0.05, -0.04]} castShadow>
          <planeGeometry args={[1.2, 1.5]} />
          <meshStandardMaterial
            color="#2a241c"
            roughness={0.85}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
        {/* Frame */}
        <mesh position={[0, 0.05, -0.02]} castShadow>
          <boxGeometry args={[1.28, 1.58, 0.035]} />
          <meshStandardMaterial
            color="#cfc4b2"
            roughness={0.48}
            metalness={0.05}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
      </group>
    </group>
  )
}
