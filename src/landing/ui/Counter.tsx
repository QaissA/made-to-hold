import { useEffect, useRef } from 'react'
import { useInView } from './useInView'

type Props = { to: number; duration?: number; className?: string }

/** Counts up once on entry. The studio's running total of printed objects. */
export function Counter({ to, duration = 2000, className }: Props) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.5)
  const valueRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!inView) return
    const node = valueRef.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = to.toLocaleString('en-US')
      return
    }

    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - (1 - p) ** 4
      node.textContent = Math.round(to * eased).toLocaleString('en-US')
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref} className={className}>
      <span ref={valueRef}>0</span>
    </span>
  )
}
