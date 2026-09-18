import { useEffect, useRef } from 'react'
import { LAYER_TOTAL, stage } from '../scroll/stage'
import { printer } from '../scenes/printerState'

const PLATE_LABEL: Record<string, string> = {
  route: 'RELIEF.GPX',
  face: 'LITHO.JPG',
  zellij: 'KHATAM.SVG',
}

function pad(n: number, width: number) {
  return String(n).padStart(width, '0')
}

/**
 * The machine readout. Driven straight from rAF against the shared stage, so
 * scrolling never re-renders React — the numbers just move, like a printer's.
 */
export function MachineHud() {
  const layerRef = useRef<HTMLSpanElement>(null)
  const fileRef = useRef<HTMLSpanElement>(null)
  const tempRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const zRef = useRef<HTMLSpanElement>(null)

  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let raf = 0
    let lastLayer = -1
    let lastFile = ''
    let lastAway: boolean | null = null

    const tick = () => {
      // Retire the read-out over the footer — the job is done by then.
      const away = stage.scroll > 0.965
      if (rootRef.current && away !== lastAway) {
        lastAway = away
        rootRef.current.classList.toggle('hud--away', away)
      }
      if (layerRef.current && stage.layer !== lastLayer) {
        lastLayer = stage.layer
        layerRef.current.textContent = pad(stage.layer, 4)
      }
      const file = PLATE_LABEL[stage.plate] ?? ''
      if (fileRef.current && file !== lastFile) {
        lastFile = file
        fileRef.current.textContent = file
      }
      if (tempRef.current) {
        const temp = 196 + Math.round(printer.hot * 24)
        tempRef.current.textContent = temp + '°C'
      }
      if (zRef.current) {
        zRef.current.textContent = (printer.printY * 42).toFixed(1) + 'mm'
      }
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${stage.scroll})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <aside className="hud" ref={rootRef} aria-hidden>
      <div className="hud__row">
        <span className="hud__key">FILE</span>
        <span className="hud__val" ref={fileRef}>
          RELIEF.GPX
        </span>
      </div>
      <div className="hud__row">
        <span className="hud__key">LAYER</span>
        <span className="hud__val">
          <span ref={layerRef}>0000</span>
          <span className="hud__dim"> / {LAYER_TOTAL}</span>
        </span>
      </div>
      <div className="hud__row">
        <span className="hud__key">Z</span>
        <span className="hud__val" ref={zRef}>
          0.0mm
        </span>
      </div>
      <div className="hud__row">
        <span className="hud__key">NOZZLE</span>
        <span className="hud__val hud__val--hot" ref={tempRef}>
          196&deg;C
        </span>
      </div>
      <div className="hud__bar">
        <span className="hud__fill" ref={barRef} />
      </div>
      <div className="hud__row hud__row--foot">
        <span className="hud__dim">0.20mm &middot; PLA &middot; 100%</span>
      </div>
    </aside>
  )
}
