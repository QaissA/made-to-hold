# Phase 4 — Reflections & Transmission Design

**Date:** 2026-09-17  
**Status:** Approved  
**Branch:** `feat/phase-4-reflections` (from `feat/phase-3-gi-ao` @ `62ae099`)  
**Worktree:** `.worktrees/phase-4-reflections`

---

## Decisions

| Topic | Choice |
|---|---|
| Reflections | Planar floor via `MeshReflectorMaterial` (no SSR) |
| Glass | drei `MeshTransmissionMaterial` |
| Git | New branch + worktree from Phase 3 tip |
| Approach | Reflector floor + transmission hero (Approach A) |

---

## Scope

### In
- `ReflectorFloor` with MeshReflectorMaterial
- `GlassSphere` with MeshTransmissionMaterial (replaces opaque sphere when glass on)
- Flags/toggles: `reflectorFloor`, `glass`
- When reflector on, ignore ContactShadows (conflict)
- Keep AgX / lights / N8AO

### Out
- SSR, realism-effects, bloom/DOF, glTF glass assets

---

## Layout

```
src/canvas/ReflectorFloor.tsx
src/canvas/GlassSphere.tsx
src/canvas/GroundTruth.tsx   # split: OpaqueSphere + PlainGround helpers or props
src/config/lightUnits.ts     # + reflectorFloor, glass
src/ui/LightControls.tsx
src/canvas/Scene.tsx
```

**Defaults:** `reflectorFloor: true`, `glass: true` (Phase 4 visible out of the box); ContactShadows effectively off when reflector on.

---

## Verification

- Reflector shows sphere + lights in floor
- Glass shows refraction of env/floor
- Toggles restore opaque mid-gray + plain ground
- `npm run build` passes

---

## Canon

`docs/playbooks/post-aa.md` (reflections/transmission) · architecture §3.8 · `materials.mdc`
