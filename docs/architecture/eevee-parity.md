# Achieving Blender Eevee-Quality Rendering in React Three Fiber

**A technical architecture and methods document**  
Version 1.0 · Target: Eevee Next (Blender 4.2 LTS+) parity in a real-time web renderer  
**Status:** Canon — if playbooks or rules disagree, update them or update this file intentionally.

---

## 1. Executive summary

Matching Blender **Eevee Next** in React Three Fiber (R3F) is realistic and achievable to a high degree, because the two renderers share the same fundamental philosophy: **rasterization plus screen-space effects, not path tracing.** Eevee is not a physically exhaustive renderer — it's a real-time rasterizer that fakes global illumination with screen-space ray tracing, light probes, and baked caches. Three.js works the same way, so most of Eevee's look can be reconstructed rather than reinvented.

The single most important finding for this project: **Three.js ships the exact same tone-mapping / view transforms Blender uses** — AgX, ACES Filmic, and Khronos PBR Neutral. Blender's default view transform since 4.0 is **AgX**, and `THREE.AgXToneMapping` is the same operator. This means color response — historically the biggest reason web renders look "wrong" next to Blender — can be matched almost exactly by configuration alone.

Realistic expectation: with the stack in this document you can reach **90–95% visual parity** with an Eevee Next viewport render for most scenes (product shots, interiors, stylized scenes, motion graphics). The remaining gap comes from a few specific features where Three.js has no native equivalent (area-light shadows, true subsurface scattering, fully accurate multi-bounce GI). Each gap has a documented mitigation below.

---

## 2. What we are actually matching: Eevee Next's pipeline

Before mapping to Three.js, it's worth being precise about what Eevee Next (the rebuilt engine that became the default in Blender 4.2) actually does. It is **not** the old pre-4.2 Eevee.

| Eevee Next subsystem | What it does |
|---|---|
| **Rasterization core** | Determines visible surfaces per pixel, then shades — same as WebGL/WebGPU. Not a path tracer. |
| **Screen-space ray tracing (SSR-GI)** | Every BSDF gets screen-space traced indirect diffuse + specular. This is Eevee's "global illumination." |
| **Light probes** | Irradiance volumes (diffuse GI cache) + reflection spheres/planes. Used as the **fallback** when screen-space rays leave the screen. |
| **Fast GI approximation** | Cheaper screen-space bounce fallback for high-roughness surfaces. |
| **Virtual Shadow Maps (VSM)** | High-resolution (up to 4096), memory-efficient shadow maps with ray-traced soft penumbra. Replaced contact shadows. |
| **Area lights (LTC)** | Real rectangular/disc lights with physically plausible specular + soft shadows. |
| **Principled BSDF v2** | The shared shading model — matches Cycles closely out of the box. |
| **Volumetrics** | Froxel-based world + object volumes, now receiving indirect light. |
| **Post pipeline** | OpenColorIO color management → view transform (AgX default) → bloom/glare, depth of field, motion blur, temporal AA. |

**Key takeaway:** Eevee's realism comes from four pillars — (1) correct color management, (2) image-based + probe lighting, (3) screen-space GI/reflections, (4) good shadows and post. Three.js can reproduce all four.

---

## 3. Feature-by-feature parity map

### 3.1 Color management & view transform — ★ near-exact match

| Eevee | Three.js / R3F | Status |
|---|---|---|
| AgX view transform (default) | `renderer.toneMapping = THREE.AgXToneMapping` | ✅ Same operator |
| Filmic | approximate with AgX or custom LUT | 🟡 Close |
| Khronos PBR Neutral | `THREE.NeutralToneMapping` | ✅ Same operator |
| Standard / None | `THREE.NoToneMapping` | ✅ |
| Linear scene-referred workflow | `outputColorSpace = SRGBColorSpace`, textures tagged `SRGBColorSpace` for color / `NoColorSpace`(linear) for data (normal, roughness) | ✅ |
| Exposure | `renderer.toneMappingExposure` | ✅ |

This is the highest-leverage part of the whole project. Get this right first and everything else looks "in the right ballpark."

```js
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.AgXToneMapping     // match Blender 4.x default
renderer.toneMappingExposure = 1.0
// Color textures: texture.colorSpace = THREE.SRGBColorSpace
// Data textures (normal/roughness/metal/AO): leave linear (NoColorSpace)
```

### 3.2 Materials — ★ strong match

| Eevee | Three.js | Status |
|---|---|---|
| Principled BSDF (base color, metallic, roughness, normal) | `MeshStandardMaterial` | ✅ Same PBR model |
| Principled v2 extras: clearcoat, sheen, transmission, IOR, iridescence, specular tint | `MeshPhysicalMaterial` | ✅ Maps almost 1:1 |
| Raytraced transmission / glass | `MeshPhysicalMaterial.transmission` or drei `MeshTransmissionMaterial` | 🟡 Good; screen-space, like Eevee |
| Subsurface scattering | approximate via `MeshPhysicalMaterial` (thickness/attenuation) or fake with translucency | 🔴 No true SSS — see §5 |
| Emission | `emissive` + `emissiveIntensity` | ✅ |
| Displacement | `displacementMap` (vertex) or normal/bump | 🟡 Vertex only; no adaptive |

**Material export tip:** Author in Blender's Principled BSDF, export via **glTF** (the `KHR_materials_*` extensions cover transmission, clearcoat, sheen, IOR, volume, emissive strength). `useGLTF` from drei loads these into `MeshPhysicalMaterial` with the correct parameters, preserving most of the look automatically.

### 3.3 Environment / world lighting (IBL) — ★ strong match

Eevee's "world" lighting = image-based lighting. Three.js does this natively and well.

- drei `<Environment />` loads an HDRI as both the diffuse irradiance and the specular reflection source — this is the direct equivalent of Eevee's world lighting + reflection cubemaps.
- Local reflection probes (Eevee reflection spheres/planes) ≈ drei `<Environment />` with a `ground`/local setup, or a `CubeCamera` for dynamic local reflections.
- Use the **same HDRI file** in both Blender and R3F for a true apples-to-apples match.

```jsx
<Environment files="/studio.hdr" />           // world lighting + reflections
// or, per-object local probe:
<CubeCamera>{(texture) => <mesh material-envMap={texture} />}</CubeCamera>
```

### 3.4 Global illumination (indirect bounce) — 🟡 the hard part

This is where Eevee Next pulled ahead (screen-space GI on every BSDF). Options in R3F, in order of fidelity vs. effort:

1. **IBL only (baseline).** drei `<Environment />` alone gives you image-based ambient GI. For many product/studio scenes this is *most of the way there* because Eevee's GI is dominated by the world probe anyway.
2. **Screen-space GI** via `realism-effects` (`SSGIEffect`) — this is the closest architectural match to Eevee, since Eevee's GI *is* screen-space. Adds indirect diffuse + specular bounce. ⚠️ Note: `realism-effects` (by 0beqz) is powerful but lightly maintained; pin your versions and test.
3. **Baked lightmaps.** Bake GI in Blender (or a baker) to a lightmap texture, apply via a second UV + `aoMap`/`lightMap`. This is how you match Eevee's *baked* irradiance quality exactly, at the cost of static lighting. Best for architectural/interior stills.
4. **WebGPU + TSL GI node** (forward-looking). Three.js WebGPURenderer exposes a built-in GI node context in TSL. Emerging, node-based SSGI. See §6.

**Recommendation:** start with (1) IBL, add (2) SSGI for dynamic scenes or (3) baked lightmaps for static interiors.

### 3.5 Ambient occlusion — ★ good match

| Eevee | Three.js | Status |
|---|---|---|
| AO (now folded into GI) | **N8AO** (best quality, maintained) | ✅ Recommended |
| | `SSAO` from `@react-three/postprocessing` | 🟡 Older, cheaper |
| Baked AO | `aoMap` channel | ✅ |

`N8AO` is the standout here — significantly better looking than the built-in SSAO and actively maintained.

### 3.6 Shadows — 🟡 partial match, one real gap

| Eevee | Three.js | Status |
|---|---|---|
| Virtual Shadow Maps | `PCFSoftShadowMap` / `VSMShadowMap` | 🟡 Lower quality but fine |
| Ray-traced soft penumbra | drei `<SoftShadows />` (PCSS) or `<AccumulativeShadows />` | 🟡 PCSS approximates penumbra |
| Sun/directional shadows | `DirectionalLight.castShadow` | ✅ |
| Spot shadows | `SpotLight.castShadow` | ✅ |
| **Area-light shadows** | RectAreaLight has **no shadow support** | 🔴 Gap — see §5 |
| Contact shadows | drei `<ContactShadows />` | ✅ Cheap ground contact |

For static scenes, drei `<AccumulativeShadows>` produces gorgeous, soft, Eevee-grade shadows by accumulating many light samples over frames — arguably better than Eevee for a fixed camera.

### 3.7 Lights — ★ mostly match

| Eevee | Three.js | Status |
|---|---|---|
| Point / sun / spot | `PointLight` / `DirectionalLight` / `SpotLight` | ✅ |
| **Area light (rect/disc)** | `RectAreaLight` (LTC shading) | ✅ *shading* / 🔴 *no shadows* |
| Unlimited lights | Practical limit; batch or use WebGPU | 🟡 |
| Physical light units (Watts) | Three.js uses arbitrary intensity | 🟡 Needs conversion — see §4 |

### 3.8 Reflections — ★ good match

- IBL specular reflections from `<Environment />` — ✅ direct equivalent of Eevee reflection probes.
- Screen-space reflections (SSR) via `realism-effects` or postprocessing SSR — matches Eevee's screen-space reflection layer.
- Planar reflections (mirrors/floors) via drei `<MeshReflectorMaterial>` — ✅ great for reflective floors.

### 3.9 Post-processing — ★ strong match

All via `@react-three/postprocessing` (wraps the `pmndrs/postprocessing` library, which merges effect passes for performance):

| Eevee | Three.js | Status |
|---|---|---|
| Bloom / glare | `<Bloom />` | ✅ |
| Depth of field | `<DepthOfField />` (bokeh) | ✅ |
| Motion blur | `realism-effects` `MotionBlurEffect` | 🟡 |
| Temporal AA / supersampling | `realism-effects` `TRAAEffect`, or SMAA/TAA | 🟡 |
| Vignette, tone/exposure, LUT | `<Vignette />`, `<LUT />`, `<ToneMapping />` | ✅ |

---

## 4. Critical matching details (the "why it looks off" checklist)

1. **View transform mismatch.** If Blender is on AgX and Three.js is on `NoToneMapping` (or vice versa), nothing will ever match. Set both to the same operator. Blender 4.x default = AgX → `THREE.AgXToneMapping`.
2. **Color space of textures.** Base color / emissive = sRGB. Normal / roughness / metallic / AO = linear data. Mixing these up desaturates or crushes everything.
3. **Same HDRI, same rotation, same exposure.** Use the identical environment file and match Blender's world strength to `toneMappingExposure`.
4. **Light intensity units.** Blender uses physical Watts; Three.js uses arbitrary units. Expect to hand-tune, or adopt `WebGPURenderer`'s physically-based light units. Build a small conversion table for your scenes early.
5. **Linear workflow end-to-end.** Ensure `outputColorSpace = SRGBColorSpace` and that you're not double-applying gamma anywhere in the post chain (use a single `OutputPass` / the composer's built-in encoding).
6. **Shadow bias & map resolution.** Eevee's VSM is high-res; bump Three.js `shadow.mapSize` to 2048–4096 and tune `bias`/`normalBias` to avoid acne, or shadows will read as "gamey."
7. **Environment intensity vs. direct light balance.** Eevee's GI lifts shadows subtly; without SSGI/lightmaps, add a low `<Environment />` intensity or a soft fill so shadows aren't pure black.

---

## 5. Known gaps and their mitigations

### Gap 1 — Area-light shadows (🔴 no native support)
`RectAreaLight` shades beautifully (LTC) but casts no shadows in Three.js.
**Mitigations:** (a) place a hidden `SpotLight` or `DirectionalLight` at the area light's center to carry the shadow; (b) use `<AccumulativeShadows>` to bake soft area-light shadows for static scenes; (c) bake shadows into a lightmap.

### Gap 2 — True multi-bounce GI (🟡 screen-space only)
Both engines are screen-space, but Eevee's probe fallback catches off-screen bounce that pure R3F SSGI misses.
**Mitigations:** combine `<Environment />` IBL + SSGI + baked lightmaps; or for hero stills, render with `three-gpu-pathtracer` (see §6) which *exceeds* Eevee.

### Gap 3 — Subsurface scattering (🔴 no true SSS)
`MeshPhysicalMaterial` has no real SSS.
**Mitigations:** fake with thickness-based translucency + a custom TSL/GLSL shader; for skin/wax hero assets, pre-bake or use a dedicated SSS shader. Acceptable for most non-organic scenes.

### Gap 4 — Physical light units (🟡)
No Watt-based intensity in WebGL renderer.
**Mitigations:** build a conversion convention, or move to `WebGPURenderer` which supports physically-based units.

---

## 6. Three architectural paths

### Path A — WebGL2 rasterization + screen-space effects (recommended default)
The most direct philosophical match to Eevee. Mature, broad device support, works today.
**Stack:** `WebGLRenderer` + AgX tone mapping + drei `<Environment>` + N8AO + `realism-effects` (SSGI/SSR/TRAA) + `@react-three/postprocessing` (Bloom/DOF).
**Best for:** production sites, product configurators, most interactive work.

### Path B — WebGPU + TSL (forward-looking)
`WebGPURenderer` with TSL (Three Shader Language, compiles to both WGSL and GLSL). Native GI node context, faster complex post, physical light units, compute shaders. WebGPU now has ~95% browser coverage (Safari added support Sept 2025), with automatic WebGL2 fallback.
**Best for:** new projects that want headroom; teams comfortable adopting newer APIs. R3F supports it via the `gl` factory prop.
**Trade-off:** newer, smaller ecosystem of ready-made effects; some porting effort.

### Path C — GPU path tracer (offline / progressive fidelity)
`three-gpu-pathtracer` renders progressive, physically accurate global illumination, soft shadows, and refraction in-browser — **beyond Eevee, approaching Cycles.** Not realtime for complex scenes, but ideal for hero shots, "final quality" toggles, or non-interactive stills using the same Three.js scene graph.
**Best for:** a "high quality" render button on top of a Path A realtime viewport.

**Recommended combination:** Path A for the interactive experience, with an optional Path C "hero render" mode for stills. Migrate to Path B when the WebGPU effect ecosystem matures for your needs.

---

## 7. Recommended tech stack

```
Core
  three                          latest (WebGL2; WebGPU-ready)
  @react-three/fiber             R3F renderer
  @react-three/drei              Environment, SoftShadows, AccumulativeShadows,
                                 ContactShadows, MeshReflectorMaterial,
                                 MeshTransmissionMaterial, useGLTF, CubeCamera

Lighting / GI / AO
  @react-three/postprocessing    EffectComposer, Bloom, DepthOfField, Vignette, SMAA
  n8ao                           high-quality ambient occlusion
  realism-effects                SSGI, SSR, TRAA, MotionBlur (pin version)

Assets
  glTF (KHR_materials_*)         author in Blender Principled BSDF, export to glTF
  .hdr / .exr                    same environment map used in Blender

Optional
  three-gpu-pathtracer           "final quality" progressive renders
```

---

## 8. Suggested project structure

```
src/
  canvas/
    Scene.tsx              # <Canvas> config: tone mapping, color space, shadows
    Lighting.tsx          # Environment (IBL) + key/fill/rim, area-light + shadow proxy
    PostFX.tsx            # EffectComposer: N8AO → SSGI → SSR → Bloom → DOF → TRAA
  materials/
    principled.ts         # helpers mapping Blender params → MeshPhysicalMaterial
  assets/
    models/               # glTF exports
    hdri/                 # environment maps (shared with Blender)
  render/
    PathtraceMode.tsx     # optional three-gpu-pathtracer hero render
  config/
    color.ts              # AgX tone mapping + exposure, texture colorSpace rules
    lightUnits.ts         # Blender Watts → Three intensity conversion
```

Canvas baseline:

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
  <Lighting />
  <Model />
  <PostFX />
</Canvas>
```

---

## 9. Implementation phases

**Phase 1 — Color foundation (highest ROI).** Set up AgX tone mapping, sRGB output, correct texture color spaces, and a shared HDRI via `<Environment>`. Load one Blender-exported glTF and A/B it against an Eevee screenshot. Do not proceed until neutral/gray scenes match.

**Phase 2 — Lighting & shadows.** Recreate the Blender light rig. Add area lights (RectAreaLight) with shadow proxies. Tune shadow map size/bias. Add `<ContactShadows>` / `<AccumulativeShadows>` where needed.

**Phase 3 — GI & occlusion.** Add N8AO. Decide GI strategy: IBL-only, SSGI (dynamic), or baked lightmaps (static). A/B against Eevee's GI on/off.

**Phase 4 — Reflections & transmission.** Add SSR and/or planar reflections; set up glass with `MeshTransmissionMaterial`.

**Phase 5 — Post & AA.** Bloom, depth of field, TRAA/temporal supersampling to match Eevee's temporal stability.

**Phase 6 — Optional hero mode.** Wire `three-gpu-pathtracer` for final-quality stills from the same scene.

Validate each phase with side-by-side comparison renders (same camera, same HDRI, same exposure). Keep a reference Eevee screenshot in the repo per test scene.

---

## 10. Bottom line

- **Color/tone mapping parity is essentially free** — Three.js has AgX and Khronos PBR Neutral, the same operators Blender uses. This alone closes most of the perceived gap.
- **Materials, IBL, reflections, bloom, DOF, and AO all have strong, mature Three.js equivalents.**
- **The real work is GI and shadows**: pick IBL + SSGI + (optionally) baked lightmaps, and solve area-light shadows with proxy lights or accumulative shadows.
- **The four honest gaps** — area-light shadows, off-screen GI, true SSS, physical light units — all have workarounds and none blocks a high-fidelity result.
- **Architecture:** ship on WebGL2 (Path A) today, keep a WebGPU/TSL migration (Path B) in view, and add a path-traced "hero" mode (Path C) when you need stills that beat Eevee.

With disciplined color management and the stack above, an Eevee Next viewport render and an R3F render of the same scene can be made to sit side by side and read as the same image for the large majority of use cases.
