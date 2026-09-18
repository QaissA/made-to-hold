import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../../config/palette'

/**
 * The floor is not scenery — it exists so the strand casts a real shadow. On a
 * light set that shadow is the main thing separating the object from the
 * ground, so the plane stays close to paper and the rings stay very faint.
 */
function ringTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#F2EDE3'
  ctx.fillRect(0, 0, size, size)

  const c = size / 2
  ctx.strokeStyle = 'rgba(11,12,18,0.055)'
  for (let r = 14; r < c; r += 14) {
    ctx.lineWidth = r % 112 === 0 ? 2.2 : 0.8
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Fade the rings out toward the edge so the plane dissolves into fog.
  const fade = ctx.createRadialGradient(c, c, size * 0.12, c, c, size * 0.5)
  fade.addColorStop(0, 'rgba(242,237,227,0)')
  fade.addColorStop(1, 'rgba(242,237,227,1)')
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
        color={PALETTE.paper}
        roughness={0.96}
        metalness={0}
      />
    </mesh>
  )
}
