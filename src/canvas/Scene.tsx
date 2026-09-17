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
}: {
  toneMap: ToneMapPreset
  exposure: number
  composerActive: boolean
}) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = TONE_MAP_PRESETS[toneMap]
    gl.toneMappingExposure = exposure
    gl.outputColorSpace = OUTPUT_COLOR_SPACE
  }, [gl, toneMap, exposure, composerActive])
  return null
}

type SceneProps = {
  toneMap?: ToneMapPreset
  exposure?: number
  lightFlags?: LightFlags
}

export function Scene({
  toneMap = DEFAULT_TONE_MAP,
  exposure = DEFAULT_EXPOSURE,
  lightFlags = DEFAULT_LIGHT_FLAGS,
}: SceneProps) {
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
        composerActive={isComposerActive(lightFlags)}
      />
      <color attach="background" args={['#111']} />
      <Suspense fallback={null}>
        <Lighting flags={lightFlags} />
        {lightFlags.glass ? <GlassSphere /> : <OpaqueSphere />}
        {lightFlags.reflectorFloor ? <ReflectorFloor /> : <PlainGround />}
        {lightFlags.contactShadows && !lightFlags.reflectorFloor && (
          <ContactShadowGround />
        )}
      </Suspense>
      <PostFX flags={lightFlags} toneMap={toneMap} />
    </Canvas>
  )
}
