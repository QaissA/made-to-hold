import { useEffect, useRef } from 'react'
import { extruder } from '../scenes/strandState'
import { SPOOL_METRES, stage } from '../scroll/stage'

const FORM_LABEL: Record<string, string> = {
  printer: 'VASE.GCODE',
  route: 'CORNICHE.GPX',
  lithophane: 'LITHO.JPG',
  zellij: 'KHATAM.SVG',
}

/**
 * The spool read-out, driven straight from rAF against the shared stage so
 * scrolling never re-renders React.
 *
 * The temperature strip is not decoration: it is the legend for the strand
 * itself, which is coloured by how long ago each millimetre was extruded.
 */
export function SpoolGauge() {
  const rootRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLSpanElement>(null)
  const metresRef = useRef<HTMLSpanElement>(null)
  const tempRef = useRef<HTMLSpanElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let lastForm = ''
    let lastAway: boolean | null = null

    const tick = () => {
      // Retire the read-out over the footer — the job is done by then.
      const away = stage.scroll > 0.965
      if (rootRef.current && away !== lastAway) {
        lastAway = away
        rootRef.current.classList.toggle('gauge--away', away)
      }

      const form = FORM_LABEL[stage.product] ?? ''
      if (formRef.current && form !== lastForm) {
        lastForm = form
        formRef.current.textContent = form
      }
      if (metresRef.current) {
        metresRef.current.textContent = stage.metres.toFixed(1) + ' m'
      }
      if (tempRef.current) {
        tempRef.current.textContent = Math.round(extruder.temp) + '°C'
      }

      const used = Math.min(1, stage.metres / SPOOL_METRES)
      if (pctRef.current) {
        pctRef.current.textContent = Math.round((1 - used) * 100) + '%'
      }
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${1 - used})`
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <aside className="gauge" ref={rootRef} aria-hidden>
      <div className="gauge__row">
        <span className="gauge__key">Form</span>
        <span className="gauge__val" ref={formRef}>
          VASE.GCODE
        </span>
      </div>
      <div className="gauge__row">
        <span className="gauge__key">Extruded</span>
        <span className="gauge__val" ref={metresRef}>
          0.0 m
        </span>
      </div>
      <div className="gauge__row">
        <span className="gauge__key">Nozzle</span>
        <span className="gauge__val gauge__val--hot" ref={tempRef}>
          198°C
        </span>
      </div>

      <div className="gauge__spool">
        <span className="gauge__spool-track">
          <span className="gauge__spool-fill" ref={barRef} />
        </span>
        <span className="gauge__val" ref={pctRef}>
          100%
        </span>
      </div>

      <div className="gauge__temp">
        <span className="gauge__temp-strip" />
        <span className="gauge__temp-labels">
          <span>now</span>
          <span>cooled</span>
        </span>
      </div>
    </aside>
  )
}
