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

  ctx.fillStyle = '#050508'
  ctx.fillRect(0, 0, size, size)

  const c = size / 2
  ctx.strokeStyle = 'rgba(160,168,210,0.09)'
  for (let r = 14; r < c; r += 14) {
    ctx.lineWidth = r % 112 === 0 ? 2.2 : 0.8
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Fade the rings out toward the edge so the plane dissolves into fog.
  const fade = ctx.createRadialGradient(c, c, size * 0.12, c, c, size * 0.5)
  fade.addColorStop(0, 'rgba(5,5,8,0)')
  fade.addColorStop(1, 'rgba(5,5,8,1)')
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export function Ground() {
  const map = useMemo(ringTexture, [])
  useEffect(() => () => map.dispose(), [map])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow>
      <planeGeometry args={[34, 34]} />
      <meshStandardMaterial
        map={map}
        color={PALETTE.ink}
        roughness={0.96}
        metalness={0}
      />
    </mesh>
  )
}
