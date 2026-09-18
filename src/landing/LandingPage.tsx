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
  'One continuous line',
  'Never cut',
  'Casablanca',
]

const CATALOGUE = [
  {
    n: '04',
    title: 'Topography',
    copy: 'Any coastline, any ridge line, wound flat into a tile you can set on a desk.',
  },
  {
    n: '05',
    title: 'Soundwave',
    copy: 'Six seconds of a voice, where the strand thickens on every syllable.',
  },
  {
    n: '06',
    title: 'Keepsake',
    copy: 'A ring box, an urn, a chess set — made once, for one person, then the file is closed.',
  },
  {
    n: '07',
    title: 'Architecture',
    copy: 'Massing models and facade studies, wound overnight for the morning review.',
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
                One filament, never cut. It leaves the nozzle at 214°C and keeps
                going until it is the thing you asked for.
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
                So we give it a path. A single line, two hundred microns wide,
                that starts somewhere and does not stop — and when it finally
                does, there is an object on the bed that was not there before.
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
                Your route, as one line.
              </SplitText>
            </h2>
            <p className="product__copy">
              Send a GPX file or a Strava link. Height is your elevation.
              Thickness is your gradient — the strand physically swells on the
              climbs. Nothing is drawn on it. The line is the data.
            </p>
            <dl className="spec">
              <div>
                <dt>Input</dt>
                <dd>GPX &middot; TCX &middot; Strava link</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>180 &times; 180 mm, wall-mounted</dd>
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
                A face, wound forty-eight times.
              </SplitText>
            </h2>
            <p className="product__copy">
              One spiral, from the centre outward. In the highlights the strand
              thickens until neighbouring turns touch and merge; in the shadows
              it thins away to nothing and the dark comes through. There is no
              image on the surface — the winding is the only ink there is.
            </p>
            <dl className="spec">
              <div>
                <dt>Input</dt>
                <dd>One photograph, 2 MP+</dd>
              </div>
              <div>
                <dt>Winding</dt>
                <dd>48 turns &middot; 0.25 &ndash; 2.2 mm</dd>
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
                Eight-fold, and one single path.
              </SplitText>
            </h2>
            <p className="product__copy">
              Zellij was never drawn. It was cut, by hand, from fired clay —
              eight-fold symmetry reached by pieces that interlock. We reach the
              same symmetry the only way a printer can: one closed path that
              crosses itself, eight times around.
            </p>
            <dl className="spec">
              <div>
                <dt>Geometry</dt>
                <dd>Khatam 8 &middot; Fez lineage</dd>
              </div>
              <div>
                <dt>Path</dt>
                <dd>Closed, 8 &times; 3 crossings</dd>
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
                ['Path', 'We solve it as one route the nozzle can actually walk.'],
                ['Extrude', '0.2 mm wide. Eight to forty hours without stopping.'],
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
              <p className="catalogue__label">Also on the spool</p>
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
