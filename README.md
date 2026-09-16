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

## Status

Documentation and Cursor rules first. Application scaffold comes later.
