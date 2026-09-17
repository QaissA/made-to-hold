import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  NAV_TOGGLE_KEY,
  WALK_EYE_HEIGHT,
  WALK_SPEED,
  WALK_SPRINT_MULT,
  type NavMode,
} from '../config/nav'

type Props = {
  mode: NavMode
  onModeChange: (m: NavMode) => void
  frozen: boolean
}

const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

function WalkMover() {
  const { camera } = useThree()
  const keys = useRef({
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
  })

  useEffect(() => {
    const set = (code: string, down: boolean) => {
      if (code === 'KeyW' || code === 'ArrowUp') keys.current.forward = down
      if (code === 'KeyS' || code === 'ArrowDown') keys.current.back = down
      if (code === 'KeyA' || code === 'ArrowLeft') keys.current.left = down
      if (code === 'KeyD' || code === 'ArrowRight') keys.current.right = down
      if (code === 'ShiftLeft' || code === 'ShiftRight')
        keys.current.sprint = down
    }
    const onDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      set(e.code, true)
    }
    const onUp = (e: KeyboardEvent) => set(e.code, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  useFrame((_, dt) => {
    if (isTypingTarget(document.activeElement)) return

    const speed =
      WALK_SPEED * (keys.current.sprint ? WALK_SPRINT_MULT : 1) * dt
    camera.getWorldDirection(_forward)
    _forward.y = 0
    _forward.normalize()
    _right.crossVectors(_forward, _up).normalize()

    if (keys.current.forward) camera.position.addScaledVector(_forward, speed)
    if (keys.current.back) camera.position.addScaledVector(_forward, -speed)
    if (keys.current.left) camera.position.addScaledVector(_right, -speed)
    if (keys.current.right) camera.position.addScaledVector(_right, speed)
    camera.position.y = WALK_EYE_HEIGHT
  })

  return null
}

export function CameraNav({ mode, onModeChange, frozen }: Props) {
  const { camera } = useThree()
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  const lastOrbitTarget = useRef(new THREE.Vector3())
  const saved = useRef<{
    position: THREE.Vector3
    quaternion: THREE.Quaternion
    target: THREE.Vector3
  } | null>(null)
  const restoredTarget = useRef<THREE.Vector3 | null>(null)
  const prevMode = useRef(mode)

  // F toggle (skip when typing or frozen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== NAV_TOGGLE_KEY || e.repeat) return
      if (frozen) return
      if (isTypingTarget(e.target)) return
      e.preventDefault()
      onModeChange(mode === 'walk' ? 'orbit' : 'walk')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, onModeChange, frozen])

  // Unlock pointer when leaving walk or when frozen (pathtrace / unmount)
  useEffect(() => {
    if ((frozen || mode !== 'walk') && document.pointerLockElement) {
      document.exitPointerLock()
    }
  }, [mode, frozen])

  // Save / restore pose when entering / leaving walk
  useEffect(() => {
    if (prevMode.current === mode) return
    if (mode === 'walk') {
      const target =
        orbitControlsRef.current?.target.clone() ??
        lastOrbitTarget.current.clone()
      saved.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        target,
      }
      camera.position.y = WALK_EYE_HEIGHT
    } else if (saved.current) {
      camera.position.copy(saved.current.position)
      camera.quaternion.copy(saved.current.quaternion)
      restoredTarget.current = saved.current.target.clone()
      lastOrbitTarget.current.copy(saved.current.target)
      saved.current = null
    }
    prevMode.current = mode
  }, [mode, camera])

  // Apply restored orbit target after OrbitControls remounts
  useEffect(() => {
    if (mode !== 'orbit' || frozen || !restoredTarget.current) return
    const target = restoredTarget.current
    restoredTarget.current = null
    const apply = () => {
      const controls = orbitControlsRef.current
      if (!controls) return
      controls.target.copy(target)
      lastOrbitTarget.current.copy(target)
      controls.update()
    }
    apply()
    // Ref may not be ready until after commit; retry next frame.
    const id = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(id)
  }, [mode, frozen])

  if (frozen) return null

  if (mode === 'walk') {
    return (
      <>
        <PointerLockControls makeDefault />
        <WalkMover />
      </>
    )
  }

  return (
    <OrbitControls
      ref={orbitControlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={0.8}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.49}
      onChange={() => {
        const controls = orbitControlsRef.current
        if (controls) lastOrbitTarget.current.copy(controls.target)
      }}
    />
  )
}
