import { useEffect, useRef, useState } from 'react'
import { LAYER_TOTAL } from './scroll/stage'

const MIN_MS = 1500
const READY_HOLD_MS = 620
const EXIT_MS = 900
const DONE = 0.995

type Phase = 'printing' | 'ready' | 'exit' | 'gone'

export type OvertureProps = {
  /** Real asset progress, 0-1. */
  progress: number
  onDone: () => void
}

const LOG = [
  'heating nozzle',
  'levelling bed',
  'loading filament',
  'slicing geometry',
  'priming line',
]

/**
 * The loader prints the wordmark. A hot line rises through "MADE TO HOLD"
 * exactly the way the bed lays a part, so the site's first gesture is already
 * the brand's only gesture.
 */
export function Overture({ progress, onDone }: OvertureProps) {
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<Phase>('printing')
  const onDoneRef = useRef(onDone)
  const fired = useRef(false)
  onDoneRef.current = onDone

  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      setElapsed(now - t0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // UI ramp so the counter never sits at zero while assets decode.
  const ramp = Math.min(1, elapsed / MIN_MS)
  const shown = Math.max(progress, ramp * 0.99)
  const ready = progress >= DONE && elapsed >= MIN_MS

  useEffect(() => {
    if (phase === 'printing' && ready) setPhase('ready')
  }, [ready, phase])

  useEffect(() => {
    if (phase !== 'ready') return
    const id = window.setTimeout(() => setPhase('exit'), READY_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'exit' || fired.current) return
    fired.current = true
    const id = window.setTimeout(() => {
      setPhase('gone')
      onDoneRef.current()
    }, EXIT_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  if (phase === 'gone') return null

  const pct = Math.round(shown * 100)
  const layer = Math.round(shown * LAYER_TOTAL)
  const cut = (1 - shown) * 100
  const isReady = phase !== 'printing'

  return (
    <div
      className={`overture${phase === 'exit' ? ' is-exit' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={isReady ? 'Ready to hold' : `Printing ${pct} percent`}
    >
      <div className="overture__inner">
        <div className="overture__mark" aria-hidden>
          <span className="overture__ghost">
            Made
            <br />
            to hold.
          </span>
          <span
            className="overture__fill"
            style={{ clipPath: `inset(${cut}% 0 0 0)` }}
          >
            Made
            <br />
            to hold.
          </span>
          <span
            className="overture__line"
            style={{ top: `${cut}%`, opacity: isReady ? 0 : 1 }}
          />
        </div>

        <div className="overture__meta">
          <span className="overture__log">
            {isReady ? 'ready to hold' : LOG[Math.min(LOG.length - 1, Math.floor(shown * LOG.length))]}
          </span>
          <span className="overture__count">
            {isReady
              ? `${LAYER_TOTAL} / ${LAYER_TOTAL}`
              : `${String(layer).padStart(4, '0')} / ${LAYER_TOTAL}`}
          </span>
        </div>

        <div className="overture__bar">
          <span
            className="overture__bar-fill"
            style={{ transform: `scaleX(${shown})` }}
          />
        </div>
      </div>
    </div>
  )
}
