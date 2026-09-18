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

const ORDER: ActId[] = [
  'hero',
  'manifesto',
  'effort',
  'light',
  'heritage',
  'craft',
  'yours',
]

/**
 * The shot list. Each form is framed for what it actually is: the vase in
 * three-quarter, the route from low and along its length, the portrait spiral
 * dead-on (it only resolves face-first), the knot from above.
 */
const KEYS: Record<ActId, Key> = {
  overture: { pos: [2.1, 1.05, 4.2], target: [0, 0.22, 0], lateral: 0 },
  hero: { pos: [2.1, 1.05, 4.2], target: [0, 0.22, 0], lateral: -1.3 },
  manifesto: { pos: [0.4, 3.0, 4.1], target: [0, -0.1, 0], lateral: 0.35 },
  // Down at the horizon and along the run, so elevation reads as elevation.
  effort: { pos: [1.15, 0.62, 3.5], target: [0, 0.02, 0], lateral: -1.0 },
  // The spiral portrait is a flat coil — anything but head-on is noise.
  light: { pos: [0, 0.15, 4.35], target: [0, 0, 0], lateral: 1.05 },
  // Pattern before object.
  heritage: { pos: [0.25, 3.6, 2.6], target: [0, 0, 0], lateral: 0 },
  craft: { pos: [3.2, 1.5, 3.4], target: [0, 0, 0], lateral: -0.75 },
  yours: { pos: [1.5, 1.0, 5.4], target: [0, 0.05, 0], lateral: -0.35 },
}

function easeInOut(t: number) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

export function StageRig() {
  const { camera } = useThree()

  const pos = useMemo(() => new THREE.Vector3(2.1, 1.3, 4.2), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const warm = useRef<THREE.PointLight>(null)
  const cold = useRef<THREE.PointLight>(null)
  const lit = useRef({ warm: 0, cold: 0 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const smooth = 1 - Math.exp(-dt * (stage.reduced ? 12 : 2.4))

    const actId = stage.actId === 'overture' ? 'hero' : stage.actId
    const i = Math.max(0, ORDER.indexOf(actId))
    const a = KEYS[ORDER[i]]
    const b = KEYS[ORDER[Math.min(i + 1, ORDER.length - 1)]]
    const k = easeInOut(stage.actLocal)

    const px = a.pos[0] + (b.pos[0] - a.pos[0]) * k
    const py = a.pos[1] + (b.pos[1] - a.pos[1]) * k
    const pz = a.pos[2] + (b.pos[2] - a.pos[2]) * k
    const tx = a.target[0] + (b.target[0] - a.target[0]) * k
    const ty = a.target[1] + (b.target[1] - a.target[1]) * k
    const tz = a.target[2] + (b.target[2] - a.target[2]) * k
    const lateral = a.lateral + (b.lateral - a.lateral) * k

    // Lateral dolly: shift camera and target together along the view's right
    // axis, sliding the object across the frame without re-aiming it.
    tmp.set(tx - px, ty - py, tz - pz)
    right.copy(tmp).cross(up).normalize()

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

    // The portrait needs warm raking light; the knot needs cold structure.
    const warmTarget = actId === 'light' ? 1 : 0.15
    const coldTarget = actId === 'heritage' ? 1 : 0.2
    lit.current.warm += (warmTarget - lit.current.warm) * Math.min(1, dt * 2.2)
    lit.current.cold += (coldTarget - lit.current.cold) * Math.min(1, dt * 2.2)

    if (warm.current) warm.current.intensity = 1 + lit.current.warm * 9
    if (cold.current) cold.current.intensity = 1 + lit.current.cold * 7
  })

  return (
    <>
      {/* Matches the backdrop horizon so the ground has no visible edge. */}
      <fogExp2 attach="fog" args={[BACKDROP.horizon, 0.115]} />

      {/* Key — the only shadow caster, raking so the coil reads as coil */}
      <directionalLight
        position={[-3.6, 4.4, 3.0]}
        intensity={1.05}
        color="#dfe4ff"
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

      <hemisphereLight args={['#1b2450', '#04060E', 0.38]} />

      {/* Warm fill from below-front: lights the underside of every winding */}
      <pointLight
        ref={warm}
        position={[1.4, -0.9, 2.6]}
        color={PALETTE.amber}
        intensity={1}
        distance={9}
        decay={2}
      />

      {/* Cold rim from behind: separates the strand from the void */}
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
