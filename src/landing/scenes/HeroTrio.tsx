import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { printClipY } from '../scroll/printReveal'

const Y_MIN = -0.15
const Y_MAX = 1.45
/** Longer, weightier print (~2.8s feel) */
const PRINT_SMOOTH_TIME = 0.85
const TURNTABLE_MAX = 0.12
const SCROLL_LIFT = 0.22
const SCROLL_TILT = 0.08

function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}

/** 8-point zellij-ish star for ExtrudeGeometry */
function createStarShape(outer = 0.42, inner = 0.18, points = 8) {
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

function createRibbonGeometry() {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.7, 0.05, 0.45),
      new THREE.Vector3(-0.35, 0.28, -0.1),
      new THREE.Vector3(-0.05, 0.55, 0.35),
      new THREE.Vector3(0.28, 0.38, -0.2),
      new THREE.Vector3(0.55, 0.72, 0.25),
      new THREE.Vector3(0.85, 0.95, -0.05),
      new THREE.Vector3(1.05, 1.15, 0.18),
    ],
    false,
    'catmullrom',
    0.35,
  )
  return new THREE.TubeGeometry(curve, 160, 0.032, 12, false)
}

/** Soft portrait-like height/emissive map for the lithophane stand-in */
function createLithophaneMaps() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1a1510'
  ctx.fillRect(0, 0, size, size)

  const g = ctx.createRadialGradient(
    size * 0.5,
    size * 0.42,
    size * 0.05,
    size * 0.5,
    size * 0.48,
    size * 0.42,
  )
  g.addColorStop(0, '#f5efe4')
  g.addColorStop(0.45, '#c4b8a4')
  g.addColorStop(1, '#2a241c')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.46, size * 0.28, size * 0.36, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(40,30,24,0.35)'
  ctx.beginPath()
  ctx.ellipse(size * 0.4, size * 0.44, size * 0.04, size * 0.025, 0, 0, Math.PI * 2)
  ctx.ellipse(size * 0.6, size * 0.44, size * 0.04, size * 0.025, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(size * 0.5, size * 0.58, size * 0.08, size * 0.03, 0, 0, Math.PI * 2)
  ctx.fill()

  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4

  const dispCanvas = document.createElement('canvas')
  dispCanvas.width = size
  dispCanvas.height = size
  const dctx = dispCanvas.getContext('2d')!
  const img = ctx.getImageData(0, 0, size, size)
  const disp = dctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const l = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3
    disp.data[i] = disp.data[i + 1] = disp.data[i + 2] = l
    disp.data[i + 3] = 255
  }
  dctx.putImageData(disp, 0, 0)
  const displacementMap = new THREE.CanvasTexture(dispCanvas)
  displacementMap.anisotropy = 4

  return { map, displacementMap }
}

type Props = {
  scrollProgressRef?: RefObject<number>
}

export function HeroTrio({ scrollProgressRef }: Props) {
  const rootRef = useRef<THREE.Group>(null)
  const turnRef = useRef<THREE.Group>(null)
  const printRef = useRef({ value: 0 })
  const turnSpeedRef = useRef({ value: 0 })
  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), Y_MIN),
    [],
  )
  const clippingPlanes = useMemo(() => [clipPlane], [clipPlane])

  const ribbonGeo = useMemo(() => createRibbonGeometry(), [])
  const starGeo = useMemo(() => {
    const shape = createStarShape(0.4, 0.16, 8)
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.014,
      bevelSegments: 2,
      curveSegments: 2,
    })
  }, [])
  const lithoMaps = useMemo(() => createLithophaneMaps(), [])

  useEffect(() => {
    return () => {
      ribbonGeo.dispose()
      starGeo.dispose()
      lithoMaps.map.dispose()
      lithoMaps.displacementMap.dispose()
    }
  }, [ribbonGeo, starGeo, lithoMaps])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    damp(printRef.current, 'value', 1, PRINT_SMOOTH_TIME, dt)
    const print = easeOutCubic(printRef.current.value)
    clipPlane.constant = printClipY(print, Y_MIN, Y_MAX)

    // Hold turntable until print is mostly done, then ease in
    const turnTarget = print > 0.72 ? TURNTABLE_MAX : 0
    damp(turnSpeedRef.current, 'value', turnTarget, 0.9, dt)
    if (turnRef.current) {
      turnRef.current.rotation.y += dt * turnSpeedRef.current.value
      // Soft float after reveal
      const t = state.clock.elapsedTime
      turnRef.current.position.y = print * Math.sin(t * 0.55) * 0.028
    }

    // Scroll parallax on root — never touch the OrbitControls camera
    if (rootRef.current) {
      const p = scrollProgressRef?.current ?? 0
      const eased = easeOutCubic(Math.min(1, Math.max(0, p)))
      damp(rootRef.current.position, 'y', eased * SCROLL_LIFT, 0.45, dt)
      damp(rootRef.current.rotation, 'x', -eased * SCROLL_TILT, 0.45, dt)
    }
  })

  return (
    <group ref={rootRef}>
      <group ref={turnRef}>
        {/* Lithophane panel */}
        <group position={[-0.95, 0.62, 0.1]} rotation={[0, 0.32, 0]}>
          <mesh castShadow receiveShadow>
            <planeGeometry args={[0.48, 0.72, 64, 96]} />
            <meshPhysicalMaterial
              color={PALETTE.bone}
              map={lithoMaps.map}
              displacementMap={lithoMaps.displacementMap}
              displacementScale={0.045}
              transmission={0.5}
              thickness={0.6}
              roughness={0.2}
              metalness={0}
              ior={1.45}
              transparent
              side={THREE.DoubleSide}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
          {/* Frame / back plate */}
          <mesh castShadow position={[0, 0, -0.02]}>
            <boxGeometry args={[0.52, 0.76, 0.022]} />
            <meshStandardMaterial
              color="#cfc6b6"
              roughness={0.55}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
        </group>

        {/* Zellij extruded star */}
        <group position={[0.05, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0.15]}>
          <mesh castShadow receiveShadow geometry={starGeo}>
            <meshStandardMaterial
              color={PALETTE.majorelle}
              roughness={0.28}
              metalness={0.12}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
          <mesh
            castShadow
            position={[0, 0, 0.08]}
            scale={0.55}
            geometry={starGeo}
          >
            <meshStandardMaterial
              color={PALETTE.terracotta}
              roughness={0.32}
              metalness={0.1}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
        </group>

        {/* Strava ribbon relief */}
        <mesh
          castShadow
          geometry={ribbonGeo}
          position={[0.05, 0.02, 0.12]}
          rotation={[0, -0.2, 0]}
        >
          <meshStandardMaterial
            color={PALETTE.saffron}
            roughness={0.82}
            metalness={0.02}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
      </group>
    </group>
  )
}
