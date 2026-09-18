# Made to Hold — landing page playbook

Creative direction + build spec for the studio landing page.
Built on the R3F Eevee-parity foundation (**Path A** interactive).

**Current: v2 “One Continuous Line”, light theme “Daylight Studio”.**
v1 (“The Print Line” — a print bed with a rising frontier, dark ground) is
preserved on `master` and tagged `landing-v1-print-line`.

> Tagline (locked): **“Made to hold.”**
> Retained alternates: *“Give it form.”* · *“From screen to substance.”* · *“نطبع ما يهم”*

---

## 0. The one idea

**One filament, five forms, never cut.**

A 3D printer lays one unbroken strand. So does this page. A single filament
coils into each product, then melts and re-coils into the next — never cut,
never reset. The page is paper; the filament is the dark thing lying on it.

The consequence: switching product is never a cut. It is a *re-form*, and you
watch it happen along the length of the line.

| Reference | What we borrow |
|---|---|
| Oryzo (Lusion) | One cinematic moment per product; tactile micro-interaction |
| Hubtown | Loader as an event, chaptered scroll, one-word anchors |
| Machine UIs (Prusa/Bambu) | The gauge: metres extruded, nozzle temp, spool left |

---

## 1. Narrative spine

Eight acts. One document scroll (Lenis), no snapping, no sticky sections — the
canvas is `position: fixed` and the DOM simply scrolls over it.

```
00  OVERTURE    Loader extrudes the wordmark, counting metres
01  HERO        "Made to hold." · the strand lays itself down as a vase
02  MANIFESTO   Editorial statement · camera lifts
03  EFFORT      Route · height is elevation, thickness is gradient
04  LIGHT       Spiral portrait · head-on, turntable parked
05  HERITAGE    (8,3) torus knot · eight-fold from one self-crossing path
06  CRAFT       Process + catalogue · filament rewinds onto the reel
07  YOURS       CTA · live counter · footer (returns to the vase)
```

Anchor words in the left rail:
**Form · Matter · Effort · Light · Heritage · Craft · Yours.**

Act detection is geometric: any `[data-act="<id>"]` section crossing viewport
centre owns the stage. Adding an act means adding the attribute, a camera key
and an entry in `ACTS`.

---

## 2. Art direction

### Personality

A daylight studio, not a workshop at night. Paper ground, editorial type, one
dark object with a real cast shadow. Moroccan geometry is structural, not
decorative — the heritage form is a genuine eight-fold closed path.

### Color — light theme, “Daylight Studio”

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F2EDE3` | Page ground, backdrop horizon, ground plane |
| `--paper-raised` | `#FBF8F2` | Panels, cards, the spool gauge |
| `--ink` | `#0B0C12` | Primary text |
| `--muted` | `#6D6A78` | Secondary text |
| `--majorelle` | `#3B2FE8` → `#5646FF` | Structural accent, cold light |
| `--ember` | `#FF6A2B` | **The nozzle.** Fills, CTA, rail |
| `--ember-ink` | `#C2410C` | Ember *as text* — the fill is too pale on paper |
| `--amber` / `--amber-ink` | `#FFB45C` / `#B47216` | Cooling filament / amber as text |
| `--jade` | `#1F6E5C` | Tertiary heritage green |

Rule: **ember means heat.** Only where something is being made — the print
head, the CTA, the progress rail. Never as decoration.

Scrims and translucent panels are all built from `--paper-rgb`, so the ground
can be re-themed by changing one triple rather than twenty `rgba()` literals.

**Strand temperature** (`STRAND_TEMP` in `src/config/palette.ts`) inverts with
the ground: molten `#FF5A1F` → `#D2691E` → settled `#17181F` → cold `#0C0D13`.
On paper a finished print has to be the *dark* end of the ramp, or it vanishes
into the ground it is sitting on.

### Typography

| Role | Face |
|---|---|
| Display | **Syne** 700/800 (Google Fonts) |
| Body / UI | Space Grotesk |
| Editorial | Instrument Serif |
| Machine / gauge | Space Mono |

Hero display runs `clamp(2.9rem, 10vw, 8.5rem)`; the second hero line is
stroked, not filled.

---

## 3. Motion language

- Lenis smooth scroll; one rAF loop writes a shared `stage` object
  (`src/landing/scroll/stage.ts`). Scroll drives **zero** React re-renders —
  the gauge and rail write to DOM nodes via refs.
- **Signature reveal:** bottom-to-top rise out of a clipped band (`SplitText`
  for DOM, the draw frontier for 3D). Nothing on this page fades in.
- **Hold anywhere to turn it** — pointer drag spins the strand with inertia.
  Forms that read from exactly one angle (route, portrait) park instead of
  idling; see `PARK_YAW` in `Strand.tsx`.
- The pointer warms the filament it hovers, softening and swelling it locally.
- Damped motion throughout (`maath` `damp`), never snapping.
- `prefers-reduced-motion`: the print completes instantly, the marquee and
  cursor are disabled, split text renders in place.

---

## 4. The strand material

`src/landing/shaders/strandMaterial.ts` — a patched `MeshStandardMaterial`
(canon: keep PBR + IBL + a tone-mapped composer; do not hand-roll a lit
`ShaderMaterial`).

**The tube exists only in the vertex shader.** A shell of 4096 empty rings
(`strandShell.ts`) carries two attributes — position along the strand (`aU`)
and angle around it (`aAngle`). Centre, radius and a rotation-minimising frame
are read from baked RGBA float data textures, one row per form
(`strandData.ts`). Changing product is a texture-row mix; the geometry is built
once and never touched.

| Uniform | Meaning |
|---|---|
| `uPos` / `uNrm` / `uBin` | Baked samples: xyz + radius, and the frame |
| `uRowA` / `uRowB` | Texture-V of the settled form and the incoming one |
| `uFront` / `uMorphing` | The re-forming wavefront, and its gate |
| `uMeltAmp` | How violently the molten band swells |
| `uDraw` / `uHeadPos` | First lay-down, and where undrawn rings collapse |
| `uCool` | 0 = showing print heat, 1 = cooled to one colour |
| `uTouch` / `uTouchStrength` | Local warmth under the pointer |

Two behaviours worth knowing:

- **Re-forming is a travelling wave, not a cross-fade.** `uFront` sweeps 0→1;
  everything behind it has already become the new shape, everything ahead is
  still the old one, and a molten band rides the boundary.
- **Age is measured from whichever head last passed.** Filament the wave has
  remade is young again; filament ahead of it keeps the age it had. Without
  that, freshly remade filament would read as the *coldest* on the strand.

Frames are rotation-minimising (parallel transport), not Frenet — Frenet frames
flip at inflection points, and these frames get *mixed* during a morph.

`customDepthMaterial` runs the same displacement, so self-shadowing is correct.

---

## 5. The five forms

`src/landing/filament/curves.ts`. Every curve is sampled to the same point
count with the same parameterisation — that is what lets one melt into the next.

| Form | What it is |
|---|---|
| `vase` | Spiralised single-wall print; profile from control points |
| `route` | GPX trace: height is elevation, **thickness is gradient** |
| `portrait` | One Archimedean spiral, **thickness follows image luminance** |
| `knot` | (8,3) torus knot — eight-fold from one self-crossing closed path |
| `spool` | The filament wound back onto the reel |

On the portrait: thickness follows **brightness**, not darkness. The filament
is dark on a light ground, so mass reads as shadow and the gaps between thin
turns read as paper. Inverting this prints the photograph as its own negative.

---

## 6. Render mapping

| Need | Path |
|---|---|
| The whole landing stage | **A** (WebGL2 raster + N8AO/Bloom/SMAA/Neutral) |
| Poster, og:image, HD product stills | **C** (not wired yet) |
| WebGPU | **B** (not launch) |

Composer order: N8AO → Bloom → SMAA → Vignette → ToneMapping. The renderer
stays `NoToneMapping`; the composer owns the view transform.

### Divergence from canon: the landing uses NEUTRAL, not AgX

Canon (`docs/architecture/eevee-parity.md`) makes AgX the default view
transform, and **`/lab` still does** — Blender parity depends on it.

The landing does not, because it is a high-key set. AgX is a filmic curve built
around mid-grey: it lifts shadows and rolls off highlights. Feed it a paper
albedo at unit exposure and it returns mid-grey, so the lit ground and the CSS
paper behind it refuse to match — and if you raise exposure until paper reads
as paper, the graphite filament washes out to mid-grey along with it. Both
cannot be right under that curve.

Khronos PBR Neutral preserves albedo, which is the entire point of a product
set: paper lands on paper and graphite stays graphite at one exposure.

`SET_GAIN` in `StageRig.tsx` re-exposes the whole set — lights, fog colour and
backdrop together — in one number. It sits at **1** under Neutral; a filmic
curve would need roughly **2.6**.

Two consequences that cost real time to find:

- **A dark object under bright studio light is genuinely lifted by specular
  IBL.** The strand is `roughness 0.82, metalness 0` and `environmentIntensity`
  is low, or every winding becomes a specular band and the object reads grey.
- **The ground plane runs to 150 units** so its far edge sits past the fog, and
  the backdrop is gained to match the fog colour. Otherwise the plane ends
  short of the true horizon and silhouettes as a hard line.

---

## 7. Tech stack

**Core:** three, R3F, drei, postprocessing, n8ao
**Landing:** lenis, maath, react-router-dom
**Assets:** `public/hdri/studio.hdr`, `public/textures/lithophane-portrait.jpg`
— everything else is procedural.

GSAP/ScrollTrigger is **not** used: act tracking and reveals are an
IntersectionObserver plus one rAF loop, which is cheaper and keeps the stage
state in one place.

---

## 8. Performance

- Strand: 4096 rings × 8 radial = one `BufferGeometry`, one draw call.
- Data textures: 3 × RGBA float, 4096 × 5. Baked once at load.
- `dpr` clamped to `[1, 1.75]`; `antialias: false` (SMAA in the composer).
- Rail, gauge and hold-hint are hidden under 900px.

Known gap: the stage renders continuously (`frameloop="always"`).
Demand-driven rendering with `invalidate()` on scroll is the next perf win.

---

## 9. Repo layout

```
src/landing/
  LandingPage.tsx          acts, DOM copy
  StageCanvas.tsx          the one fixed canvas + composer
  Overture.tsx             loader that extrudes the wordmark
  landing.css              all landing styling
  filament/                curves.ts · strandData.ts · strandShell.ts
  shaders/strandMaterial.ts
  scenes/                  Strand · Backdrop · Ground · StageRig · strandState
  scroll/                  stage.ts (shared state) · useStageDriver.ts
  ui/                      SplitText · SpoolGauge · AnchorRail · HoldHint ·
                           NozzleCursor · Marquee · Counter · TiltCard
src/lab/                   look-dev sandbox (unchanged, still AgX)
src/config/palette.ts      brand tokens + BACKDROP + STRAND_TEMP
```

---

## 10. Build phases

| Phase | Scope |
|---|---|
| **P1** | Routes, palette, loader, strand stage, 8 acts, gauge — **current** |
| P2 | Portrait legibility (see gaps), real product stills in the catalogue |
| P3 | Order flow (upload → quote) |
| P4 | Demand-driven frameloop, mobile art pass, no-WebGL fallback |
| P5 | Path C hero stills, og:image |

---

## 11. Known gaps

- **The spiral portrait does not yet read as a face.** It is a handsome
  abstract tonal object, but 48 turns is too coarse for facial features.
  Fixing it needs 100+ turns, which needs a wider data texture (8192+ samples,
  above the guaranteed WebGL2 minimum) and a finer tangential resolution pass.
  The product copy currently leans on legibility the render does not deliver.
- The `route` form is the visually weakest of the five — a thin line in a lot
  of empty space.
- No `frameloop="demand"`; see §8.

---

## TL;DR

One idea — **one filament, never cut** — turns a multi-product catalogue into a
single line that re-forms in front of you. Paper ground, graphite object, ember
only where something is being made. **Made to hold.**
