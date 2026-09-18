import { Environment, useProgress, useTexture } from '@react-three/drei'
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { Canvas, useThree } from '@react-three/fiber'
import { ToneMappingMode } from 'postprocessing'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  DEFAULT_EXPOSURE,
  OUTPUT_COLOR_SPACE,
  TONE_MAP_PRESETS,
} from '../config/color'
import { buildStrandData } from './filament/strandData'
import { Backdrop } from './scenes/Backdrop'
import { Ground } from './scenes/Ground'
import { StageRig } from './scenes/StageRig'
import { Strand } from './scenes/Strand'

const PORTRAIT_URL = '/textures/lithophane-portrait.jpg'

/** Composer owns the view transform, so the renderer must stay linear. */
function ToneMappingApplier() {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = TONE_MAP_PRESETS.none
    gl.toneMappingExposure = DEFAULT_EXPOSURE
    gl.outputColorSpace = OUTPUT_COLOR_SPACE
  }, [gl])
  return null
}

function ProgressBridge({ onProgress }: { onProgress: (p: number) => void }) {
  const { progress, active, loaded, total } = useProgress()
  useEffect(() => {
    const done = (!active && total > 0 && loaded >= total) || progress >= 100
    onProgress(done ? 1 : progress / 100)
  }, [progress, active, loaded, total, onProgress])
  return null
}

function Stage() {
  const portrait = useTexture(PORTRAIT_URL)

  const data = useMemo(
    () => buildStrandData(portrait.image as HTMLImageElement),
    [portrait],
  )
  useEffect(() => () => data.dispose(), [data])

  return (
    <>
      <Backdrop />
      <Environment files="/hdri/studio.hdr" environmentIntensity={0.32} />
      <StageRig />
      <Ground />
      <Strand data={data} />
    </>
  )
}

/**
 * N8AO -> Bloom -> SMAA -> Vignette -> ToneMapping, per the post/AA playbook.
 *
 * The transform is Khronos PBR NEUTRAL here, not AgX. AgX is a filmic curve
 * built around mid-grey: it lifts shadows and rolls off highlights, so on a
 * high-key paper set it cannot hold paper AND graphite at once — either the
 * ground goes grey or the object does. Neutral preserves albedo, which is the
 * whole point of a product set. The lab route keeps AgX for Blender parity.
 *
 * Bloom threshold sits at 1.0 so only genuinely molten filament blooms. AO does
 * the heavy lifting here — contact darkening is most of what reads as form.
 */
function StagePostFX() {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <N8AO aoRadius={0.38} intensity={2.1} quality="medium" halfRes />
      <Bloom
        luminanceThreshold={1.0}
        luminanceSmoothing={0.24}
        intensity={0.55}
        mipmapBlur
      />
      <SMAA />
      <Vignette offset={0.5} darkness={0.22} eskil={false} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}

export type StageCanvasProps = {
  onProgress: (p: number) => void
}

export function StageCanvas({ onProgress }: StageCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [2.1, 1.3, 4.2], fov: 38, near: 0.1, far: 60 }}
      gl={{
        antialias: false,
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: OUTPUT_COLOR_SPACE,
        powerPreference: 'high-performance',
      }}
      className="stage-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <ToneMappingApplier />
      <Suspense fallback={null}>
        <Stage />
      </Suspense>
      <StagePostFX />
      <ProgressBridge onProgress={onProgress} />
    </Canvas>
  )
}
