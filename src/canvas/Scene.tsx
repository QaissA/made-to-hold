import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import {
  DEFAULT_EXPOSURE,
  DEFAULT_TONE_MAP,
  OUTPUT_COLOR_SPACE,
  TONE_MAP_PRESETS,
  type ToneMapPreset,
} from '../config/color'
import {
  DEFAULT_LIGHT_FLAGS,
  isComposerActive,
  type LightFlags,
} from '../config/lightUnits'
import { PathtraceShell } from '../render/PathtraceShell'
import { ContactShadowGround } from './ContactShadowGround'
import { GlassSphere } from './GlassSphere'
import { OpaqueSphere, PlainGround } from './GroundTruth'
import { Lighting } from './Lighting'
import { PostFX } from './PostFX'
import { ReflectorFloor } from './ReflectorFloor'

function ToneMappingApplier({
  toneMap,
  exposure,
  composerActive,
  heroPathtrace,
}: {
  toneMap: ToneMapPreset
  exposure: number
  composerActive: boolean
  heroPathtrace: boolean
}) {
  const { gl } = useThree()
  useEffect(() => {
    // EffectComposer and pathtracer own output — do not apply UI preset then.
    gl.toneMapping =
      composerActive || heroPathtrace
        ? TONE_MAP_PRESETS.none
        : TONE_MAP_PRESETS[toneMap]
    gl.toneMappingExposure = exposure
    gl.outputColorSpace = OUTPUT_COLOR_SPACE
  }, [gl, toneMap, exposure, composerActive, heroPathtrace])
  return null
}

type SceneProps = {
  toneMap?: ToneMapPreset
  exposure?: number
  lightFlags?: LightFlags
  heroPathtrace?: boolean
  onPathSamplesChange?: (samples: number) => void
  onPathResetReady?: (reset: () => void) => void
}

export function Scene({
  toneMap = DEFAULT_TONE_MAP,
  exposure = DEFAULT_EXPOSURE,
  lightFlags = DEFAULT_LIGHT_FLAGS,
  heroPathtrace = false,
  onPathSamplesChange,
  onPathResetReady,
}: SceneProps) {
  // Transmission / MeshReflector / ContactShadows are unstable under the pathtracer — force opaque + plain ground.
  const glass = heroPathtrace ? false : lightFlags.glass
  const reflectorFloor = heroPathtrace ? false : lightFlags.reflectorFloor
  const contactShadows = heroPathtrace ? false : lightFlags.contactShadows
  const composerActive = !heroPathtrace && isComposerActive(lightFlags)

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [2.5, 1.8, 3.5], fov: 45 }}
      gl={{
        antialias: true,
        toneMapping: TONE_MAP_PRESETS[DEFAULT_TONE_MAP],
        toneMappingExposure: DEFAULT_EXPOSURE,
        outputColorSpace: OUTPUT_COLOR_SPACE,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ToneMappingApplier
        toneMap={toneMap}
        exposure={exposure}
        composerActive={composerActive}
        heroPathtrace={heroPathtrace}
      />
      <color attach="background" args={['#111']} />
      <Suspense fallback={null}>
        <PathtraceShell
          enabled={heroPathtrace}
          onSamplesChange={onPathSamplesChange}
          onResetReady={onPathResetReady}
        >
          <Lighting flags={lightFlags} />
          {glass ? <GlassSphere /> : <OpaqueSphere />}
          {reflectorFloor ? <ReflectorFloor /> : <PlainGround />}
          {contactShadows && !reflectorFloor && (
            <ContactShadowGround />
          )}
        </PathtraceShell>
      </Suspense>
      {!heroPathtrace && <PostFX flags={lightFlags} toneMap={toneMap} />}
    </Canvas>
  )
}
