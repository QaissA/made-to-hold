import { OrbitControls, useProgress } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, type RefObject } from 'react'
import { ContactShadowGround } from '../canvas/ContactShadowGround'
import { Lighting } from '../canvas/Lighting'
import { PostFX } from '../canvas/PostFX'
import {
  DEFAULT_EXPOSURE,
  DEFAULT_TONE_MAP,
  OUTPUT_COLOR_SPACE,
  TONE_MAP_PRESETS,
} from '../config/color'
import {
  DEFAULT_LIGHT_FLAGS,
  isComposerActive,
  type LightFlags,
} from '../config/lightUnits'
import { PALETTE } from '../config/palette'
import { HeroTrio } from './scenes/HeroTrio'

/** Landing studio lights — no reflector floor; area off for a lighter hero. */
export const HERO_LIGHT_FLAGS: LightFlags = {
  ...DEFAULT_LIGHT_FLAGS,
  environment: true,
  key: true,
  fill: true,
  rim: true,
  area: false,
  contactShadows: true,
  n8ao: true,
  bloom: true,
  smaa: true,
  dof: false,
  reflectorFloor: false,
}

function ToneMappingApplier({ composerActive }: { composerActive: boolean }) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = composerActive
      ? TONE_MAP_PRESETS.none
      : TONE_MAP_PRESETS[DEFAULT_TONE_MAP]
    gl.toneMappingExposure = DEFAULT_EXPOSURE
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

export type HeroProps = {
  onProgress?: (p: number) => void
  /** Lenis scroll progress 0–1 (mutated by LandingPage). */
  scrollProgressRef?: RefObject<number>
}

export function Hero({ onProgress, scrollProgressRef }: HeroProps) {
  const composerActive = isComposerActive(HERO_LIGHT_FLAGS)

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.4, 1.55, 3.4], fov: 38 }}
      gl={{
        antialias: true,
        toneMapping: TONE_MAP_PRESETS[DEFAULT_TONE_MAP],
        toneMappingExposure: DEFAULT_EXPOSURE,
        outputColorSpace: OUTPUT_COLOR_SPACE,
      }}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
    >
      <ToneMappingApplier composerActive={composerActive} />
      <color attach="background" args={[PALETTE.bg]} />
      <Suspense fallback={null}>
        <Lighting flags={HERO_LIGHT_FLAGS} />
        {/* Soft backlight for lithophane transmission */}
        <pointLight
          position={[-1.15, 0.55, -0.55]}
          intensity={4.5}
          color={PALETTE.saffron}
          distance={4}
          decay={2}
        />
        <HeroTrio scrollProgressRef={scrollProgressRef} />
        {HERO_LIGHT_FLAGS.contactShadows && <ContactShadowGround />}
      </Suspense>
      <PostFX flags={HERO_LIGHT_FLAGS} toneMap={DEFAULT_TONE_MAP} />
      {/*
        Wheel zoom + camera Y nudge fought Lenis scroll → glitchy hero.
        Orbit is drag-only; parallax lives on the trio group, not the camera.
      */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.55}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 0.55, 0]}
      />
      <ProgressBridge onProgress={onProgress} />
    </Canvas>
  )
}
