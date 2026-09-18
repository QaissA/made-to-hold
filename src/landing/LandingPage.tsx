import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'
import { Overture } from './Overture'
import { StageCanvas } from './StageCanvas'
import { stage } from './scroll/stage'
import { useStageDriver } from './scroll/useStageDriver'
import { AnchorRail } from './ui/AnchorRail'
import { Counter } from './ui/Counter'
import { HoldHint } from './ui/HoldHint'
import { Marquee } from './ui/Marquee'
import { NozzleCursor } from './ui/NozzleCursor'
import { SpoolGauge } from './ui/SpoolGauge'
import { SplitText } from './ui/SplitText'
import { TiltCard } from './ui/TiltCard'

const GRAIN = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/></filter>' +
    '<rect width="100%" height="100%" filter="url(#n)"/></svg>',
)

const TICKER = [
  'Made to hold',
  'نطبع ما يهم',
  'Give it form',
  'From screen to substance',
  'Casablanca',
]

const CATALOGUE = [
  {
    n: '04',
    title: 'Topography',
    copy: 'Any coastline, any ridge line, cut to a tile you can set on a desk.',
  },
  {
    n: '05',
    title: 'Soundwave',
    copy: 'Six seconds of a voice, raised into a ridge you can run a thumb along.',
  },
  {
    n: '06',
    title: 'Keepsake',
    copy: 'A ring box, an urn, a chess set — made once, for one person, then the file is closed.',
  },
  {
    n: '07',
    title: 'Architecture',
    copy: 'Massing models and facade studies, printed overnight for the morning review.',
  },
]

export function LandingPage() {
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useStageDriver(!loading)

  // The stage driver is not running yet, so scrolling during the loader would
  // skip acts without the 3D ever knowing. Pin the page until extrusion starts.
  useEffect(() => {
    if (!loading) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.overflow = previous
    }
  }, [loading])

  const finish = useCallback(() => {
    stage.started = true
    setLoading(false)
  }, [])

  return (
    <div className="mth">
      <StageCanvas onProgress={setProgress} />

      <div
        className="mth-grain"
        aria-hidden
        style={{ backgroundImage: `url("data:image/svg+xml,${GRAIN}")` }}
      />
      <div className="mth-vignette" aria-hidden />

      <NozzleCursor />

      {loading && <Overture progress={progress} onDone={finish} />}

      <header className="nav">
        <Link className="nav__brand" to="/" data-magnetic>
          <span className="nav__brand-mark" aria-hidden />
          Made to hold
        </Link>
        <nav className="nav__links">
          <a href="#effort">Work</a>
          <a href="#craft">Process</a>
          <a href="#yours">Order</a>
          <Link to="/lab">Lab</Link>
        </nav>
      </header>

      <SpoolGauge />
      <AnchorRail />
      {!loading && <HoldHint />}

      <main className="acts">
        {/* ——— 01 HERO ——— */}
        <section className="act act--hero" data-act="hero" id="top">
          <div className="hero">
            <p className="eyebrow">
              <span className="eyebrow__dot" aria-hidden />
              Casablanca &middot; additive studio &middot; est. 2024
            </p>

            <h1 className="hero__title">
              <SplitText by="char" step={0.035} as="span">
                Made
              </SplitText>
              <SplitText
                by="char"
                step={0.035}
                delay={0.18}
                as="span"
                className="hero__title-line hero__title-line--alt"
              >
                to hold.
              </SplitText>
            </h1>

            <p className="hero__lede">
              <SplitText by="word" step={0.03} delay={0.55}>
                A run you did. A face you love. A pattern eight centuries old.
                We print them, in Casablanca, and hand them to you.
              </SplitText>
            </p>

            <div className="hero__actions">
              <a className="btn btn--hot" href="#yours" data-magnetic>
                <span>Start a print</span>
              </a>
              <a className="btn btn--ghost" href="#effort" data-magnetic>
                <span>See the work</span>
              </a>
            </div>
          </div>

          <div className="scroll-cue" aria-hidden>
            <span className="scroll-cue__label">Scroll to extrude</span>
            <span className="scroll-cue__track">
              <span className="scroll-cue__head" />
            </span>
          </div>
        </section>

        {/* ——— 02 MANIFESTO ——— */}
        <section className="act act--manifesto" data-act="manifesto">
          <div className="panel">
            <p className="kicker">
              <span>02</span> Matter
            </p>
            <h2 className="display">
              <SplitText by="line" step={0.09}>
                {'A screen can show you\nanything. It cannot\nhand you a thing.'}
              </SplitText>
            </h2>
            <div className="columns">
              <p>
                Everything we make starts as data — a GPX trace, a JPEG, a
                drawing copied from a wall in Fez. Data is weightless. It is
                also forgettable.
              </p>
              <p>
                So we put it on a bed and build it, two hundred microns at a
                time, until there is an object in the room that was not there
                before — one you can pick up, and put down somewhere.
              </p>
            </div>
          </div>
        </section>

        <Marquee items={TICKER} duration={38} />

        {/* ——— 03 EFFORT ——— */}
        <section className="act act--product" data-act="effort" id="effort">
          <div className="product">
            <p className="kicker kicker--hot">
              <span>01</span> Effort
            </p>
            <h2 className="product__title">
              <SplitText by="word" step={0.05}>
                Your route, as terrain.
              </SplitText>
            </h2>
            <p className="product__copy">
              Send a GPX file or a Strava link. We project your actual
              coordinates — longitude squeezed by cos(latitude), the way any
              honest map does it — then lift the line you ran out of the ground
              it crossed. Nothing is printed on the tile. The shape is the walk.
            </p>
            <dl className="spec">
              <div>
                <dt>Input</dt>
                <dd>GPX &middot; TCX &middot; Strava link</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>180 &times; 180 mm tile</dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd>Matte PLA, two-tone</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd className="spec__price">640 MAD</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ——— 04 LIGHT ——— */}
        <section
          className="act act--product act--flip"
          data-act="light"
          id="light"
        >
          <div className="product">
            <p className="kicker kicker--warm">
              <span>02</span> Light
            </p>
            <h2 className="product__title">
              <SplitText by="word" step={0.05}>
                A face that only exists in light.
              </SplitText>
            </h2>
            <p className="product__copy">
              A lithophane is a photograph made of thickness. Flat on a table
              it is a blank bone-white panel. Put a lamp behind it and the thin
              parts glow, the thick parts hold back the light, and someone you
              love comes back out of it.
            </p>
            <dl className="spec">
              <div>
                <dt>Input</dt>
                <dd>One photograph, 2 MP+</dd>
              </div>
              <div>
                <dt>Depth range</dt>
                <dd>0.8 &ndash; 3.4 mm</dd>
              </div>
              <div>
                <dt>Finish</dt>
                <dd>Walnut frame &middot; warm LED</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd className="spec__price">480 MAD</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ——— 05 HERITAGE ——— */}
        <section className="act act--product" data-act="heritage" id="heritage">
          <div className="product">
            <p className="kicker kicker--cold">
              <span>03</span> Heritage
            </p>
            <h2 className="product__title">
              <SplitText by="word" step={0.05}>
                Eight centuries, forty-one pieces.
              </SplitText>
            </h2>
            <p className="product__copy">
              Zellij was never drawn. It was cut, by hand, from fired clay —
              khatam stars, safts and knots that lock together and only go back
              one way. We keep the geometry exact and change only the tool, so
              it arrives as a puzzle you assemble on a table.
            </p>
            <dl className="spec">
              <div>
                <dt>Geometry</dt>
                <dd>Khatam 8 &middot; Fez lineage</dd>
              </div>
              <div>
                <dt>Pieces</dt>
                <dd>41, interlocking</dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd>Pigmented PLA, 5 colours</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd className="spec__price">390 MAD</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ——— 06 CRAFT ——— */}
        <section className="act act--craft" data-act="craft" id="craft">
          <div className="panel">
            <p className="kicker">
              <span>04</span> Craft
            </p>
            <h2 className="display display--tight">
              <SplitText by="word" step={0.05}>
                From screen to substance.
              </SplitText>
            </h2>

            <ol className="steps">
              {[
                ['Upload', 'A file, a link, or a photo of the thing you mean.'],
                ['Model', 'We rebuild it properly — relief, thickness, fit.'],
                ['Print', '0.2 mm layers. Eight to forty hours on the bed.'],
                ['Finish', 'Sanded, sealed, packed, and put in your hands.'],
              ].map(([title, copy], i) => (
                <li className="step" key={title}>
                  <span className="step__n">0{i + 1}</span>
                  <h3 className="step__t">{title}</h3>
                  <p className="step__d">{copy}</p>
                </li>
              ))}
            </ol>

            <div className="catalogue">
              <p className="catalogue__label">Also on the bed</p>
              <div className="catalogue__grid">
                {CATALOGUE.map((item) => (
                  <TiltCard className="card" key={item.n}>
                    <span className="card__n">{item.n}</span>
                    <h3 className="card__t">{item.title}</h3>
                    <p className="card__d">{item.copy}</p>
                    <span className="card__go" aria-hidden>
                      &rarr;
                    </span>
                  </TiltCard>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ——— 07 YOURS ——— */}
        <section className="act act--close" data-act="yours" id="yours">
          <div className="close">
            <p className="kicker kicker--hot">
              <span>05</span> Yours
            </p>
            <h2 className="close__title">
              <SplitText by="char" step={0.028}>
                Start your print.
              </SplitText>
            </h2>
            <p className="close__copy">
              Tell us what you want to materialise. We reply within a day with a
              quote, a lead time, and a render of what you will be holding.
            </p>

            <div className="hero__actions">
              <a
                className="btn btn--hot btn--lg"
                href="mailto:studio@madetohold.ma"
                data-magnetic
              >
                <span>studio@madetohold.ma</span>
              </a>
              <a
                className="btn btn--ghost"
                href="https://wa.me/212000000000"
                data-magnetic
              >
                <span>WhatsApp the studio</span>
              </a>
            </div>

            <div className="tally">
              <p className="tally__n">
                <Counter to={4182} />
              </p>
              <p className="tally__l">
                objects printed and handed over since 2024
              </p>
            </div>
          </div>
        </section>
      </main>

      <Marquee items={TICKER} duration={46} reverse />

      <footer className="foot">
        <div className="foot__col">
          <span className="foot__brand">Made to hold</span>
          <span className="foot__ar">نطبع ما يهم</span>
        </div>
        <div className="foot__col foot__col--links">
          <a href="#effort">Work</a>
          <a href="#craft">Process</a>
          <a href="#yours">Order</a>
          <Link to="/lab">Look-dev lab</Link>
        </div>
        <div className="foot__col foot__col--end">
          <span>Casablanca, Morocco</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
