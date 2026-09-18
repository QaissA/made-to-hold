import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from './Hero'
import { Overture } from './Overture'
import './landing.css'
import { useLenis } from './scroll/useLenis'

const GRAIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
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
    <div className="mth">
      <div className="mth-hero">
        <div className="mth-hero__canvas">
          <Hero
            onProgress={setProgress}
            scrollProgressRef={scrollProgressRef}
          />
        </div>
        <div className="mth-hero__veil" aria-hidden />
        <div
          className="mth-hero__grain"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml,${GRAIN_SVG}")`,
          }}
        />

        {showOverture && (
          <Overture
            progress={progress}
            onDone={() => setShowOverture(false)}
          />
        )}

        <header className="mth-nav">
          <span className="mth-nav__brand">Made to hold</span>
          <span className="mth-nav__anchor">Light</span>
          <Link className="mth-nav__link" to="/lab">
            Lab
          </Link>
        </header>

        {!showOverture && (
          <div className="mth-hero__copy">
            <p className="mth-eyebrow">3D printing studio</p>
            <h1 className="mth-hero__title">Made to hold.</h1>
            <p className="mth-hero__lede">
              Hold it to the light. There they are.
            </p>
            <div className="mth-hero__actions">
              <a className="mth-cta" href="#order">
                Start your print
              </a>
              <span className="mth-scroll-hint">Scroll</span>
            </div>
          </div>
        )}
      </div>

      <section className="mth-section mth-section--plaster" id="manifesto">
        <p className="mth-kicker">Form</p>
        <h2 className="mth-display">
          We turn what matters into what you can hold.
        </h2>
        <p className="mth-body">
          A run is a feeling. A photo is a moment. A pattern is a thousand years
          of craft. We give them weight — printed, finished, and made to live
          with you.
        </p>
      </section>

      <section className="mth-section--dark" id="products" aria-label="Products">
        <article className="mth-chapter">
          <div>
            <p className="mth-chapter__index">01 — Effort</p>
            <h3 className="mth-chapter__title">Strava relief</h3>
            <p className="mth-chapter__text">
              Your route lifts off the map into a landscape you can set on a
              shelf.
            </p>
          </div>
          <div
            className="mth-chapter__visual mth-chapter__visual--strava"
            aria-hidden
          >
            <span>Route → relief</span>
          </div>
        </article>

        <article className="mth-chapter mth-chapter--flip">
          <div>
            <p className="mth-chapter__index">02 — Light</p>
            <h3 className="mth-chapter__title">Lithophane</h3>
            <p className="mth-chapter__text">
              A bone-white panel. A warm light behind it. A face that only
              appears when you hold it to the glow.
            </p>
          </div>
          <div
            className="mth-chapter__visual mth-chapter__visual--litho"
            aria-hidden
          >
            <span>Photo → light</span>
          </div>
        </article>

        <article className="mth-chapter">
          <div>
            <p className="mth-chapter__index">03 — Heritage</p>
            <h3 className="mth-chapter__title">Zellij puzzle</h3>
            <p className="mth-chapter__text">
              Moroccan geometry, printed as interlocking pieces you assemble by
              hand.
            </p>
          </div>
          <div
            className="mth-chapter__visual mth-chapter__visual--zellij"
            aria-hidden
          >
            <span>Pattern → form</span>
          </div>
        </article>
      </section>

      <section className="mth-section mth-section--plaster" id="process">
        <p className="mth-kicker">Craft</p>
        <h2 className="mth-display">From screen to substance.</h2>
        <div className="mth-process">
          <div className="mth-step">
            <p className="mth-step__n">01</p>
            <p className="mth-step__t">Upload</p>
            <p className="mth-step__d">GPX, photo, or a pattern preference.</p>
          </div>
          <div className="mth-step">
            <p className="mth-step__n">02</p>
            <p className="mth-step__t">We model</p>
            <p className="mth-step__d">Relief, thickness, and fit — tuned by hand.</p>
          </div>
          <div className="mth-step">
            <p className="mth-step__n">03</p>
            <p className="mth-step__t">We print</p>
            <p className="mth-step__d">Layer by layer, until it can be held.</p>
          </div>
          <div className="mth-step">
            <p className="mth-step__n">04</p>
            <p className="mth-step__t">You hold</p>
            <p className="mth-step__d">Finished, packed, and yours.</p>
          </div>
        </div>
      </section>

      <section className="mth-close" id="order">
        <p className="mth-kicker">Yours</p>
        <h2 className="mth-close__title">Start your print.</h2>
        <p className="mth-body" style={{ marginTop: '1.25rem' }}>
          Tell us what you want to materialize. We’ll reply with a quote.
        </p>
        <div className="mth-hero__actions" style={{ marginTop: '2rem' }}>
          <a className="mth-cta" href="mailto:hello@madeto.hold">
            Email the studio
          </a>
        </div>
      </section>

      <footer className="mth-footer">
        <span>Made to hold · Morocco</span>
        <span>نطبع ما يهم</span>
        <Link to="/lab">Look-dev lab</Link>
      </footer>
    </div>
  )
}
