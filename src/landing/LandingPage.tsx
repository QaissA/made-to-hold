import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from './Hero'
import { Overture } from './Overture'
import { useLenis } from './scroll/useLenis'

export function LandingPage() {
  useLenis()
  const [progress, setProgress] = useState(0)
  const [showOverture, setShowOverture] = useState(true)

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
        color: 'var(--bone)',
      }}
    >
      <Hero onProgress={setProgress} />

      {showOverture && (
        <Overture progress={progress} onDone={() => setShowOverture(false)} />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          pointerEvents: 'none',
        }}
      >
        <h1 style={{ margin: 0, fontWeight: 500, letterSpacing: '0.02em' }}>
          Made to hold.
        </h1>
        <Link
          to="/lab"
          style={{ color: 'var(--bone)', pointerEvents: 'auto' }}
        >
          Open lab
        </Link>
      </div>
    </div>
  )
}
