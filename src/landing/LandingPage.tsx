import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Overture } from './Overture'
import { useLenis } from './scroll/useLenis'

/** Smoke-test ramp until Hero wires real useProgress. */
function useFakeProgress(durationMs = 1200) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs)
      setProgress(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs])

  return progress
}

export function LandingPage() {
  useLenis()
  const progress = useFakeProgress()
  const [showOverture, setShowOverture] = useState(true)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--bone)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
      }}
    >
      {showOverture && (
        <Overture progress={progress} onDone={() => setShowOverture(false)} />
      )}
      <h1 style={{ margin: 0, fontWeight: 500, letterSpacing: '0.02em' }}>
        Made to hold.
      </h1>
      <Link to="/lab" style={{ color: 'var(--bone)' }}>
        Open lab
      </Link>
    </div>
  )
}
