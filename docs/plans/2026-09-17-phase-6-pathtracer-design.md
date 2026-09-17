# Phase 6 — Pathtracer Hero Mode Design

**Date:** 2026-09-17  
**Status:** Approved  
**Branch:** `feat/phase-6-pathtracer` (from `feat/phase-5-post-aa` @ `7893ddb`)  
**Worktree:** `.worktrees/phase-6-pathtracer`

---

## Decisions

| Topic | Choice |
|---|---|
| UX | Toggle “Hero pathtrace” on same Canvas |
| Stack | `@react-three/gpu-pathtracer` (`Pathtracer` + `enabled`) |
| Git | New branch + worktree from Phase 5 tip |
| Default | **Off** — Path A remains interactive default |

---

## Scope

### In
- Install `@react-three/gpu-pathtracer`
- Wrap scene in Pathtracer; `enabled={heroPathtrace}`
- When on: unmount PostFX; show samples + Reset
- Shared lights / Environment / geometry
- Document transmission/reflector limitations + fallbacks if needed

### Out
- PNG export pipeline, replacing Path A default, TRAA/SSGI

---

## Layout

```
src/render/PathtraceShell.tsx
src/ui/PathtraceControls.tsx
src/canvas/Scene.tsx
src/App.tsx
```

---

## Verification

- Default Path A
- Toggle on → progressive accumulate, no EffectComposer
- Toggle off → realtime restored
- `npm run build` passes

---

## Canon

`docs/playbooks/path-c-pathtracer.md` · `.cursor/rules/pathtracer.mdc`
