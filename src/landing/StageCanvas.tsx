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
import { PALETTE } from '../config/palette'
import {
  createFacePlate,
  createRoutePlate,
  createZellijPlate,
  disposePlate,
  type ReliefPlate,
} from './relief/reliefMaps'
import { Gantry } from './scenes/Gantry'
import { PrintBed } from './scenes/PrintBed'
import { StageRig } from './scenes/StageRig'
import { ZellijFloor } from './scenes/ZellijFloor'
import type { PlateId } from './scroll/stage'

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

function usePlates(): Record<PlateId, ReliefPlate> {
  const portrait = useTexture(PORTRAIT_URL)

  const plates = useMemo(() => {
    const image = portrait.image as HTMLImageElement
    return {
      route: createRoutePlate(),
      face: createFacePlate(image),
      zellij: createZellijPlate(),
    } satisfies Record<PlateId, ReliefPlate>
  }, [portrait])

  useEffect(
    () => () => {
      disposePlate(plates.route)
      disposePlate(plates.face)
      disposePlate(plates.zellij)
    },
    [plates],
  )

  return plates
}

function Stage({ segments }: { segments: number }) {
  const plates = usePlates()

  return (
    <>
      <Environment files="/hdri/studio.hdr" environmentIntensity={0.26} />
      <StageRig />
      <ZellijFloor />
      <PrintBed plates={plates} segments={segments} />
      <Gantry />
    </>
  )
}

/**
 * Pass order per the post/AA playbook: N8AO -> Bloom -> SMAA -> Vignette ->
 * ToneMapping(AgX). Bloom sits low on the threshold because the hot extrusion
 * line is the one thing on this page allowed to blow out.
 */
function StagePostFX() {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <N8AO aoRadius={0.55} intensity={1.7} quality="medium" halfRes />
      <Bloom
        luminanceThreshold={1.0}
        luminanceSmoothing={0.22}
        intensity={1.25}
        mipmapBlur
      />
      <SMAA />
      <Vignette offset={0.28} darkness={0.72} eskil={false} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}

export type StageCanvasProps = {
  onProgress: (p: number) => void
}

export function StageCanvas({ onProgress }: StageCanvasProps) {
  const segments = useMemo(() => {
    if (typeof window === 'undefined') return 256
    return window.innerWidth < 900 ? 128 : 256
  }, [])

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [2.5, 2.3, 3.5], fov: 38, near: 0.1, far: 60 }}
      gl={{
        antialias: false,
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: OUTPUT_COLOR_SPACE,
        powerPreference: 'high-performance',
      }}
      className="stage-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <ToneMappingApplier />
      <color attach="background" args={[PALETTE.ink]} />
      <Suspense fallback={null}>
        <Stage segments={segments} />
      </Suspense>
      <StagePostFX />
      <ProgressBridge onProgress={onProgress} />
    </Canvas>
  )
}
