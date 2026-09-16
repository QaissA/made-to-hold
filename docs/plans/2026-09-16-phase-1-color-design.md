# Phase 1 — Color Foundation Design

**Date:** 2026-09-16  
**Status:** Approved  
**Branch:** `feat/phase-1-color` (from `docs/eevee-parity-rules`)  
**Worktree:** `.worktrees/phase-1-color`

---

## Decisions

| Topic | Choice |
|---|---|
| Assets | Placeholders — free sample HDRI + procedural gray sphere/plane |
| Stack | Vite + React + TypeScript + R3F + drei |
| Git | New branch/worktree from docs tip (not master) |
| Done when | Runnable viewport + tone-map toggle (AgX / None / Neutral) + exposure |

**Approach:** Minimal Vite scene (Approach A) — only folders Phase 1 needs.

---

## Scope

### In
- Canvas: `AgXToneMapping`, `SRGBColorSpace`, soft shadows, `dpr={[1,2]}`
- Gray `MeshStandardMaterial` sphere + ground (albedo ~0.18)
- `<Environment>` with bundled free sample HDRI under `public/hdri/`
- UI overlay: tone mapping AgX | None | Neutral + exposure slider
- `src/config/color.ts` shared defaults
- HDRI attribution note in README

### Out
- N8AO, SSGI, bloom, RectAreaLight, glTF UI, Path B/C

---

## File layout

```
src/
  main.tsx
  App.tsx
  canvas/
    Scene.tsx
    Lighting.tsx
    GroundTruth.tsx
  config/
    color.ts
  ui/
    ToneMapControls.tsx
public/
  hdri/   # one free sample .hdr + attribution
```

**Data flow:** `ToneMapControls` → React state → `Scene` applies `gl.toneMapping` / `toneMappingExposure`. Default = AgX.

---

## Verification

- `npm run dev` runs clean
- AgX looks plausible; None looks raw/wrong; Neutral differs
- No EffectComposer / double tone-map
- Applicable items from `docs/playbooks/color-foundation.md` checked

---

## Canon

Follow `docs/playbooks/color-foundation.md` and `.cursor/rules/project-render-stack.mdc` / `canvas-scene.mdc`.
