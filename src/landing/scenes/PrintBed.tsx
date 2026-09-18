import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { createBedMaterial } from '../shaders/bedMaterial'
import type { PlateId } from '../scroll/stage'
import { stage } from '../scroll/stage'
import type { ReliefPlate } from '../relief/reliefMaps'
import { BED_AMP, BED_SIZE, printer } from './printerState'

const RETRACT_SMOOTH = 0.26
const LAY_SMOOTH = 0.9

type Props = {
  plates: Record<PlateId, ReliefPlate>
  segments: number
}

/**
 * The bed. One surface, three plates, one rising print frontier.
 *
 * Swapping products is never a cut: the current relief melts into the next one
 * as the frontier retracts to zero, then the new plate is laid back up.
 */
export function PrintBed({ plates, segments }: Props) {
  const { material, uniforms } = useMemo(() => createBedMaterial(), [])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(BED_SIZE, BED_SIZE, segments, segments)
    return geo
  }, [segments])

  const printY = useRef({ value: 0 })
  const phase = useRef<'lay' | 'retract'>('lay')
  const shown = useRef<PlateId>('route')
  const pending = useRef<PlateId>('route')

  useEffect(() => {
    uniforms.uHeightA.value = plates.route.height
    uniforms.uAlbedoA.value = plates.route.albedo
    uniforms.uHeightB.value = plates.route.height
    uniforms.uAlbedoB.value = plates.route.albedo
    uniforms.uAmp.value = BED_AMP
    uniforms.uHotColor.value.set(PALETTE.ember)
  }, [plates, uniforms])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    if (!stage.started) {
      uniforms.uPrintY.value = 0
      return
    }

    if (stage.plate !== shown.current && phase.current === 'lay') {
      pending.current = stage.plate
      uniforms.uHeightB.value = plates[stage.plate].height
      uniforms.uAlbedoB.value = plates[stage.plate].albedo
      phase.current = 'retract'
    }

    if (stage.reduced) {
      // Calm mode: no print theatre, just hold the finished object.
      if (phase.current === 'retract') {
        shown.current = pending.current
        uniforms.uHeightA.value = plates[shown.current].height
        uniforms.uAlbedoA.value = plates[shown.current].albedo
        uniforms.uMix.value = 0
        phase.current = 'lay'
      }
      printY.current.value = 1
      uniforms.uPrintY.value = 1
      uniforms.uHot.value = 0
      printer.printY = 1
      printer.hot = 0
      return
    }

    if (phase.current === 'retract') {
      damp(printY.current, 'value', -0.06, RETRACT_SMOOTH, dt)
      damp(uniforms.uMix, 'value', 1, RETRACT_SMOOTH, dt)
      if (printY.current.value < 0.015) {
        shown.current = pending.current
        uniforms.uHeightA.value = plates[shown.current].height
        uniforms.uAlbedoA.value = plates[shown.current].albedo
        uniforms.uMix.value = 0
        phase.current = 'lay'
      }
    } else {
      damp(printY.current, 'value', 1.04, LAY_SMOOTH, dt)
    }

    const y = Math.max(0, Math.min(1, printY.current.value))
    uniforms.uPrintY.value = y

    // Raster sweep: fast across X, creeping along Z.
    const sweep = t * 2.35
    printer.nozzleX = 0.5 + 0.42 * Math.sin(sweep)
    printer.nozzleZ = ((sweep / (Math.PI * 2)) % 1) - 0.5
    uniforms.uNozzleX.value = printer.nozzleX

    // Hot while laying, plus a kick from scroll speed.
    const laying = y < 0.992 && phase.current === 'lay' ? 1 : 0
    const target = Math.max(laying, stage.heat * 0.45) * 0.88 + 0.12
    damp(uniforms.uHot, 'value', target, 0.35, dt)

    printer.printY = y
    printer.hot = uniforms.uHot.value
  })

  return (
    <group>
      {/* The printed surface */}
      <mesh
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />

      {/* Bed plate — gives the surface mass and catches the rim light.
          Its top sits just under y=0 so it never z-fights the print surface. */}
      <mesh position={[0, -0.086, 0]} receiveShadow castShadow>
        <boxGeometry args={[BED_SIZE + 0.22, 0.15, BED_SIZE + 0.22]} />
        <meshStandardMaterial
          color="#16151c"
          roughness={0.52}
          metalness={0.45}
        />
      </mesh>

      {/* Machined edge strip — a thin cold line around the hot object */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[BED_SIZE * 0.712, BED_SIZE * 0.722, 4, 1, Math.PI / 4]}
        />
        <meshBasicMaterial
          color={PALETTE.majorelleBright}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
