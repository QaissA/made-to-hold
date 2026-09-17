# 3D Project — Eevee-Parity R3F Renderer

Match **Blender Eevee Next** look in **React Three Fiber** via rasterization + screen-space effects (not path tracing by default).

## Default architecture

**Path A** — WebGL2 + AgX + drei Environment + N8AO + realism-effects (SSGI/SSR/TRAA) + `@react-three/postprocessing`.

Optional:

- **Path B** — WebGPU + TSL (migration; not default)
- **Path C** — `three-gpu-pathtracer` hero stills

## Docs

| Doc | Use when |
|---|---|
| [Architecture (canon)](docs/architecture/eevee-parity.md) | Full parity map, gaps, phases |
| [Color foundation](docs/playbooks/color-foundation.md) | First setup / “looks wrong vs Blender” |
| [Lighting & shadows](docs/playbooks/lighting-shadows.md) | Lights, area-light proxies, shadow quality |
| [GI & AO](docs/playbooks/gi-ao.md) | IBL / SSGI / lightmaps |
| [Post & AA](docs/playbooks/post-aa.md) | EffectComposer pass order |
| [Path B WebGPU](docs/playbooks/path-b-webgpu.md) | Migrating off WebGL2 |
| [Path C pathtracer](docs/playbooks/path-c-pathtracer.md) | Hero / final-quality stills |
| [Parity checklist](docs/reference/parity-checklist.md) | Side-by-side A/B validation |
| [Known gaps](docs/reference/known-gaps.md) | Honest limitations + mitigations |

Agents: start at [`AGENTS.md`](AGENTS.md).

## Phase 1 — Color foundation

```bash
npm install
npm run dev
```

- Default view transform: **AgX** (Blender 4.x default)
- Use the on-screen control to compare AgX / None / Neutral
- Sample HDRI: `public/hdri/studio.hdr` (see ATTRIBUTION.md)
- Checklist: `docs/playbooks/color-foundation.md`

## Phase 2 — Lighting & shadows

- Studio rig: key (shadowed) + fill + rim + RectAreaLight with Spot shadow proxy
- Right-side toggles A/B each light and ContactShadows
- Intensities: `src/config/lightUnits.ts` (hand-tuned, not Watts)
- Playbook: `docs/playbooks/lighting-shadows.md`

## Phase 3 — GI & AO

- Strategy: **IBL + N8AO** (SSGI not yet)
- Toggle **N8AO** in the light panel to A/B ambient occlusion
- When N8AO is on, the composer applies the view transform (`ToneMapping`); when off, AgX stays on the renderer
- Playbook: `docs/playbooks/gi-ao.md`

## Phase 4 — Reflections & transmission

- Reflective floor: drei `MeshReflectorMaterial` (toggle **Reflector floor**)
- Glass: drei `MeshTransmissionMaterial` via subject picker (**Glass**)
- ContactShadows disabled while reflector is on
- SSR deferred; production glass will prefer Physical/glTF later
- Playbook: `docs/playbooks/post-aa.md` (reflections/transmission)

## Phase 5 — Post & AA

- Toggleable **Bloom**, **DOF**, **SMAA** (+ existing **N8AO**) in the light panel
- Pass order: N8AO → Bloom → DOF → SMAA → ToneMapping (AgX/None/Neutral)
- Composer mounts only when any post pass is on; all off restores AgX on `gl`
- Defaults: bloom + SMAA + N8AO on; DOF off
- No TRAA / realism-effects in this phase
- Playbook: `docs/playbooks/post-aa.md`

## Phase 6 — Hero pathtracer (Path C)

- Toggle **Hero pathtrace** (default off) — progressive GPU path tracing via `@react-three/gpu-pathtracer`
- Interactive default remains Path A (raster + post)
- PostFX disabled while pathtracing; `gl` tone mapping set to None so the pathtracer owns output
- Transmission / reflector fall back to opaque sphere + plain ground for tracer stability
- Helmet subject stays available under pathtrace; Glass falls back to mid-gray
- Samples counter + **Reset** while pathtracing; playbook: `docs/playbooks/path-c-pathtracer.md`

## DamagedHelmet A/B (subject picker)

- Default subject: **Helmet** (`DamagedHelmet.glb` from Khronos glTF-Sample-Models)
- Model path: `public/models/DamagedHelmet.glb` — see `public/models/ATTRIBUTION.md`
- Subject picker (bottom-right): **Mid-gray** | **Glass** | **Helmet**
- Studio HDRI unchanged: `public/hdri/studio.hdr` (same file for Blender A/B)
- Use **AgX** + matching exposure in Blender 4.x for view-transform parity
- Drop Eevee PNG screenshots into `public/references/` (see that folder’s README)
- Checklist: [`docs/reference/parity-checklist.md`](docs/reference/parity-checklist.md)

## Status

Phase 1–6 + DamagedHelmet A/B scaffolded — run `npm run dev` to compare AgX / None / Neutral, toggle studio lights / ContactShadows / N8AO / Bloom / DOF / SMAA, A/B reflector floor, cycle Mid-gray / Glass / Helmet, and opt into **Hero pathtrace** for progressive stills against the sample HDRI.
