# Made to Hold — landing page playbook

Creative direction + technical build spec for a 3D-printing studio landing page.  
Built on the R3F Eevee-parity foundation (**Path A** interactive · **Path C** pathtraced hero).

**P1 locked decisions:** see [`docs/plans/2026-09-17-made-to-hold-p1-design.md`](../plans/2026-09-17-made-to-hold-p1-design.md).

> Tagline (locked): **"Made to hold."**  
> Other options retained for bilingual/alt marketing: *"Give it form."* · *"From screen to substance."* · *"نطبع ما يهم"*

---

## 0. The big idea

The studio turns **intangible, personal things into physical objects you can hold**:

- a **Strava run/ride** → a 3D relief of your route
- a **photo of someone** → a backlit **lithophane** that reveals the image in light
- **Moroccan zellij** → a tactile 3D puzzle
- …and more

Every product is the same story: **effort, memory, and heritage — materialized.** The site’s motion metaphor is the machine itself: **things print into existence, layer by layer.**

| Reference | What we borrow |
|---|---|
| Oryzo (Lusion) | One cinematic hero moment per product + tactile micro-interactions |
| Hubtown | Strong loader, chaptered scroll, big editorial type, one-word anchors |
| Shopify BFCM | Live “objects printed” counter / globe energy |

---

## 1. Narrative spine (scroll structure)

Seven full-viewport acts. Smooth scroll (Lenis); nothing snaps.

```
00  OVERTURE      Loader — print bed / zellij assembles (0→100%)
01  HERO          Trio materializes. "Made to hold."
02  MANIFESTO     Editorial statement
03  STRAVA        Route → 3D relief ribbon
04  LITHOPHANE    Light behind panel reveals a face
05  ZELLIJ        Pattern folds into puzzle pieces
06  MORE + PROCESS  Gallery + upload → model → print → hold
07  CTA / ORDER   Start your print · live counter · footer
```

Anchor words (top-left, per act): **Form · Effort · Light · Heritage · Craft · Yours.**

---

## 2. Art direction

### Personality

Moroccan soul, modern engineering. Dark cinematic canvas so lit 3D and lithophanes pop. Zellij geometry is the design DNA (loader, dividers, motifs).

### Color

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0E0D0F` | Base canvas / 3D backdrop |
| `--bg-plaster` | `#1A1720` | Raised panels |
| `--majorelle` | `#3B33E0` → `#5B4BFF` | Signature accent |
| `--saffron` | `#E8A13A` | CTA, lithophane glow |
| `--terracotta` | `#C05A3E` | Secondary warm |
| `--zellij-green` | `#1F6E5C` | Tertiary geometric |
| `--bone` | `#EDE6D8` | Primary text |
| `--muted` | `#8A8494` | Secondary text |

3D: albedo sRGB, data maps linear; tone mapping **AgX** (color-foundation playbook).

### Typography

| Role | Recommended |
|---|---|
| Display | Clash Display (Fontshare) |
| Body / UI | Space Grotesk |
| Editorial serif | Instrument Serif |
| Arabic | IBM Plex Sans Arabic / Noto Kufi Arabic |
| Mono | Space Mono |

Real DOM text only (SEO + a11y). Oversized display on hero (`clamp` ~12–16vw).

### Motifs

Zellij tessellation, fine film grain, FDM layer-line striation on dividers/hovers.

---

## 3. Motion language — materialization

- Lenis smooth scroll; GSAP ScrollTrigger (DOM); R3F `useScroll` (3D) — ScrollTrigger from **P2**
- Damped motion (`maath` damp/damp3) — never snap
- Signature reveal: bottom→top print sweep (clip/dissolve) shared by DOM + 3D
- `frameloop="demand"` when idle; invalidate on scroll/interaction; pause off-screen

---

## 4. Section blueprint (summary)

| Act | 3D focus | Path |
|---|---|---|
| 00 Overture | DOM/SVG zellij + progress | Warm WebGL |
| 01 Hero | Procedural trio turntable + print | A (+ C stills later) |
| 02 Manifesto | Minimal / type-led | — |
| 03 Strava | Polyline → extruded ribbon | A (+ C still) |
| 04 Lithophane | Backlight transmission reveal | A interactive · C HD |
| 05 Zellij | Flat → puzzle assembly | A (+ C still) |
| 06 More | Gallery stills + process | Mostly C stills |
| 07 CTA | Hero return + form | A |

---

## 5. Render mapping

| Need | Path |
|---|---|
| Scroll / orbit / drag heroes | **A** |
| Poster, og:image, HD capture, lithophane beauty | **C** |
| Future WebGPU | **B** (not launch) |

Interact in A; optional “View in HD” → Path C frame. Keep interactive default on Path A (canon).

---

## 6. Tech stack

**Core (repo):** three, R3F, drei, postprocessing, n8ao, gpu-pathtracer  

**Landing adds:** lenis, gsap + ScrollTrigger (P2+), maath, react-router-dom  

**Assets:** glTF + Draco/Meshopt, KTX2, shared `studio.hdr`

---

## 7–9. Assets, performance, a11y

See full checklists in the original build spec (asset pipeline, mobile art pass, `prefers-reduced-motion`, DOM copy, no-WebGL fallback). Treat performance and reduced-motion as first-class.

---

## 10. Build phases

| Phase | Scope |
|---|---|
| **P1** | Routes, palette, loader, hero trio, AgX/HDRI, Lenis stub — **current** |
| P2 | 7-act scroll spine + print-reveal system |
| P3 | Strava · lithophane · zellij product scenes |
| P4 | Gallery, process, live counter |
| P5 | Order flow + footer |
| P6 | Post polish, grain, micro-interactions |
| P7 | Perf / mobile / reduced-motion |

Validate 3D against Blender / Path C refs in `public/references/`.

---

## 11. Target repo layout

```
src/landing/          # page acts + scroll helpers
src/lab/              # look-dev sandbox (former App)
src/config/palette.ts
docs/playbooks/landing-page.md   # this file
```

---

## TL;DR

One idea — **materialization** — turns a multi-product catalog into a scroll film. Dark canvas, zellij DNA, Majorelle + saffron, **Made to hold.** Interact on Path A; glamour on Path C. Ship P1 foundation first, then expand act by act.
