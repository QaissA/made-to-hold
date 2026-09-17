# Made to Hold — P1 design

Date: 2026-09-17  
Full creative/technical spec: [`docs/playbooks/landing-page.md`](../playbooks/landing-page.md)

## Locked decisions

| Decision | Choice |
|---|---|
| Tagline | **Made to hold.** |
| Routing | `/` landing · `/lab` existing look-dev sandbox |
| Hero object | Procedural **rotating trio** (lithophane slab · zellij star · Strava ribbon) |
| First slice | **P1 only** (loader + hero foundation + Lenis stub) |
| Assets | Generate approximate geometry/materials in code |
| Architecture | Landing shell + shared render kit (Approach A) |

## Goal (P1)

Ship a branded landing entry that preloads Path A (AgX + `studio.hdr`), shows a designed overture loader, then a materializing hero trio with tagline — without removing the `/lab` sandbox.

## Shell

- React Router: `/` → `LandingPage`, `/lab` → current App (as `LabApp`)
- Brand canvas `#0E0D0F`; tokens in `src/config/palette.ts`
- Fonts P1: Clash Display + Space Grotesk + Space Mono (loader). Arabic deferred.
- Shared: `src/canvas/*`, `src/config/color.ts`, lighting/HDRI — imported by landing + lab

## Loader & hero

- Overture: DOM/SVG zellij tessellation + `useProgress` % → “Ready to hold.”
- Path A Canvas: AgX, studio HDRI, N8AO, soft shadows, light bloom; dark backdrop
- Trio turntable + damped orbit drag; print-sweep (clip/band) bottom→top on load
- DOM: oversized *Made to hold.* + scroll cue
- Lenis installed; one stub scroll-linked camera nudge only

## Out of P1

Path C HD stills, GSAP ScrollTrigger 7-act spine, real product scenes, order flow, Arabic type, live counter.

## Done when

- `/` loader → printed trio + tagline; `/lab` unchanged behavior
- AgX + studio HDRI; orbit works; `npm run build` green
