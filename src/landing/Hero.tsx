import { ContactShadows, Environment, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, type RefObject } from 'react'
import { PostFX } from '../canvas/PostFX'
import {
  DEFAULT_EXPOSURE,
  DEFAULT_TONE_MAP,
  OUTPUT_COLOR_SPACE,
  TONE_MAP_PRESETS,
} from '../config/color'
import {
  isComposerActive,
  type LightFlags,
} from '../config/lightUnits'
import { PALETTE } from '../config/palette'
import { LithophaneHero } from './scenes/LithophaneHero'

/** Quiet Path A hero — bloom/SMAA/N8AO only; no busy studio rig. */
export const HERO_LIGHT_FLAGS: LightFlags = {
  environment: true,
  key: false,
  fill: false,
  rim: false,
  area: false,
  contactShadows: false,
  n8ao: true,
  bloom: true,
  dof: false,
  smaa: true,
  reflectorFloor: false,
}

function ToneMappingApplier({ composerActive }: { composerActive: boolean }) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = composerActive
      ? TONE_MAP_PRESETS.none
      : TONE_MAP_PRESETS[DEFAULT_TONE_MAP]
    gl.toneMappingExposure = DEFAULT_EXPOSURE * 0.95
    gl.outputColorSpace = OUTPUT_COLOR_SPACE
  }, [gl, composerActive])
  return null
}

function ProgressBridge({ onProgress }: { onProgress?: (p: number) => void }) {
  const { progress, active, loaded, total } = useProgress()

  useEffect(() => {
    if (!onProgress) return
    const finished =
      (!active && total > 0 && loaded >= total) || progress >= 100
    onProgress(finished ? 1 : progress / 100)
  }, [progress, active, loaded, total, onProgress])

  return null
}

/** Subtle pointer parallax — no OrbitControls (avoids scroll fights). */
function PointerParallax({
  scrollProgressRef,
}: {
  scrollProgressRef?: RefObject<number>
}) {
  const { camera, pointer } = useThree()
  const base = useRef({ x: 0.15, y: 0.35, z: 2.85 })

  useFrame((_, delta) => {
    const scroll = scrollProgressRef?.current ?? 0
    const tx = base.current.x + pointer.x * 0.18 + scroll * 0.25
    const ty = base.current.y + pointer.y * 0.1 + scroll * 0.12
    const tz = base.current.z - scroll * 0.35
    camera.position.x += (tx - camera.position.x) * Math.min(1, delta * 2.5)
    camera.position.y += (ty - camera.position.y) * Math.min(1, delta * 2.5)
    camera.position.z += (tz - camera.position.z) * Math.min(1, delta * 2.5)
    camera.lookAt(0.25, 0.2, 0)
  })

  return null
}

export type HeroProps = {
  onProgress?: (p: number) => void
  scrollProgressRef?: RefObject<number>
}

export function Hero({ onProgress, scrollProgressRef }: HeroProps) {
  const composerActive = isComposerActive(HERO_LIGHT_FLAGS)

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0.15, 0.35, 2.85], fov: 36, near: 0.1, far: 40 }}
      gl={{
        antialias: true,
        toneMapping: TONE_MAP_PRESETS[DEFAULT_TONE_MAP],
        toneMappingExposure: DEFAULT_EXPOSURE * 0.95,
        outputColorSpace: OUTPUT_COLOR_SPACE,
      }}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
    >
      <ToneMappingApplier composerActive={composerActive} />
      <color attach="background" args={[PALETTE.bg]} />
      <fog attach="fog" args={[PALETTE.bg, 4.5, 11]} />
      <Suspense fallback={null}>
        <Environment
          files="/hdri/studio.hdr"
          environmentIntensity={0.35}
        />
        <LithophaneHero scrollProgressRef={scrollProgressRef} />
        <ContactShadows
          position={[0.2, -0.82, 0]}
          opacity={0.45}
          scale={6}
          blur={2.4}
          far={3}
          color="#000000"
        />
      </Suspense>
      <PostFX flags={HERO_LIGHT_FLAGS} toneMap={DEFAULT_TONE_MAP} />
      <PointerParallax scrollProgressRef={scrollProgressRef} />
      <ProgressBridge onProgress={onProgress} />
    </Canvas>
  )
}
