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
