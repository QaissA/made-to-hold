import { OrbitControls, useProgress } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
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
    // drei: progress is 0–100; loaded/total are item counts (not a boolean).
    const finished =
      (!active && total > 0 && loaded >= total) || progress >= 100
    onProgress(finished ? 1 : progress / 100)
  }, [progress, active, loaded, total, onProgress])

  return null
}

export type HeroProps = {
  onProgress?: (p: number) => void
}

export function Hero({ onProgress }: HeroProps) {
  const composerActive = isComposerActive(HERO_LIGHT_FLAGS)

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.2, 1.4, 3.2], fov: 40 }}
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
        <HeroTrio />
        {HERO_LIGHT_FLAGS.contactShadows && <ContactShadowGround />}
      </Suspense>
      <PostFX flags={HERO_LIGHT_FLAGS} toneMap={DEFAULT_TONE_MAP} />
      <OrbitControls enableDamping makeDefault />
      <ProgressBridge onProgress={onProgress} />
    </Canvas>
  )
}
