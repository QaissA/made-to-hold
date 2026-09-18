import Lenis from 'lenis'
import { useEffect } from 'react'
import { ACTS, clamp01, LAYER_TOTAL, stage, type ActId } from './stage'

/**
 * Wires Lenis + pointer + act tracking into the shared `stage` object.
 *
 * Runs one rAF loop for the whole page: Lenis ticks, then every `[data-act]`
 * section is measured against viewport centre so both the HUD and the 3D stage
 * agree on which act we are in. Returns nothing — read `stage`.
 */
export function useStageDriver(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    stage.reduced = motionQuery.matches
    const onMotion = () => {
      stage.reduced = motionQuery.matches
    }
    motionQuery.addEventListener('change', onMotion)

    const lenis = stage.reduced
      ? null
      : new Lenis({
          duration: 1.1,
          easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.15,
        })

    const onPointer = (e: PointerEvent) => {
      stage.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      stage.pointerY = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    let sections: HTMLElement[] = []
    const collect = () => {
      sections = Array.from(document.querySelectorAll<HTMLElement>('[data-act]'))
    }
    collect()
    const mo = new MutationObserver(collect)
    mo.observe(document.body, { childList: true, subtree: true })

    let lastScroll = window.scrollY
    let raf = 0

    const tick = (time: number) => {
      lenis?.raf(time)

      const y = window.scrollY
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
      stage.scroll = clamp01(y / max)
      stage.layer = Math.round(stage.scroll * LAYER_TOTAL)

      const speed = Math.abs(y - lastScroll)
      lastScroll = y
      stage.heat += (Math.min(1, speed / 55) - stage.heat) * 0.12

      const centre = window.innerHeight * 0.5
      for (let i = 0; i < sections.length; i++) {
        const el = sections[i]
        const rect = el.getBoundingClientRect()
        if (rect.top <= centre && rect.bottom > centre) {
          const id = el.dataset.act as ActId | undefined
          if (id && ACTS[id]) {
            stage.actId = id
            stage.plate = ACTS[id].plate
            stage.actLocal = clamp01((centre - rect.top) / Math.max(1, rect.height))
          }
          break
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      window.removeEventListener('pointermove', onPointer)
      motionQuery.removeEventListener('change', onMotion)
      lenis?.destroy()
    }
  }, [enabled])
}
