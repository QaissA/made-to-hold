# Made to Hold — landing page playbook

Creative direction + build spec for the studio landing page.
Built on the R3F Eevee-parity foundation (**Path A** interactive · **Path C** stills later).

**Rebrand (current): “The Print Line.”** Supersedes the earlier seven-act
scroll-film direction. P1 decisions that still hold are in
[`docs/plans/2026-09-17-made-to-hold-p1-design.md`](../plans/2026-09-17-made-to-hold-p1-design.md).

> Tagline (locked): **“Made to hold.”**
> Retained alternates: *“Give it form.”* · *“From screen to substance.”* · *“نطبع ما يهم”*

---

## 0. The one idea

**The whole site is one print job.**

There is a single persistent WebGL stage behind the entire document: a print
bed inside a build-volume cage, with a gantry that rides a rising print
frontier. Scroll advances the job. Every product is the same bed printing a
different plate, so changing product is never a cut — the current relief melts
back into the bed and the next one is laid up in its place.

The consequence: **one motion gesture across 2D and 3D.** DOM type rises out of
a clipped band; 3D geometry rises out of the bed. Nothing on this page fades in.

| Reference | What we borrow |
|---|---|
| Oryzo (Lusion) | One cinematic moment per product; tactile micro-interaction |
| Hubtown | Loader as an event, chaptered scroll, one-word anchors |
| Machine UIs (Prusa/Bambu) | The HUD: layer counter, Z height, nozzle temp |

---

## 1. Narrative spine

Eight acts. One document scroll (Lenis), no snapping, no sticky sections — the
canvas is `position: fixed` and the DOM simply scrolls over it.

```
00  OVERTURE    Loader prints the wordmark, layer by layer
01  HERO        "Made to hold." · bed lays the route relief
02  MANIFESTO   Editorial statement · camera lifts to plan
03  EFFORT      Strava relief · low raking camera
04  LIGHT       Lithophane · plan view, amber raking backlight
05  HERITAGE    Zellij khatam · plan view, cold majorelle accent
06  CRAFT       Process + catalogue · camera steps back
07  YOURS       CTA · live counter · footer
```

Anchor words in the left rail, one per act:
**Form · Matter · Effort · Light · Heritage · Craft · Yours.**

Act detection is geometric: any `[data-act="<id>"]` section crossing viewport
centre owns the stage. Adding an act means adding the attribute and a camera key.

---

## 2. Art direction

### Personality

A dark workshop at night with one hot machine running in it. Moroccan geometry
is structural, not decorative — the floor is a zellij lattice, the heritage
product is a real khatam tessellation.

### Color

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#07070A` | Base canvas / 3D backdrop |
| `--ink-raised` | `#111019` | Raised panels, cards |
| `--majorelle` | `#3B2FE8` → `#6B5BFF` | Structural accent, cage, cold light |
| `--ember` | `#FF6A2B` | **The nozzle.** Print frontier, CTA, rail |
| `--amber` | `#FFB45C` | Cooling filament, lithophane backlight |
| `--jade` | `#1F6E5C` | Tertiary heritage green |
| `--bone` | `#F2EDE3` | Primary text, lithophane albedo |
| `--muted` | `#8E8A9C` | Secondary text |

Rule: **ember means heat.** It is only ever used where something is being made
— the print line, the CTA, the progress rail. Never as decoration.

3D: albedo sRGB, height maps `NoColorSpace`; tone mapping **AgX** applied by
the composer (see color-foundation playbook).

### Typography

| Role | Face |
|---|---|
| Display | **Syne** 700/800 (Google Fonts) |
| Body / UI | Space Grotesk |
| Editorial | Instrument Serif |
| Machine / HUD | Space Mono |

Syne replaces the previously specified Clash Display, which was never actually
loaded. Hero display runs `clamp(2.9rem, 10vw, 8.5rem)`; the second hero line is
stroked, not filled, and warms to ember on hover.

---

## 3. Motion language — the print line

- Lenis smooth scroll; one rAF loop writes a shared `stage` object
  (`src/landing/scroll/stage.ts`). Scroll drives **zero** React re-renders —
  the HUD and rail write to DOM nodes via refs.
- **Signature reveal:** bottom-to-top rise out of a clipped band. `SplitText`
  for DOM, the frontier clamp for 3D. Used everywhere; nothing else is allowed.
- Damped motion throughout (`maath` `damp`), never snapping.
- Pointer parallax on the camera; magnetic cursor on `[data-magnetic]`.
- `prefers-reduced-motion`: the print completes instantly, the scan line,
  marquee and cursor are disabled, split text renders in place.

---

## 4. The bed shader

`src/landing/shaders/bedMaterial.ts` — a patched `MeshStandardMaterial`
(canon: keep PBR + IBL + AgX; do not hand-roll a lit `ShaderMaterial`).

| Uniform | Meaning |
|---|---|
| `uHeightA/B`, `uAlbedoA/B` | Two bound plates so one can dissolve into the next |
| `uMix` | Plate cross-dissolve, driven only during the retract phase |
| `uPrintY` | The frontier, 0–1 in relief space |
| `uAmp` | Relief scale in world units |
| `uBand`, `uHot`, `uHotColor` | The hot extrusion contour |
| `uLayerFreq` | FDM striation, modulates roughness |
| `uNozzleX` | Bright sweep tracking the head |

Key behaviour: displacement is `min(relief, uPrintY)`. Below the frontier the
object is at full relief; above it, a flat plateau — exactly how FDM lays a
part. The contour where relief crosses the frontier is the extrusion perimeter,
and it is the only thing on the page allowed to blow out (bloom threshold 1.0).

Normals are recomputed in the vertex shader from finite differences of the
*clamped* height, so the plateau shades flat and the printed part shades correctly.

The bed does **not** cast shadows (its geometry is displaced in the vertex
stage, which the depth material does not see). It receives them.

---

## 5. Relief plates

`src/landing/relief/reliefMaps.ts` generates every plate on a canvas at load:

| Plate | Height | Albedo |
|---|---|---|
| `route` | fBm terrain + three-pass stroked GPX trace | olive/jade gradient + ember route |
| `face` | portrait luminance, blurred, face-biased crop | flat bone (a lithophane has no colour) |
| `zellij` | khatam-8 tessellation, alternating star heights | majorelle / jade / ember tiles + bone grout |

All three share one contract: bed `0`, plaque base `0.2`, rim `0.33`, relief up
to `1`. Add a product by adding a plate that honours it.

---

## 6. Render mapping

| Need | Path |
|---|---|
| The whole landing stage | **A** (WebGL2 raster + N8AO/Bloom/SMAA/AgX) |
| Poster, og:image, HD product stills | **C** (not wired yet) |
| WebGPU | **B** (not launch) |

Composer order: N8AO → Bloom → SMAA → Vignette → ToneMapping(AgX). The renderer
stays `NoToneMapping`; the composer owns the view transform.

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

- Bed tessellation: 256² desktop, 128² under 900px.
- Zellij floor: one `InstancedMesh`, ~500 tiles, matrices updated per frame.
- `dpr` clamped to `[1, 1.75]`; `antialias: false` (SMAA in the composer).
- Rail and HUD are hidden under 900px.

Known gap: the stage renders continuously (`frameloop="always"`). Demand-driven
rendering with `invalidate()` on scroll is the next perf win.

---

## 9. Repo layout

```
src/landing/
  LandingPage.tsx          acts, DOM copy
  StageCanvas.tsx          the one fixed canvas + composer
  Overture.tsx             loader that prints the wordmark
  landing.css              all landing styling
  scenes/                  PrintBed · Gantry · ZellijFloor · StageRig
  shaders/bedMaterial.ts   the print-frontier material
  relief/reliefMaps.ts     procedural height + albedo plates
  scroll/                  stage.ts (shared state) · useStageDriver.ts
  ui/                      SplitText · MachineHud · AnchorRail ·
                           NozzleCursor · Marquee · Counter · TiltCard
src/lab/                   look-dev sandbox (unchanged)
src/config/palette.ts      brand tokens
```

---

## 10. Build phases

| Phase | Scope |
|---|---|
| **P1** | Routes, palette, loader, print-bed stage, 8 acts, HUD — **current** |
| P2 | Real product photography / Path C stills in the catalogue |
| P3 | Order flow (upload → quote) |
| P4 | Demand-driven frameloop, mobile art pass, no-WebGL fallback |
| P5 | Path C hero stills, og:image |

---

## TL;DR

One idea — **the site is a print job** — turns a multi-product catalogue into a
machine you watch work. Dark workshop, ember heat, zellij structure, Syne
display, **Made to hold.** One fixed Path A stage, one shared reveal gesture,
one bed printing three plates.
