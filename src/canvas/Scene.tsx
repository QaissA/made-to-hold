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
  type LightFlags,
} from '../config/lightUnits'
import { ContactShadowGround } from './ContactShadowGround'
import { GroundTruth } from './GroundTruth'
import { Lighting } from './Lighting'

function ToneMappingApplier({
  toneMap,
  exposure,
}: {
  toneMap: ToneMapPreset
  exposure: number
}) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = TONE_MAP_PRESETS[toneMap]
    gl.toneMappingExposure = exposure
    gl.outputColorSpace = OUTPUT_COLOR_SPACE
  }, [gl, toneMap, exposure])
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
      <ToneMappingApplier toneMap={toneMap} exposure={exposure} />
      <color attach="background" args={['#111']} />
      <Suspense fallback={null}>
        <Lighting flags={lightFlags} />
        <GroundTruth />
        {lightFlags.contactShadows && <ContactShadowGround />}
      </Suspense>
    </Canvas>
  )
}
