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

function terrainHeight(x: number, z: number): number {
  // Soft hills + a valley corridor the route rides through
  const hills =
    0.1 * Math.sin(x * 2.1) * Math.cos(z * 1.7) +
    0.055 * Math.sin(x * 3.8 + z * 2.4) +
    0.04 * Math.cos(x * 5.2 - z * 1.3)
  const bowl = -0.04 * Math.exp(-(x * x * 0.8 + (z - 0.1) * (z - 0.1) * 1.2))
  return Math.max(0.02, 0.18 + hills + bowl)
}

function createTerrainGeometry(size = 1.55, segments = 64) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, terrainHeight(x, z))
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/** Route polyline in XZ; Y = terrain + relief lift (the printed object). */
function createRibbonGeometry() {
  const xz: [number, number][] = [
    [-0.55, 0.48],
    [-0.28, 0.12],
    [-0.02, 0.38],
    [0.22, -0.08],
    [0.42, 0.22],
    [0.58, -0.05],
    [0.68, 0.18],
  ]
  const points = xz.map(([x, z], i) => {
    const relief = 0.04 + (i / (xz.length - 1)) * 0.22
    return new THREE.Vector3(x, terrainHeight(x, z) + relief, z)
  })
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
  return new THREE.TubeGeometry(curve, 160, 0.028, 10, false)
}

/** Low skirt / plinth under the terrain tile */
function createTerrainSkirt(size = 1.55, depth = 0.08) {
  const geo = new THREE.BoxGeometry(size, depth, size)
  geo.translate(0, -depth / 2, 0)
  return geo
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
  const terrainGeo = useMemo(() => createTerrainGeometry(), [])
  const skirtGeo = useMemo(() => createTerrainSkirt(), [])
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
      terrainGeo.dispose()
      skirtGeo.dispose()
      starGeo.dispose()
      lithoMaps.map.dispose()
      lithoMaps.displacementMap.dispose()
    }
  }, [ribbonGeo, terrainGeo, skirtGeo, starGeo, lithoMaps])

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
        <group position={[-0.05, 0.55, 0.15]} rotation={[-Math.PI / 2, 0, 0.15]}>
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

        {/* Strava relief + surrounding terrain tile */}
        <group position={[0.72, 0.02, 0.05]} rotation={[0, -0.35, 0]} scale={0.92}>
          <mesh
            castShadow
            receiveShadow
            geometry={skirtGeo}
          >
            <meshStandardMaterial
              color="#3a342c"
              roughness={0.92}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
          <mesh castShadow receiveShadow geometry={terrainGeo}>
            <meshStandardMaterial
              color="#5c6b4a"
              roughness={0.9}
              metalness={0.02}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
          <mesh castShadow geometry={ribbonGeo}>
            <meshStandardMaterial
              color={PALETTE.saffron}
              roughness={0.78}
              metalness={0.04}
              emissive={PALETTE.saffron}
              emissiveIntensity={0.08}
              clippingPlanes={clippingPlanes}
              clipShadows
            />
          </mesh>
        </group>
      </group>
    </group>
  )
}
