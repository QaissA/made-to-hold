# Project architecture & potential

Stakeholder / product overview of this repository. For feature-level render parity with Blender Eevee Next, see the canon doc [`eevee-parity.md`](eevee-parity.md).

---

## What this project is

A **React Three Fiber (R3F)** web app that aims to reproduce a **Blender Eevee Next–class look** in the browser: same philosophy as Eevee (rasterization + screen-space effects + correct color), not a full offline path tracer for everyday interaction.

It is both:

1. A **working studio viewport** — AgX color, HDRI lighting, shadows, AO, reflections, glass, post (bloom / DOF / SMAA), optional GPU pathtrace stills, and a DamagedHelmet A/B subject.
2. A **documented stack and playbook** — architecture, gaps, and agent rules so the same look can be reused in product UIs without reinventing the render pipeline each time.

---

## Architecture at a glance

### Three render paths

| Path | Role | Default? |
|---|---|---|
| **A — WebGL2 + screen-space** | Interactive viewport: AgX, Environment (HDRI), studio lights, N8AO, reflector/transmission, EffectComposer post | **Yes** |
| **B — WebGPU + TSL** | Forward migration path (documented; not the interactive default) | No |
| **C — GPU pathtracer** | Progressive hero / still quality via `@react-three/gpu-pathtracer` | Opt-in toggle |

Path A is non-negotiable for realtime browsing. Path C is for final-looking frames when samples can accumulate. Path B is optional future work.

### Runtime shape

```
App (UI state)
 └─ Scene (R3F Canvas)
      ├─ Tone mapping / color space (AgX + sRGB)
      ├─ Lighting (HDRI Environment + key/fill/rim/area)
      ├─ Subject (mid-gray | glass | DamagedHelmet glTF)
      ├─ Ground (reflector or plain + optional contact shadows)
      ├─ PostFX (N8AO → Bloom → DOF → SMAA → ToneMapping)
      └─ PathtraceShell (when Hero pathtrace is on)
```

UI panels own toggles (tone map, lights/effects, subject, pathtrace). Config lives under `src/config/` (color, light units, subject). Assets under `public/` (`hdri/`, `models/`, `references/`).

### Source map

| Area | Responsibility |
|---|---|
| `src/canvas/` | Scene graph: lights, subjects, floor, post |
| `src/render/` | Path C shell around the scene |
| `src/ui/` | Overlay controls |
| `src/config/` | Tunable constants (exposure, intensities, flags) |
| `docs/architecture/` | Canon parity + this overview |
| `docs/playbooks/` | How-to for color, lights, GI, post, Path B/C |
| `docs/reference/` | Gaps, A/B checklist |
| `.cursor/rules/` | Agent constraints aligned with Path A |

### What “parity” means here

- **Match:** AgX / Neutral view transforms, PBR materials (glTF), IBL, soft shadows, AO, bloom/DOF/AA, studio light rigs.
- **Approximate:** Area-light *look* (LTC) with a shadow proxy; transmission/reflector via screen-space techniques.
- **Do not claim:** True SSS, native RectAreaLight shadows, or path tracing as the always-on interactive default. See [`known-gaps.md`](../reference/known-gaps.md).

---

## What is already usable

- Interactive Path A studio with on-screen A/B for lights, AO, bloom, DOF, SMAA, reflector floor.
- Subject switch: mid-gray reference, glass, Khronos DamagedHelmet (textured glTF).
- Same studio HDRI for Blender side-by-side (`public/hdri/studio.hdr`).
- Optional Path C hero pathtrace with sample count / reset.
- Docs and Cursor rules so agents stay on Path A + AgX unless asked otherwise.

**Note:** HDRI drives lighting and reflections by default; the canvas backdrop is a dark solid, not a visible sky dome. Helmet textures appear when **Helmet** is selected.

---

## Potential uses

### 1. Product & commerce 3D on the web

Embed configurators, hero product shots, and material variants with an Eevee-like look—without shipping a desktop renderer. Path A for browse/interact; Path C for campaign stills or “HD capture” buttons.

### 2. Design ↔ engineering bridge

Keep Blender as the authoring ground truth (Principled BSDF → glTF + shared HDRI + AgX). Use this app as the **web acceptance viewport**: same color intent, same lights philosophy, documented gaps so stakeholders know what will and won’t match.

### 3. Internal look-dev / lighting sandbox

Tune intensities, AO, bloom, and exposure against mid-gray and DamagedHelmet before locking values into a production app. The control panels are intentionally explicit for that workflow.

### 4. Marketing & presentation stills

Path C progressive path tracing for high-quality frames of a glTF scene under the same studio HDRI—useful when realtime Path A is “close” but a hero frame needs quieter noise and richer light transport.

### 5. Template for future R3F products

Copy the stack (color foundation → lights → AO/post → optional pathtracer) into new apps instead of assembling tone mapping, Environment, and EffectComposer ad hoc. Playbooks encode the order of operations that usually break “looks wrong vs Blender.”

### 6. Education & demos

Teach real-time PBR, AgX, IBL, and the difference between raster+screen-space vs path tracing with a single runnable repo and honest gap list.

### 7. Extensibility runway

| Direction | Fit |
|---|---|
| Custom product glTF library | Drop-in subjects next to DamagedHelmet |
| Scene navigation / AR / multi-object scenes | Build on Path A canvas + existing lighting |
| SSGI / TRAA (`realism-effects`) | Documented Path A upgrade when pinning versions |
| WebGPU materials / nodes | Path B playbook when browser support is a requirement |
| Baked lightmaps for interiors | Static archviz where IBL alone is not enough |

---

## What this project is not (yet)

- A full Blender replacement or Cycles clone in the browser.
- A multi-scene CMS or ecommerce platform (it is the **render foundation** those products can sit on).
- A claim of pixel-identical Eevee for every material (SSS, area shadows, off-screen multi-bounce GI remain limited—see gaps).

---

## Where to go next

| Need | Open |
|---|---|
| Deep Eevee ↔ Three mapping | [`eevee-parity.md`](eevee-parity.md) |
| “Colors look wrong” | [`../playbooks/color-foundation.md`](../playbooks/color-foundation.md) |
| Blender A/B process | [`../reference/parity-checklist.md`](../reference/parity-checklist.md) |
| Honest limitations | [`../reference/known-gaps.md`](../reference/known-gaps.md) |
| Run the app | Root [`README.md`](../../README.md) → `npm run dev` |
