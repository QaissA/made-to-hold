# Eevee-Parity Docs & Cursor Rules Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the approved documentation tree, root `AGENTS.md` / `README.md`, and layered Cursor rules that encode Blender Eevee Next → React Three Fiber parity standards.

**Architecture:** Mirror tree — `AGENTS.md` routes agents; `docs/architecture/` holds the full canon; `docs/playbooks/` and `docs/reference/` are short day-to-day guides; `.cursor/rules/` encodes non-negotiables (always-on stack + file-scoped canvas/lighting/materials/post/pathtracer/webgpu). No application code in this plan.

**Tech Stack:** Markdown docs; Cursor `.mdc` rules; content derived from the approved design (`docs/plans/2026-09-16-eevee-parity-docs-rules-design.md`) and the architecture document provided in the project kickoff.

---

### Task 1: Directory scaffold

**Files:**
- Create: `docs/architecture/.gitkeep` (or ensure dirs exist via first real files)
- Create: `docs/playbooks/` (via files in later tasks)
- Create: `docs/reference/`
- Create: `.cursor/rules/`

**Step 1: Create directories**

```powershell
New-Item -ItemType Directory -Force -Path `
  "docs\architecture", `
  "docs\playbooks", `
  "docs\reference", `
  ".cursor\rules" | Out-Null
```

**Step 2: Verify**

```powershell
Get-ChildItem -Recurse docs, .cursor | Select-Object FullName
```

Expected: empty `architecture`, `playbooks`, `reference`, `rules` directories exist (plus existing `docs\plans`).

**Step 3: Commit** (after `git init` if repo does not exist yet)

```powershell
git init   # only if not already a repo
git add docs/plans/2026-09-16-eevee-parity-docs-rules-design.md
git commit -m "docs: add approved design for Eevee-parity docs and rules"
```

If the user has not asked to init/commit, skip commit and continue; note deferral.

---

### Task 2: Canon architecture document

**Files:**
- Create: `docs/architecture/eevee-parity.md`

**Step 1: Write the file**

Paste the kickoff architecture document (Version 1.0) into `docs/architecture/eevee-parity.md` with this front matter prepended:

```markdown
# Achieving Blender Eevee-Quality Rendering in React Three Fiber

**A technical architecture and methods document**  
Version 1.0 · Target: Eevee Next (Blender 4.2 LTS+) parity in a real-time web renderer  
**Status:** Canon — if playbooks or rules disagree, update them or update this file intentionally.

---
```

Then include the full body from the user kickoff (sections 1–10: executive summary through bottom line), unchanged in substance. Light edits allowed only for markdown consistency (heading levels, table formatting).

**Step 2: Verify**

- File exists and contains sections for color management, materials, GI, shadows, gaps, Paths A/B/C, stack, structure, phases.
- Word “AgX” and `THREE.AgXToneMapping` appear.

**Step 3: Commit**

```bash
git add docs/architecture/eevee-parity.md
git commit -m "docs: add Eevee Next parity architecture canon"
```

---

### Task 3: README (human entry)

**Files:**
- Create: `README.md`

**Step 1: Write `README.md`**

```markdown
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

## Status

Documentation and Cursor rules first. Application scaffold comes later.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README linking Eevee-parity guides"
```

---

### Task 4: AGENTS.md (agent entry)

**Files:**
- Create: `AGENTS.md`

**Step 1: Write `AGENTS.md`**

```markdown
# Agent guide — Eevee-parity R3F

## Non-negotiables

1. **Path A is default** (WebGL2 raster + screen-space). Do not switch the interactive viewport to Path B or C unless the user asks.
2. **Color foundation first** — `THREE.AgXToneMapping`, `outputColorSpace = SRGBColorSpace`, correct texture `colorSpace`. See `docs/playbooks/color-foundation.md`.
3. **Canon** — `docs/architecture/eevee-parity.md` wins on conflicts. Update playbooks/rules to match; do not silently diverge.
4. **Rules** — follow `.cursor/rules/` when editing matching files. Always-on: `project-render-stack.mdc`.

## What to open

| Task | Open |
|---|---|
| Any render/look work | `docs/playbooks/color-foundation.md` first |
| Canvas / renderer config | `docs/playbooks/color-foundation.md` + rule `canvas-scene.mdc` |
| Lights / shadows | `docs/playbooks/lighting-shadows.md` + `lighting.mdc` |
| Materials / glTF | `docs/playbooks/color-foundation.md` (textures) + `materials.mdc` |
| GI / AO | `docs/playbooks/gi-ao.md` |
| Post / bloom / DOF / AA | `docs/playbooks/post-aa.md` + `postfx.mdc` |
| WebGPU / TSL | `docs/playbooks/path-b-webgpu.md` + `webgpu-tsl.mdc` |
| Pathtracer / hero still | `docs/playbooks/path-c-pathtracer.md` + `pathtracer.mdc` |
| Stakeholder honesty | `docs/reference/known-gaps.md` |
| A/B vs Blender | `docs/reference/parity-checklist.md` |

## Out of scope unless asked

- Inventing a different tone mapper than AgX for “Blender default” matches
- Claiming true SSS or RectAreaLight shadows exist in Three.js
- Making path tracing the realtime default
```

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add AGENTS.md routing for Eevee-parity work"
```

---

### Task 5: Playbook — color foundation

**Files:**
- Create: `docs/playbooks/color-foundation.md`

**Step 1: Write the playbook**

```markdown
# Playbook: Color foundation (Phase 1)

**Goal:** Neutral/gray scenes match Blender Eevee (AgX) before any fancy GI.

**Canon:** `docs/architecture/eevee-parity.md` §3.1, §4

## Checklist

- [ ] `renderer.toneMapping = THREE.AgXToneMapping` (Blender 4.x default)
- [ ] `renderer.outputColorSpace = THREE.SRGBColorSpace`
- [ ] `renderer.toneMappingExposure` matched to Blender exposure / world strength
- [ ] Color textures (baseColor, emissive): `texture.colorSpace = SRGBColorSpace`
- [ ] Data textures (normal, roughness, metalness, AO): linear (`NoColorSpace`)
- [ ] Same HDRI file as Blender; same rotation
- [ ] No double gamma in post (single OutputPass / composer encoding)
- [ ] A/B one glTF + gray reference against Eevee screenshot — **stop until this matches**

## Canvas baseline

```jsx
<Canvas
  gl={{
    toneMapping: THREE.AgXToneMapping,
    toneMappingExposure: 1.0,
    outputColorSpace: THREE.SRGBColorSpace,
    antialias: true,
  }}
  shadows="soft"
  dpr={[1, 2]}
>
```

## Failures that look like “wrong engine”

| Symptom | Likely cause |
|---|---|
| Washed / crunchy contrast vs Blender | Tone mapping mismatch (not AgX) |
| Flat / desaturated albedo | Color texture marked linear |
| Crushed normals / weird roughness | Data texture marked sRGB |
| Shadows pure black | Env intensity / missing fill (see GI playbook) |
```

**Step 2: Commit**

```bash
git add docs/playbooks/color-foundation.md
git commit -m "docs: add color foundation playbook"
```

---

### Task 6: Playbook — lighting & shadows

**Files:**
- Create: `docs/playbooks/lighting-shadows.md`

**Step 1: Write**

```markdown
# Playbook: Lighting & shadows (Phase 2)

**Canon:** architecture §3.3, §3.6, §3.7, Gap 1

## Lights

| Blender | Three.js | Notes |
|---|---|---|
| Point / Sun / Spot | `PointLight` / `DirectionalLight` / `SpotLight` | OK |
| Area (rect/disc) | `RectAreaLight` | Shading OK; **no shadows** |
| World | `<Environment files="…" />` | Same HDRI as Blender |

Intensity: Blender Watts ≠ Three units — hand-tune or document conversion in `src/config/lightUnits.ts` when scaffolded.

## Area-light shadow mitigations (required when using RectAreaLight)

1. Hidden `SpotLight` or `DirectionalLight` at area center for shadow only, **or**
2. `<AccumulativeShadows>` for static camera, **or**
3. Baked lightmap shadows

## Shadow quality

- Prefer `PCFSoftShadowMap` / soft shadows; consider `VSMShadowMap`
- `shadow.mapSize` 2048–4096 for hero lights
- Tune `bias` / `normalBias` to kill acne without peter-panning
- Ground contact: `<ContactShadows />` when appropriate
- Static beauty: `<AccumulativeShadows />` / `<SoftShadows />` (PCSS)

## Checklist

- [ ] Light rig mirrors Blender key/fill/rim
- [ ] Shared HDRI via `<Environment />`
- [ ] Every RectAreaLight has a documented shadow strategy
- [ ] mapSize / bias tuned; no obvious acne
```

**Step 2: Commit**

```bash
git add docs/playbooks/lighting-shadows.md
git commit -m "docs: add lighting and shadows playbook"
```

---

### Task 7: Playbook — GI & AO

**Files:**
- Create: `docs/playbooks/gi-ao.md`

**Step 1: Write**

```markdown
# Playbook: GI & ambient occlusion (Phase 3)

**Canon:** architecture §3.4, §3.5, Gap 2

## Decision tree

1. **IBL only** — `<Environment />` — start here (product/studio often enough)
2. **SSGI** — `realism-effects` `SSGIEffect` — dynamic scenes; **pin package version**
3. **Baked lightmaps** — Blender bake → second UV + `lightMap`/`aoMap` — static interiors

Combine: Environment (probe fallback) + SSGI + bake when off-screen bounce matters.

## AO

- Prefer **N8AO** over built-in SSAO
- Baked AO via `aoMap` when static

## Checklist

- [ ] Chose IBL / SSGI / bake deliberately; documented in PR or scene comment
- [ ] `realism-effects` version pinned if SSGI/SSR/TRAA used
- [ ] N8AO added before judging “flat” lighting
- [ ] A/B with Eevee GI on/off for the test scene
```

**Step 2: Commit**

```bash
git add docs/playbooks/gi-ao.md
git commit -m "docs: add GI and AO playbook"
```

---

### Task 8: Playbook — post & AA

**Files:**
- Create: `docs/playbooks/post-aa.md`

**Step 1: Write**

```markdown
# Playbook: Post-processing & AA (Phases 4–5)

**Canon:** architecture §3.8, §3.9

## Recommended pass order

1. N8AO  
2. SSGI / SSR (`realism-effects`)  
3. Bloom  
4. Depth of Field  
5. TRAA / temporal AA (or SMAA)

Use `@react-three/postprocessing` EffectComposer. **One** output/encoding path — no double tone-map.

## Reflections / transmission

- IBL specular from Environment  
- SSR for screen-space layer  
- Floors: `<MeshReflectorMaterial>`  
- Glass: `MeshPhysicalMaterial.transmission` or drei `MeshTransmissionMaterial`

## Checklist

- [ ] Pass order matches above unless measured reason to change
- [ ] Bloom/DOF tuned against Eevee glare/DoF reference
- [ ] Temporal stability acceptable (TRAA or equivalent)
```

**Step 2: Commit**

```bash
git add docs/playbooks/post-aa.md
git commit -m "docs: add post-processing playbook"
```

---

### Task 9: Playbooks — Path B & Path C

**Files:**
- Create: `docs/playbooks/path-b-webgpu.md`
- Create: `docs/playbooks/path-c-pathtracer.md`

**Step 1: Write Path B**

```markdown
# Playbook: Path B — WebGPU + TSL

**Not the default.** Use when the user opts into WebGPU headroom (physical light units, compute, TSL GI nodes).

**Canon:** architecture §6 Path B

## When

- New greenfield comfort with newer APIs
- Need physically based light units / compute
- Effect ports available for your needs

## How (R3F)

- `Canvas` `gl` factory returning `WebGPURenderer`
- Prefer TSL nodes over one-off GLSL when extending materials
- Keep AgX / color-space rules identical to Path A
- Plan fallback: WebGPU → WebGL2 where required

## Do not

- Silently make WebGPU the project default without user approval
- Assume all `realism-effects` / postprocessing paths work unchanged — verify
```

**Step 2: Write Path C**

```markdown
# Playbook: Path C — GPU pathtracer (hero stills)

**Not realtime default.** Progressive path tracing for hero / “final quality” stills; can exceed Eevee (closer to Cycles).

**Canon:** architecture §6 Path C  
**Lib:** `three-gpu-pathtracer`

## When

- User requests hero render / still export
- Same Three.js scene graph as Path A viewport

## How

- Keep interactive viewport on Path A
- Toggle or route `src/render/PathtraceMode` for progressive accumulate
- Share materials/lights/HDRI; expect longer converge time

## Do not

- Replace the interactive canvas with path tracing by default
- Promise realtime path-traced complex scenes
```

**Step 3: Commit**

```bash
git add docs/playbooks/path-b-webgpu.md docs/playbooks/path-c-pathtracer.md
git commit -m "docs: add Path B and Path C playbooks"
```

---

### Task 10: Reference — gaps & parity checklist

**Files:**
- Create: `docs/reference/known-gaps.md`
- Create: `docs/reference/parity-checklist.md`

**Step 1: Write gaps**

```markdown
# Known gaps & mitigations

**Canon:** architecture §5

| Gap | Severity | Mitigation |
|---|---|---|
| RectAreaLight casts no shadows | 🔴 | Shadow proxy light, AccumulativeShadows, or bake |
| Off-screen multi-bounce GI | 🟡 | Environment + SSGI + lightmaps; or Path C for stills |
| No true SSS | 🔴 | Thickness/attenuation fake; custom shader; bake for hero organics |
| No Watt units (WebGL) | 🟡 | Conversion table; or Path B physical units |

None block high-fidelity results if mitigations are applied deliberately.
```

**Step 2: Write parity checklist**

```markdown
# Parity checklist (A/B vs Eevee)

Use the **same** camera, HDRI, exposure, and glTF for both sides. Keep a reference Eevee screenshot in-repo per test scene when assets exist.

## Phase gates

- [ ] **P1 Color** — AgX both sides; texture colorSpaces correct; gray/neutral match
- [ ] **P2 Lights/shadows** — rig match; area-light shadow strategy; mapSize/bias OK
- [ ] **P3 GI/AO** — strategy chosen; N8AO; bounce believable vs Eevee
- [ ] **P4 Reflections/transmission** — SSR/planar/glass acceptable
- [ ] **P5 Post/AA** — bloom/DOF/AA stable
- [ ] **P6 Hero (optional)** — Path C still if needed

## Quick “why off” order

1. Tone mapping / exposure  
2. Texture colorSpace  
3. HDRI identity + rotation  
4. Light intensities  
5. Shadow resolution/bias  
6. Missing GI/AO vs Eevee GI on  
```

**Step 3: Commit**

```bash
git add docs/reference/known-gaps.md docs/reference/parity-checklist.md
git commit -m "docs: add known gaps and parity checklist"
```

---

### Task 11: Always-on Cursor rule

**Files:**
- Create: `.cursor/rules/project-render-stack.mdc`

**Step 1: Write**

```markdown
---
description: Default Eevee-parity render stack (Path A) and color non-negotiables
alwaysApply: true
---

# Project render stack

- Default interactive path: **Path A** (WebGL2 + screen-space). Not Path B/C unless the user asks.
- Color: `AgXToneMapping` + `SRGBColorSpace` output. Match Blender 4.x AgX.
- Textures: albedo/emissive sRGB; normal/rough/metal/AO linear.
- Before changing look: read `AGENTS.md` and `docs/playbooks/color-foundation.md`.
- Pin `realism-effects` if used. Prefer N8AO over default SSAO.
- Do not claim true SSS or RectAreaLight shadows exist — see `docs/reference/known-gaps.md`.
- Canon: `docs/architecture/eevee-parity.md`.
```

**Step 2: Commit**

```bash
git add .cursor/rules/project-render-stack.mdc
git commit -m "chore: add always-on Path A render stack rule"
```

---

### Task 12: File-scoped Cursor rules (canvas, lighting, materials)

**Files:**
- Create: `.cursor/rules/canvas-scene.mdc`
- Create: `.cursor/rules/lighting.mdc`
- Create: `.cursor/rules/materials.mdc`

**Step 1: `canvas-scene.mdc`**

```markdown
---
description: Canvas / renderer config for Eevee-parity color and shadows
globs: src/canvas/**
alwaysApply: false
---

# Canvas scene

```js
// ✅
gl={{
  toneMapping: THREE.AgXToneMapping,
  toneMappingExposure: 1.0,
  outputColorSpace: THREE.SRGBColorSpace,
}}
shadows="soft" // or explicit soft/VSM setup
dpr={[1, 2]}

// ❌ NoToneMapping / ACES when matching Blender AgX default
// ❌ Double tone-map in post + renderer
```

Playbook: `docs/playbooks/color-foundation.md`
```

**Step 2: `lighting.mdc`**

```markdown
---
description: IBL, lights, and area-light shadow mitigations
globs: src/canvas/Lighting*,src/**/light*
alwaysApply: false
---

# Lighting

- Same HDRI as Blender via `<Environment />`.
- `RectAreaLight`: add shadow proxy, AccumulativeShadows, or bake — never assume native shadows.
- Hero shadows: mapSize 2048–4096; tune bias/normalBias.
- ContactShadows / SoftShadows / AccumulativeShadows per playbook.

Playbook: `docs/playbooks/lighting-shadows.md`
```

**Step 3: `materials.mdc`**

```markdown
---
description: Principled/glTF materials and texture color spaces
globs: src/materials/**,**/*Material*
alwaysApply: false
---

# Materials

- Principled → `MeshStandardMaterial` / extras → `MeshPhysicalMaterial`.
- Prefer glTF + `KHR_materials_*` via `useGLTF`.
- Color maps: `SRGBColorSpace`. Data maps: linear.
- Transmission: Physical or `MeshTransmissionMaterial` (screen-space).
- No true SSS — thickness/attenuation or custom only; say so.

Playbook: `docs/playbooks/color-foundation.md` · Gaps: `docs/reference/known-gaps.md`
```

**Step 4: Commit**

```bash
git add .cursor/rules/canvas-scene.mdc .cursor/rules/lighting.mdc .cursor/rules/materials.mdc
git commit -m "chore: add canvas, lighting, and materials Cursor rules"
```

---

### Task 13: File-scoped Cursor rules (post, pathtracer, webgpu)

**Files:**
- Create: `.cursor/rules/postfx.mdc`
- Create: `.cursor/rules/pathtracer.mdc`
- Create: `.cursor/rules/webgpu-tsl.mdc`

**Step 1: `postfx.mdc`**

```markdown
---
description: EffectComposer pass order and encoding
globs: src/canvas/PostFX*,src/**/post*
alwaysApply: false
---

# Post-FX

Order: N8AO → SSGI/SSR → Bloom → DOF → TRAA/SMAA.  
Single output encoding — do not tone-map twice.  
Pin `realism-effects` when used.

Playbook: `docs/playbooks/post-aa.md`
```

**Step 2: `pathtracer.mdc`**

```markdown
---
description: Path C hero pathtracer — not interactive default
globs: src/render/**
alwaysApply: false
---

# Pathtracer (Path C)

- Progressive hero/stills only (`three-gpu-pathtracer`).
- Share Path A scene graph; do not replace realtime default.
- Playbook: `docs/playbooks/path-c-pathtracer.md`
```

**Step 3: `webgpu-tsl.mdc`**

```markdown
---
description: Path B WebGPU/TSL migration conventions
globs: src/**/*webgpu*,src/**/*tsl*
alwaysApply: false
---

# WebGPU / TSL (Path B)

- Only when user opted into Path B.
- Keep AgX + color-space rules identical to Path A.
- Prefer TSL for new shader work; verify effect library support.
- Playbook: `docs/playbooks/path-b-webgpu.md`
```

**Step 4: Commit**

```bash
git add .cursor/rules/postfx.mdc .cursor/rules/pathtracer.mdc .cursor/rules/webgpu-tsl.mdc
git commit -m "chore: add postfx, pathtracer, and webgpu Cursor rules"
```

---

### Task 14: Final verification

**Step 1: List all expected files**

```powershell
@(
  "README.md",
  "AGENTS.md",
  "docs/architecture/eevee-parity.md",
  "docs/playbooks/color-foundation.md",
  "docs/playbooks/lighting-shadows.md",
  "docs/playbooks/gi-ao.md",
  "docs/playbooks/post-aa.md",
  "docs/playbooks/path-b-webgpu.md",
  "docs/playbooks/path-c-pathtracer.md",
  "docs/reference/known-gaps.md",
  "docs/reference/parity-checklist.md",
  ".cursor/rules/project-render-stack.mdc",
  ".cursor/rules/canvas-scene.mdc",
  ".cursor/rules/lighting.mdc",
  ".cursor/rules/materials.mdc",
  ".cursor/rules/postfx.mdc",
  ".cursor/rules/pathtracer.mdc",
  ".cursor/rules/webgpu-tsl.mdc"
) | ForEach-Object { if (-not (Test-Path $_)) { "MISSING $_" } else { "OK $_" } }
```

Expected: all `OK`.

**Step 2: Spot-check**

- `AGENTS.md` links match real paths.
- Always-on rule has `alwaysApply: true`.
- File-scoped rules have `globs` and `alwaysApply: false`.
- Architecture file includes Paths A/B/C and AgX.

**Step 3: Final commit** (if committing in batches earlier; else one commit for remaining)

```bash
git status
```

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-09-16-eevee-parity-docs-rules.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — fresh subagent per task, review between tasks  
2. **Parallel Session (separate)** — new session with executing-plans, batch with checkpoints  

**Which approach?**

Note: this repo is not a git repository yet. Say if you want `git init` before commits in the plan.
