import { useEffect, useRef, useState } from 'react'

const MIN_MS = 800
const READY_HOLD_MS = 700
const FADE_MS = 450
const DONE_THRESHOLD = 0.99

type Phase = 'loading' | 'ready' | 'out'

export type OvertureProps = {
  /** Real load progress 0–1 from parent / hero */
  progress: number
  onDone: () => void
}

const TILE_COLORS = [
  'var(--majorelle)',
  'var(--saffron)',
  'var(--terracotta)',
  'var(--majorelle)',
  'var(--saffron)',
  'var(--terracotta)',
  'var(--saffron)',
  'var(--majorelle)',
  'var(--terracotta)',
] as const

/** 3×3 diamond lattice — zellij-adjacent, 9 tiles. */
function ZellijGrid({ display }: { display: number }) {
  const size = 200
  const cell = size / 3
  const half = cell / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      style={{
        transform: `scale(${0.55 + display * 0.45})`,
        opacity: 0.28 + display * 0.72,
        transition: 'transform 100ms linear, opacity 100ms linear',
      }}
    >
      {TILE_COLORS.map((fill, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const cx = col * cell + half
        const cy = row * cell + half
        const r = half * (0.55 + display * 0.35)
        const d = `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`
        return (
          <path
            key={i}
            d={d}
            fill={fill}
            opacity={0.4 + (i % 3) * 0.18}
          />
        )
      })}
    </svg>
  )
}

export function Overture({ progress, onDone }: OvertureProps) {
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [exiting, setExiting] = useState(false)
  const onDoneRef = useRef(onDone)
  const finishStartedRef = useRef(false)
  const doneFiredRef = useRef(false)

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

  // UI-only ramp so the counter isn't stuck at 0% if parent progress lags.
  const timedRamp = Math.min(1, elapsed / MIN_MS)
  const display = Math.max(progress, timedRamp)
  const canFinish = progress >= DONE_THRESHOLD && elapsed >= MIN_MS

  useEffect(() => {
    if (phase !== 'loading' || !canFinish || finishStartedRef.current) return
    finishStartedRef.current = true
    setPhase('ready')
  }, [canFinish, phase])

  useEffect(() => {
    if (phase !== 'ready') return
    const hold = window.setTimeout(() => setExiting(true), READY_HOLD_MS)
    return () => window.clearTimeout(hold)
  }, [phase])

  useEffect(() => {
    if (!exiting || doneFiredRef.current) return
    const fade = window.setTimeout(() => {
      doneFiredRef.current = true
      setPhase('out')
      onDoneRef.current()
    }, FADE_MS)
    return () => window.clearTimeout(fade)
  }, [exiting])

  if (phase === 'out') return null

  const showReady = phase === 'ready'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        showReady ? 'Ready to hold.' : `Loading ${Math.round(display * 100)} percent`
      }
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.75rem',
        background: 'var(--bg)',
        color: 'var(--bone)',
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: exiting ? 'none' : 'auto',
      }}
    >
      <ZellijGrid display={display} />

      {showReady ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '1.125rem',
            letterSpacing: '0.04em',
            color: 'var(--bone)',
          }}
        >
          Ready to hold.
        </p>
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
          }}
        >
          {`${Math.round(display * 100)}%`}
        </p>
      )}
    </div>
  )
}
