import { useEffect, useRef, useState } from 'react'

const MAGNET_RANGE = 90

/**
 * The pointer is the nozzle: a hot dot with a cold ring that snaps to anything
 * marked `data-magnetic`. Pointer-only — it never appears on touch, and it is
 * suppressed entirely under reduced motion.
 */
export function NozzleCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || calm) return
    setEnabled(true)

    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const ring = { x: pos.x, y: pos.y, s: 1 }
    let targetScale = 1

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY

      const el = (e.target as HTMLElement | null)?.closest?.(
        '[data-magnetic]',
      ) as HTMLElement | null

      if (el) {
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const d = Math.hypot(e.clientX - cx, e.clientY - cy)
        if (d < Math.max(r.width, r.height) / 2 + MAGNET_RANGE) {
          pos.x = cx + (e.clientX - cx) * 0.35
          pos.y = cy + (e.clientY - cy) * 0.35
          targetScale = 2.6
          el.style.setProperty('--mx', `${(e.clientX - cx) * 0.18}px`)
          el.style.setProperty('--my', `${(e.clientY - cy) * 0.18}px`)
          return
        }
      }
      targetScale = 1
      document
        .querySelectorAll<HTMLElement>('[data-magnetic]')
        .forEach((node) => {
          node.style.setProperty('--mx', '0px')
          node.style.setProperty('--my', '0px')
        })
    }

    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const tick = () => {
      ring.x += (pos.x - ring.x) * 0.16
      ring.y += (pos.y - ring.y) * 0.16
      ring.s += (targetScale - ring.s) * 0.14
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) scale(${ring.s})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  if (!enabled) return null

  return (
    <div className="nozzle-cursor" aria-hidden>
      <div className="nozzle-cursor__ring" ref={ringRef} />
      <div className="nozzle-cursor__dot" ref={dotRef} />
    </div>
  )
}
