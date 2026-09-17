import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from './Hero'
import { Overture } from './Overture'
import { useLenis } from './scroll/useLenis'

const GRAIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`,
)

export function LandingPage() {
  const lenis = useLenis()
  const scrollProgressRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const [showOverture, setShowOverture] = useState(true)

  useEffect(() => {
    if (!lenis) return
    const onScroll = (instance: { progress: number }) => {
      scrollProgressRef.current = instance.progress
    }
    lenis.on('scroll', onScroll)
    return () => {
      lenis.off('scroll', onScroll)
    }
  }, [lenis])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '120vh',
        background: 'var(--bg)',
        color: 'var(--bone)',
      }}
    >
      {/* Sticky hero plane — P1 is a single 100vh act; spacer below keeps Lenis alive */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Hero
          onProgress={setProgress}
          scrollProgressRef={scrollProgressRef}
        />

        {showOverture && (
          <Overture
            progress={progress}
            onDone={() => setShowOverture(false)}
          />
        )}

        {!showOverture && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: '12vh',
              gap: '1rem',
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(3rem, 12vw, 8rem)',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 0.95,
                color: 'var(--bone)',
              }}
            >
              Made to hold.
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              Scroll
            </p>
            <Link
              to="/lab"
              style={{
                marginTop: '0.5rem',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8rem',
                letterSpacing: '0.06em',
                color: 'var(--muted)',
                textDecoration: 'none',
                pointerEvents: 'auto',
                opacity: 0.7,
              }}
            >
              Lab
            </Link>
          </div>
        )}

        {/* Film grain */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,${GRAIN_SVG}")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay',
          }}
        />
      </div>

      {/* Extra scroll room so Lenis isn't a no-op on a 100vh hero */}
      <div style={{ height: '20vh' }} aria-hidden />
    </div>
  )
}
