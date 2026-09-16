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
