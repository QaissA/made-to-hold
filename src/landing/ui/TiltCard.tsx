import { useRef, type PointerEvent, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  max?: number
}

/** A printed plate you can tip toward the light. */
export function TiltCard({ children, className, max = 7 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`)
    el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`)
    el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`)
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div
      ref={ref}
      className={['tilt', className].filter(Boolean).join(' ')}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="tilt__inner">{children}</div>
    </div>
  )
}
