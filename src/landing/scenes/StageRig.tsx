import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'
import { stage, type ActId } from '../scroll/stage'

type Key = {
  pos: [number, number, number]
  target: [number, number, number]
  /** Lateral dolly. Positive pushes the object left on screen. */
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

/** One camera position per act — the film's shot list. */
const KEYS: Record<ActId, Key> = {
  overture: { pos: [2.5, 2.3, 3.5], target: [0, 0.25, 0], lateral: 0 },
  // Three-quarter establishing shot, object right of the headline.
  hero: { pos: [2.5, 2.3, 3.5], target: [0, 0.25, 0], lateral: -0.85 },
  // Lift away for the editorial statement.
  manifesto: { pos: [1.1, 4.1, 3.2], target: [0, 0.15, 0], lateral: 0.2 },
  // Drop low and rake across the terrain so the route reads as landscape.
  effort: { pos: [2.3, 1.3, 2.75], target: [0, 0.3, 0], lateral: -0.95 },
  // High and near-plan: a lithophane lying on the bed only resolves into a
  // face when you look straight down it, with the backlight raking sideways.
  light: { pos: [0.25, 4.15, 2.3], target: [0, 0.3, 0], lateral: 1.0 },
  // Plan view — zellij is a pattern before it is an object.
  heritage: { pos: [0.3, 4.6, 1.35], target: [0, 0.18, 0], lateral: 0 },
  // Step back into the workshop.
  craft: { pos: [3.0, 2.15, 3.0], target: [0, 0.2, 0], lateral: -0.7 },
  // Final wide.
  yours: { pos: [1.4, 1.75, 4.6], target: [0, 0.32, 0], lateral: -0.3 },
}

function easeInOut(t: number) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

export function StageRig() {
  const { camera } = useThree()

  const pos = useMemo(() => new THREE.Vector3(2.5, 2.3, 3.5), [])
  const target = useMemo(() => new THREE.Vector3(0, 0.25, 0), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const backlight = useRef<THREE.SpotLight>(null)
  const heritage = useRef<THREE.PointLight>(null)
  const litRef = useRef({ back: 0, cold: 0 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const smooth = 1 - Math.exp(-dt * (stage.reduced ? 12 : 2.6))

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
    // axis, which slides the object across the frame without re-aiming it.
    // Dollying right pushes the object left, hence the negative keys.
    tmp.set(tx - px, ty - py, tz - pz)
    right.copy(tmp).cross(up).normalize()

    const breathe = stage.reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.23) * 0.045
    const parX = stage.reduced ? 0 : stage.pointerX * 0.32
    const parY = stage.reduced ? 0 : stage.pointerY * 0.16

    pos.set(
      px + right.x * lateral + parX,
      py + parY + breathe,
      pz + right.z * lateral,
    )
    target.set(tx + right.x * lateral, ty, tz + right.z * lateral)

    camera.position.lerp(pos, smooth)
    camera.lookAt(target)

    // Act lighting: the lithophane needs raking warmth, zellij needs cold blue.
    const backTarget = actId === 'light' ? 1 : 0
    const coldTarget = actId === 'heritage' ? 1 : 0.12
    litRef.current.back += (backTarget - litRef.current.back) * Math.min(1, dt * 2.2)
    litRef.current.cold += (coldTarget - litRef.current.cold) * Math.min(1, dt * 2.2)

    if (backlight.current) {
      backlight.current.intensity = 1.2 + litRef.current.back * 14
    }
    if (heritage.current) {
      heritage.current.intensity = litRef.current.cold * 7
    }
  })

  return (
    <>
      <fogExp2 attach="fog" args={[PALETTE.ink, 0.13]} />

      {/* Key — cool workshop overhead, the only shadow caster */}
      <directionalLight
        position={[-3.4, 5.2, 3.2]}
        intensity={1.15}
        color="#dfe4ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* Fill so the shadow side never goes dead */}
      <hemisphereLight args={['#1d1a33', '#050408', 0.3]} />

      {/* Lithophane backlight — grazes the relief from behind and below */}
      <spotLight
        ref={backlight}
        position={[0, 0.55, -2.6]}
        angle={0.75}
        penumbra={1}
        color={PALETTE.amber}
        intensity={2}
        distance={9}
        decay={2}
      />

      {/* Heritage cold accent */}
      <pointLight
        ref={heritage}
        position={[2.2, 1.4, -1.8]}
        color={PALETTE.majorelleBright}
        intensity={2}
        distance={8}
        decay={2}
      />
    </>
  )
}
