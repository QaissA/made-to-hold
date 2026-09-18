import { useEffect, useState } from 'react'
import Lenis from 'lenis'

/** Mounts a Lenis instance with a rAF tick; tears down on unmount. */
export function useLenis(): Lenis | null {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    const instance = new Lenis({
      // Heavier, deliberate scroll — matches materialization language
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.1,
    })
    setLenis(instance)

    let rafId = 0
    const tick = (time: number) => {
      instance.raf(time)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return lenis
}
