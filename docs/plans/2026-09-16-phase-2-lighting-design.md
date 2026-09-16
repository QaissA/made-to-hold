# Phase 2 — Lighting & Shadows Design

**Date:** 2026-09-16  
**Status:** Approved  
**Branch:** `feat/phase-2-lighting` (from `feat/phase-1-color` @ `c2bb640`)  
**Worktree:** `.worktrees/phase-2-lighting`

---

## Decisions

| Topic | Choice |
|---|---|
| Rig | Studio key trio + RectAreaLight with shadow proxy |
| UI | Toggles for Env / Key / Fill / Rim / Area / ContactShadows |
| Git | New branch + worktree from Phase 1 tip |
| Approach | Expand `Lighting.tsx` + `LightControls` (Approach A) |

---

## Scope

### In
- Directional key with castShadow (mapSize 2048, bias/normalBias tuned)
- Soft fill + rim
- RectAreaLight + hidden SpotLight shadow proxy (Gap 1)
- Keep Environment (toggleable)
- `<ContactShadows />` (toggleable)
- `src/config/lightUnits.ts` named intensities
- Keep Phase 1 AgX / exposure UI

### Out
- AccumulativeShadows, SSGI/N8AO, glTF, Path B/C, true Watt conversion

---

## File layout

```
src/config/lightUnits.ts
src/canvas/Lighting.tsx              # expanded
src/canvas/ContactShadowGround.tsx   # ContactShadows wrapper
src/ui/LightControls.tsx
src/App.tsx                          # light enable state
src/canvas/Scene.tsx                 # pass light flags into Lighting
```

---

## Shadow strategy

- Key owns primary live shadow map
- Area: LTC shading only; Spot proxy at same pose for shadows; code comment documents Gap 1
- ContactShadows for cheap ground contact
- Canvas remains `shadows="soft"`

---

## Verification

- Key alone → clear soft ground shadow
- Area on → LTC look + proxy shadow; area toggle disables proxy too
- Env off → direct lights still readable
- No obvious acne / peter-panning on mid-gray sphere

---

## Canon

`docs/playbooks/lighting-shadows.md` · `.cursor/rules/lighting.mdc`
