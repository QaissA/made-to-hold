import { OrbitControls, PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
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
    const onDown = (e: KeyboardEvent) => set(e.code, true)
    const onUp = (e: KeyboardEvent) => set(e.code, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  useFrame((_, dt) => {
    const speed =
      WALK_SPEED * (keys.current.sprint ? WALK_SPRINT_MULT : 1) * dt
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize()

    if (keys.current.forward) camera.position.addScaledVector(forward, speed)
    if (keys.current.back) camera.position.addScaledVector(forward, -speed)
    if (keys.current.left) camera.position.addScaledVector(right, -speed)
    if (keys.current.right) camera.position.addScaledVector(right, speed)
    camera.position.y = WALK_EYE_HEIGHT
  })

  return null
}

export function CameraNav({ mode, onModeChange, frozen }: Props) {
  const { camera } = useThree()
  const saved = useRef<{
    position: THREE.Vector3
    quaternion: THREE.Quaternion
  } | null>(null)
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

  // Save / restore pose when entering / leaving walk
  useEffect(() => {
    if (prevMode.current === mode) return
    if (mode === 'walk') {
      saved.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
      }
      camera.position.y = WALK_EYE_HEIGHT
    } else if (saved.current) {
      camera.position.copy(saved.current.position)
      camera.quaternion.copy(saved.current.quaternion)
      saved.current = null
    }
    prevMode.current = mode
  }, [mode, camera])

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
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={0.8}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.49}
    />
  )
}
