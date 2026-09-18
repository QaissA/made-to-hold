import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from './Hero'
import { Overture } from './Overture'
import { useLenis } from './scroll/useLenis'

const GRAIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`,
)

/**
 * Marketing hero — one idea, one object, quiet type.
 * Brand first; 3D is the emotional plane (lithophane + light).
 */
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
        minHeight: '200vh',
        background: 'var(--bg)',
        color: 'var(--bone)',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          touchAction: 'pan-y',
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

        {/* Top bar — brand mark, not a dashboard */}
        <header
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem clamp(1.25rem, 4vw, 2.5rem)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              letterSpacing: '0.04em',
              color: 'var(--bone)',
            }}
          >
            Made to hold
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Light
          </span>
          <Link
            to="/lab"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              textDecoration: 'none',
              pointerEvents: 'auto',
              opacity: 0.55,
            }}
          >
            Lab
          </Link>
        </header>

        {!showOverture && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              zIndex: 3,
              width: 'min(100%, 34rem)',
              padding:
                '0 clamp(1.25rem, 4vw, 2.75rem) clamp(2rem, 6vh, 3.5rem)',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              background:
                'linear-gradient(90deg, rgba(14,13,15,0.72) 0%, rgba(14,13,15,0.35) 70%, transparent 100%)',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.75rem, 8vw, 5.5rem)',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 0.95,
                color: 'var(--bone)',
                maxWidth: '12ch',
              }}
            >
              Made to hold.
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif, var(--font-sans))',
                fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
                lineHeight: 1.45,
                color: 'var(--muted)',
                maxWidth: '28ch',
                fontStyle: 'italic',
              }}
            >
              Hold it to the light. There they are.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1.25rem',
                marginTop: '0.35rem',
                pointerEvents: 'auto',
              }}
            >
              <a
                href="#start"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.85rem 1.5rem',
                  background: 'var(--saffron)',
                  color: 'var(--bg)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: 2,
                }}
              >
                Start your print
              </a>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Scroll
              </span>
            </div>
          </div>
        )}

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,${GRAIN_SVG}")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay',
          }}
        />
      </div>

      {/* Quiet next beat placeholder for P2 spine */}
      <section
        id="start"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(2rem, 6vw, 5rem)',
          background: 'var(--bg-plaster)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Form
        </p>
        <h2
          style={{
            margin: '1rem 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 500,
            lineHeight: 1.15,
            maxWidth: '18ch',
            color: 'var(--bone)',
          }}
        >
          We turn what matters into what you can hold.
        </h2>
      </section>
    </div>
  )
}
