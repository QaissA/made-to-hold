import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'

/**
 * The floor is not scenery — it exists so the strand casts a real shadow and
 * reads as an object with a place, rather than a graphic floating in a void.
 * Concentric machined rings give the light something to catch without ever
 * competing with the filament.
 */
function ringTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#04060E'
  ctx.fillRect(0, 0, size, size)

  const c = size / 2
  ctx.strokeStyle = 'rgba(150,170,255,0.10)'
  for (let r = 14; r < c; r += 14) {
    ctx.lineWidth = r % 112 === 0 ? 2.2 : 0.8
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Fade the rings out toward the edge so the plane dissolves into fog.
  const fade = ctx.createRadialGradient(c, c, size * 0.12, c, c, size * 0.5)
  fade.addColorStop(0, 'rgba(4,6,14,0)')
  fade.addColorStop(1, 'rgba(4,6,14,1)')
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Plane size, and the span the ring pattern actually covers within it. */
const GROUND_SIZE = 150
const RING_SPAN = 24

export function Ground() {
  const map = useMemo(() => {
    const tex = ringTexture()
    // The plane has to run far past the fog's reach, otherwise its far edge
    // silhouettes against the backdrop as a hard horizon line. The rings stay
    // sized to the subject; everything beyond clamps to the texture's own
    // faded black edge.
    const repeat = GROUND_SIZE / RING_SPAN
    tex.repeat.set(repeat, repeat)
    tex.offset.set((1 - repeat) / 2, (1 - repeat) / 2)
    return tex
  }, [])

  useEffect(() => () => map.dispose(), [map])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial
        map={map}
        color={PALETTE.ink}
        roughness={0.96}
        metalness={0}
      />
    </mesh>
  )
}
