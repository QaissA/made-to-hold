import { useFrame, useThree } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { STRAND_SAMPLES } from '../filament/curves'
import type { StrandId } from '../filament/curves'
import { rowV, type StrandData } from '../filament/strandData'
import { buildStrandShell } from '../filament/strandShell'
import { createStrandMaterial } from '../shaders/strandMaterial'
import { stage } from '../scroll/stage'
import { extruder } from './strandState'

const DRAW_SMOOTH = 0.95
/** Seconds-ish for the re-forming wave to travel the whole strand. */
const MORPH_SPEED = 0.62
const IDLE_SPIN = 0.085
/** World units of path -> metres of 1.75 mm filament on the read-out. */
const METRES_PER_UNIT = 0.55

/**
 * Yaw each form parks at when the turntable is not being driven. Forms absent
 * from this map keep spinning — a vase, a knot and a reel all read from any
 * angle, while a route and a spiral portrait read from exactly one.
 */
const PARK_YAW: Partial<Record<StrandId, number>> = {
  route: -0.22,
  portrait: 0,
}

/** Total path length, for the metres read-out. */
function strandLength(positions: Float32Array): number {
  let total = 0
  for (let i = 1; i < STRAND_SAMPLES; i++) {
    total += Math.hypot(
      positions[i * 3] - positions[(i - 1) * 3],
      positions[i * 3 + 1] - positions[(i - 1) * 3 + 1],
      positions[i * 3 + 2] - positions[(i - 1) * 3 + 2],
    )
  }
  return total
}

/**
 * One filament, five forms, never cut.
 *
 * Owns the re-forming wave, the first lay-down, and the hold-to-spin
 * interaction. Everything visual happens in the shader; this is the machine
 * that decides what the shader is doing.
 */
export function Strand({ data }: { data: StrandData }) {
  const { camera, raycaster } = useThree()

  const geometry = useMemo(() => buildStrandShell(8), [])
  const { material, depthMaterial, uniforms } = useMemo(
    () => createStrandMaterial(),
    [],
  )

  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Group>(null)
  const headLight = useRef<THREE.PointLight>(null)

  const draw = useRef({ value: 0 })
  const front = useRef(0)
  const morphing = useRef(false)
  const shown = useRef<StrandId>('vase')
  const pending = useRef<StrandId>('vase')

  const laid = useRef(0)
  const drawDone = useRef(false)
  const spin = useRef({ angle: 0, velocity: 0, tilt: 0, tiltVel: 0 })
  const drag = useRef({ active: false, x: 0, y: 0 })

  // Metres of filament per form, so the HUD reports something true.
  const lengths = useMemo(() => {
    const out = {} as Record<StrandId, number>
    ;(Object.keys(data.curves) as StrandId[]).forEach((id) => {
      out[id] = strandLength(data.curves[id].positions)
    })
    return out
  }, [data])

  useEffect(() => {
    uniforms.uPos.value = data.position
    uniforms.uNrm.value = data.normal
    uniforms.uBin.value = data.binormal

    // Adopt whichever form the current act calls for rather than assuming the
    // top of the page: a remount (or a deep link straight into an act) must
    // not leave the shader on one form while the machine thinks it is on
    // another.
    const initial = stage.strand
    shown.current = initial
    pending.current = initial
    morphing.current = false
    front.current = 0
    uniforms.uRowA.value = rowV(initial)
    uniforms.uRowB.value = rowV(initial)
    uniforms.uMorphing.value = 0
    uniforms.uFront.value = 0
  }, [data, uniforms])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      depthMaterial.dispose()
    },
    [geometry, material, depthMaterial],
  )

  // Hold to spin. Listens on window because the canvas sits behind the DOM
  // with pointer-events off; interactive elements are excluded by target.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const interactive = 'a, button, input, textarea, select, [data-magnetic]'

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.(interactive)) return
      drag.current.active = true
      drag.current.x = e.clientX
      drag.current.y = e.clientY
      extruder.held = true
      document.body.classList.add('is-holding')
    }

    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current.x = e.clientX
      drag.current.y = e.clientY
      spin.current.velocity += dx * 0.00042
      spin.current.tiltVel += dy * 0.00022
    }

    const onUp = () => {
      drag.current.active = false
      extruder.held = false
      document.body.classList.remove('is-holding')
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.classList.remove('is-holding')
    }
  }, [])

  const touchPlane = useMemo(() => new THREE.Plane(), [])
  const tmpA = useMemo(() => new THREE.Vector3(), [])
  const tmpB = useMemo(() => new THREE.Vector3(), [])
  const inverse = useMemo(() => new THREE.Matrix4(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    uniforms.uTime.value = t

    if (!stage.started) {
      uniforms.uDraw.value = 0
      return
    }

    // --- first lay-down -------------------------------------------------
    // Paced for the hero, but anyone who scrolls on has left the reveal
    // behind — finish the object rather than make them wait for it.
    const pastHero = stage.actId !== 'hero' && stage.actId !== 'overture'
    if (stage.reduced) {
      draw.current.value = 1
    } else {
      damp(draw.current, 'value', 1.06, pastHero ? 0.3 : DRAW_SMOOTH, dt)
    }
    uniforms.uDraw.value = Math.min(1, draw.current.value)

    // --- re-forming wave ------------------------------------------------
    if (!morphing.current && stage.strand !== shown.current) {
      // A re-form can start before the first lay-down finished (fast scroll).
      // Bank whatever was actually laid so the spool never refills.
      if (!drawDone.current) {
        drawDone.current = true
        laid.current = lengths[shown.current] * uniforms.uDraw.value
      }
      pending.current = stage.strand
      uniforms.uRowB.value = rowV(stage.strand)
      uniforms.uMorphing.value = 1
      front.current = 0
      morphing.current = true
    }

    if (morphing.current) {
      front.current += dt / (stage.reduced ? 0.12 : MORPH_SPEED)
      if (front.current >= 1.12) {
        laid.current += lengths[pending.current]
        shown.current = pending.current
        uniforms.uRowA.value = uniforms.uRowB.value
        uniforms.uMorphing.value = 0
        front.current = 0
        morphing.current = false
      }
      uniforms.uFront.value = front.current
    } else if (!drawDone.current && uniforms.uDraw.value > 0.999) {
      drawDone.current = true
      laid.current = lengths[shown.current]
    }

    damp(uniforms.uMeltAmp, 'value', stage.reduced ? 0 : 1, 0.3, dt)

    // Re-heat the instant a re-form starts; cool slowly once it settles.
    const hot = morphing.current || uniforms.uDraw.value < 0.999
    damp(uniforms.uCool, 'value', hot ? 0 : 1, hot ? 0.18 : 2.4, dt)

    // --- head position on the strand ------------------------------------
    const activeId = morphing.current ? pending.current : shown.current
    const headU = morphing.current ? Math.min(1, front.current) : 1
    const idx = Math.min(
      STRAND_SAMPLES - 1,
      Math.round(headU * (STRAND_SAMPLES - 1) * uniforms.uDraw.value),
    )
    const pts = data.curves[activeId].positions
    uniforms.uHeadPos.value.set(pts[idx * 3], pts[idx * 3 + 1], pts[idx * 3 + 2])
    extruder.head.copy(uniforms.uHeadPos.value)
    extruder.front = headU
    extruder.melt = morphing.current ? 1 : 0

    if (headRef.current) {
      headRef.current.position.copy(uniforms.uHeadPos.value)
      const live = uniforms.uDraw.value < 0.999 || morphing.current
      headRef.current.visible = live
      headRef.current.scale.setScalar(live ? 1 : 0.4)
    }
    if (headLight.current) {
      headLight.current.intensity = morphing.current ? 1.6 : 0.5
    }

    // --- pointer warmth --------------------------------------------------
    const mesh = meshRef.current
    if (mesh && !stage.reduced) {
      // Intersect the pointer ray with a plane through the object facing the
      // camera, then pull that point into the strand's own space.
      camera.getWorldDirection(tmpA)
      mesh.getWorldPosition(tmpB)
      touchPlane.setFromNormalAndCoplanarPoint(tmpA.negate(), tmpB)
      raycaster.setFromCamera(state.pointer, camera)
      if (raycaster.ray.intersectPlane(touchPlane, tmpA)) {
        inverse.copy(mesh.matrixWorld).invert()
        uniforms.uTouch.value.copy(tmpA.applyMatrix4(inverse))
        damp(uniforms.uTouchStrength, 'value', extruder.held ? 1.5 : 0.85, 0.4, dt)
      }
    } else {
      uniforms.uTouchStrength.value = 0
    }

    // --- hold to spin ----------------------------------------------------
    const group = groupRef.current
    if (group) {
      // Solids of revolution look best turning; a flat spiral or a route read
      // as themselves from exactly one angle, so those forms park instead.
      const park = PARK_YAW[stage.strand]

      if (park !== undefined && !drag.current.active) {
        const turn = Math.PI * 2
        const nearest = Math.round((spin.current.angle - park) / turn) * turn + park
        damp(spin.current, 'angle', nearest, 0.7, dt)
        spin.current.velocity *= 0.8
      } else {
        if (!drag.current.active && !stage.reduced) {
          spin.current.velocity += IDLE_SPIN * dt
        }
        spin.current.angle += spin.current.velocity
      }
      spin.current.velocity *= drag.current.active ? 0.82 : 0.94
      spin.current.tilt += spin.current.tiltVel
      spin.current.tilt = Math.max(-0.5, Math.min(0.5, spin.current.tilt))
      spin.current.tiltVel *= 0.9
      // Tilt eases back to level when released, so the object never ends up
      // stuck on its side.
      if (!drag.current.active) damp(spin.current, 'tilt', 0, 0.9, dt)

      group.rotation.y = spin.current.angle
      group.rotation.x = spin.current.tilt
    }

    // --- read-out --------------------------------------------------------
    // Cumulative: filament already laid, plus whatever the current head is
    // partway through. The spool only ever empties.
    const inProgress = morphing.current
      ? lengths[pending.current] * Math.min(1, front.current)
      : drawDone.current
        ? 0
        : lengths[shown.current] * uniforms.uDraw.value
    stage.metres = (laid.current + inProgress) * METRES_PER_UNIT
    extruder.temp =
      196 + (morphing.current ? 24 : 0) + Math.round(stage.heat * 12)
  })

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        customDepthMaterial={depthMaterial}
        castShadow
        receiveShadow
        frustumCulled={false}
      />

      {/* The print head: a bead of molten filament carrying its own light,
          sitting exactly where the strand is currently being laid. */}
      <group ref={headRef}>
        <mesh>
          <sphereGeometry args={[0.035, 16, 12]} />
          <meshBasicMaterial color="#FFD8A8" toneMapped={false} />
        </mesh>
        <pointLight
          ref={headLight}
          color="#FF6A2B"
          intensity={0.9}
          distance={2.4}
          decay={2}
        />
      </group>
    </group>
  )
}
