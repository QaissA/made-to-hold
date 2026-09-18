import { useFrame } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Lithophane } from '../products/Lithophane'
import { Printer } from '../products/Printer'
import { RouteRelief } from '../products/RouteRelief'
import { ZellijPuzzle } from '../products/ZellijPuzzle'
import { stage, type ProductId } from '../scroll/stage'
import { extruder } from './strandState'

/**
 * The turntable the products sit on.
 *
 * One product is on stage at a time; the act decides which. Swapping is a
 * hand-off, not a cut — the outgoing piece sinks away while the incoming one
 * assembles, and each product owns how it arrives (the puzzle settles piece by
 * piece, the printer grows its part, the relief rises into frame).
 *
 * Reveal is a ref, not state: every product reads it inside its own useFrame,
 * so the only React work here is mounting and unmounting, which happens a
 * handful of times per visit rather than sixty times a second.
 *
 * Hold anywhere to turn it. The lithophane and the relief park square to
 * camera — a photograph made of thickness and a map each read from exactly one
 * angle — while the printer and the puzzle turn freely.
 */

export type RevealRef = { current: number }

const ORDER: ProductId[] = ['printer', 'route', 'lithophane', 'zellij']

/** Yaw each product settles at when the turntable is not being driven. */
const PARK_YAW: Partial<Record<ProductId, number>> = {
  lithophane: 0,
  route: -0.3,
}

const IDLE_SPIN = 0.075
/** Below this a product contributes nothing but draw calls. */
const MOUNT_THRESHOLD = 0.004

export function ProductStage({ portrait }: { portrait: THREE.Texture }) {
  const groupRef = useRef<THREE.Group>(null)
  const spin = useRef({ angle: 0, velocity: 0, tilt: 0, tiltVel: 0 })
  const drag = useRef({ active: false, x: 0, y: 0 })

  const reveal = useMemo<Record<ProductId, RevealRef>>(
    () => ({
      printer: { current: 0 },
      route: { current: 0 },
      lithophane: { current: 0 },
      zellij: { current: 0 },
    }),
    [],
  )

  const [mounted, setMounted] = useState<ProductId[]>(['printer'])

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
      spin.current.velocity += (e.clientX - drag.current.x) * 0.00042
      spin.current.tiltVel += (e.clientY - drag.current.y) * 0.0002
      drag.current.x = e.clientX
      drag.current.y = e.clientY
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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    ORDER.forEach((id) => {
      const incoming = stage.started && stage.product === id
      const target = incoming ? 1 : 0
      // Asymmetric on purpose: the outgoing product leaves quickly so the
      // stage is clear before the next one lands, which is what stops a fast
      // scroll from catching two products in the same frame.
      const smoothing = stage.reduced ? 0.08 : incoming ? 0.4 : 0.13
      damp(reveal[id], 'current', target, smoothing, dt)
    })

    // Mount/unmount only on threshold crossings.
    const live = ORDER.filter(
      (id) => reveal[id].current > MOUNT_THRESHOLD || stage.product === id,
    )
    if (
      live.length !== mounted.length ||
      live.some((id, i) => mounted[i] !== id)
    ) {
      setMounted(live)
    }

    const group = groupRef.current
    if (!group) return

    const park = PARK_YAW[stage.product]
    if (park !== undefined && !drag.current.active) {
      const turn = Math.PI * 2
      const nearest =
        Math.round((spin.current.angle - park) / turn) * turn + park
      damp(spin.current, 'angle', nearest, 0.7, dt)
      spin.current.velocity *= 0.8
    } else {
      if (!drag.current.active && !stage.reduced) {
        spin.current.velocity += IDLE_SPIN * dt
      }
      spin.current.angle += spin.current.velocity
    }

    spin.current.velocity *= drag.current.active ? 0.82 : 0.94
    spin.current.tilt = THREE.MathUtils.clamp(
      spin.current.tilt + spin.current.tiltVel,
      -0.4,
      0.4,
    )
    spin.current.tiltVel *= 0.9
    if (!drag.current.active) damp(spin.current, 'tilt', 0, 0.9, dt)

    group.rotation.y = spin.current.angle
    group.rotation.x = spin.current.tilt
  })

  return (
    <group ref={groupRef}>
      <Slot id="printer" reveal={reveal.printer} mounted={mounted}>
        <Printer />
      </Slot>
      <Slot id="route" reveal={reveal.route} mounted={mounted}>
        <RouteRelief />
      </Slot>
      <Slot id="lithophane" reveal={reveal.lithophane} mounted={mounted}>
        <Lithophane portrait={portrait} reveal={reveal.lithophane} />
      </Slot>
      <Slot id="zellij" reveal={reveal.zellij} mounted={mounted}>
        <ZellijPuzzle reveal={reveal.zellij} />
      </Slot>
    </group>
  )
}

/**
 * Owns getting a product on and off stage.
 *
 * Products used to sink themselves, which meant a slow act transition left two
 * of them intersecting in the middle of the frame. Clearing the stage is not a
 * product's job — this wrapper sinks, shrinks and finally hides whatever it
 * holds, so the hand-off is correct no matter what the product does inside.
 */
function Slot({
  id,
  reveal,
  mounted,
  children,
}: {
  id: ProductId
  reveal: RevealRef
  mounted: ProductId[]
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    const group = ref.current
    if (!group) return
    const v = reveal.current
    group.visible = v > MOUNT_THRESHOLD
    if (!group.visible) return
    // Scale runs most of the way to zero rather than bottoming out at half
    // size: a product that only shrinks a little is still a large object
    // sitting in the middle of the next act's shot.
    const eased = 1 - (1 - v) ** 2
    group.position.y = (1 - eased) * -2.4
    group.scale.setScalar(0.08 + eased * 0.92)
  })

  if (!mounted.includes(id)) return null
  return <group ref={ref}>{children}</group>
}
