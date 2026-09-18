import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BACKDROP, PALETTE } from '../../config/palette'
import { stage, type ActId } from '../scroll/stage'
import { extruder } from './strandState'

type Key = {
  pos: [number, number, number]
  target: [number, number, number]
  /** Lateral dolly. Negative pushes the object right on screen. */
  lateral: number
}

/**
 * The shot list — one shot per act, framed for the product that act holds.
 * The machine in three-quarter, the route low and along its length, the
 * lithophane square to camera because that is the only angle it reads from,
 * the puzzle from above because zellij is a pattern before it is an object.
 */
const KEYS: Record<ActId, Key> = {
  overture: { pos: [2.2, 1.35, 4.9], target: [0, 0.4, 0], lateral: 0 },
  hero: { pos: [2.2, 1.35, 4.9], target: [0, 0.4, 0], lateral: -1.35 },
  manifesto: { pos: [0.5, 3.2, 4.6], target: [0, 0.3, 0], lateral: 0.4 },
  // Down at the horizon and along the run, so elevation reads as elevation.
  effort: { pos: [1.3, 0.85, 3.1], target: [0, 0.05, 0], lateral: -1.2 },
  // The spiral portrait is a flat coil — anything but head-on is noise.
  light: { pos: [0.1, 0.45, 2.85], target: [0, 0.12, 0], lateral: 1.1 },
  // Pattern before object.
  heritage: { pos: [0.2, 2.45, 2.05], target: [0, 0, 0], lateral: -0.15 },
  craft: { pos: [3.0, 1.9, 3.9], target: [0, 0.4, 0], lateral: -0.95 },
  yours: { pos: [1.6, 1.6, 4.6], target: [0, 0.4, 0], lateral: -0.55 },
}

/**
 * Global exposure for the set — every light, the fog colour and the backdrop
 * scale together, so this one number re-exposes the whole scene.
 *
 * Sits at 1 because the composer runs a NEUTRAL transform (see StageCanvas):
 * total irradiance of roughly pi lands a paper albedo on paper and leaves
 * graphite as graphite. Under a filmic curve it would need to be ~2.6, and the
 * dark filament would wash out to mid-grey.
 */
export const SET_GAIN = 1

/** How far each shot pushes in across its own section. */
const DRIFT_DOLLY = 0.5
/** And how far it rises. */
const DRIFT_RISE = 0.14

export function StageRig() {
  const { camera } = useThree()

  const pos = useMemo(() => new THREE.Vector3(2.1, 1.3, 4.2), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const forward = useMemo(() => new THREE.Vector3(), [])

  // A Color can hold values above 1; fog is applied pre-tone-map, so it has to
  // sit at the same exposure as everything else or the horizon splits.
  const fogColor = useMemo(
    () => new THREE.Color(BACKDROP.horizon).multiplyScalar(SET_GAIN),
    [],
  )

  const warm = useRef<THREE.PointLight>(null)
  const cold = useRef<THREE.PointLight>(null)
  const lit = useRef({ warm: 0, cold: 0 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    // Deliberately slower than the product swap, so the shot settles onto
    // whatever has just arrived instead of racing ahead of it.
    const smooth = 1 - Math.exp(-dt * (stage.reduced ? 12 : 1.7))

    const actId = stage.actId === 'overture' ? 'hero' : stage.actId
    const key = KEYS[actId]

    // Each act owns its shot outright. It used to interpolate toward the NEXT
    // act's keyframe across the section, which meant that by the bottom of a
    // section the camera had already arrived at the following shot while the
    // previous product was still on stage — the framing and the object
    // disagreed, and the whole thing read as confused.
    let px = key.pos[0]
    let py = key.pos[1]
    let pz = key.pos[2]
    const tx = key.target[0]
    const ty = key.target[1]
    const tz = key.target[2]
    const lateral = key.lateral

    forward.set(tx - px, ty - py, tz - pz)
    right.copy(forward).cross(up).normalize()
    forward.normalize()

    // Scrolling still moves the camera: each shot pushes slowly in and rises
    // across its own section. The move that matters — act to act — is left to
    // the damped lerp below, so it happens exactly when the product swaps.
    const drift = stage.actLocal - 0.5
    px += forward.x * drift * DRIFT_DOLLY
    py += forward.y * drift * DRIFT_DOLLY + drift * DRIFT_RISE
    pz += forward.z * drift * DRIFT_DOLLY

    const breathe = stage.reduced
      ? 0
      : Math.sin(state.clock.elapsedTime * 0.21) * 0.05
    // The camera stops drifting while you are holding the object — you are in
    // charge of the view then, not the film.
    const par = extruder.held || stage.reduced ? 0 : 1
    const parX = stage.pointerX * 0.3 * par
    const parY = stage.pointerY * 0.18 * par

    pos.set(
      px + right.x * lateral + parX,
      py + parY + breathe,
      pz + right.z * lateral,
    )
    target.set(tx + right.x * lateral, ty, tz + right.z * lateral)

    camera.position.lerp(pos, smooth)
    camera.lookAt(target)

    // The lithophane needs warm raking light; the zellij needs cold structure.
    const warmTarget = actId === 'light' ? 1 : 0.15
    const coldTarget = actId === 'heritage' ? 1 : 0.2
    lit.current.warm += (warmTarget - lit.current.warm) * Math.min(1, dt * 2.2)
    lit.current.cold += (coldTarget - lit.current.cold) * Math.min(1, dt * 2.2)

    if (warm.current) warm.current.intensity = (0.3 + lit.current.warm * 3.4) * SET_GAIN
    if (cold.current) cold.current.intensity = (0.3 + lit.current.cold * 2.6) * SET_GAIN
  })

  return (
    <>
      {/* Matches the backdrop horizon so the ground has no visible edge. Gained
          like everything else — fog mixes in linear space, before tone mapping. */}
      <fogExp2 attach="fog" args={[fogColor, 0.085]} />

      {/* Key — the only shadow caster. On a light set the cast shadow is the
          main thing separating the object from the ground, so it stays firm. */}
      <directionalLight
        position={[-3.6, 4.4, 3.0]}
        intensity={2.0 * SET_GAIN}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.015}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
      />

      {/*
        A light set needs a genuine ambient floor or a paper-albedo surface
        renders well below paper and the lit ground splits from the unlit
        backdrop. But ambient alone flattens everything: total irradiance is
        held near pi while the key carries most of it, so products still model.
      */}
      <ambientLight intensity={0.72 * SET_GAIN} color="#fffaf2" />
      <hemisphereLight args={['#ffffff', '#cfc7b8', 0.55 * SET_GAIN]} />

      {/* Warm fill from below-front: lifts the underside of every product */}
      <pointLight
        ref={warm}
        position={[1.4, -0.9, 2.6]}
        color={PALETTE.amber}
        intensity={1}
        distance={9}
        decay={2}
      />

      {/* Cold rim from behind: separates the product from the backdrop */}
      <pointLight
        ref={cold}
        position={[-2.4, 1.6, -2.6]}
        color={PALETTE.majorelleBright}
        intensity={1}
        distance={10}
        decay={2}
      />
    </>
  )
}
