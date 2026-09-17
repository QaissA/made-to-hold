# Phase 5 — Post & AA Design

**Date:** 2026-09-17  
**Status:** Approved  
**Branch:** `feat/phase-5-post-aa` (from `feat/phase-4-reflections` @ `de59cab`)  
**Worktree:** `.worktrees/phase-5-post-aa`

---

## Decisions

| Topic | Choice |
|---|---|
| Effects | Bloom + DOF + SMAA (no TRAA / realism-effects) |
| Control | Per-pass toggles; composer mounts if any post on |
| Git | New branch + worktree from Phase 4 tip |
| Approach | Extend PostFX (Approach A) |

---

## Scope

### In
- Bloom, DepthOfField, SMAA via `@react-three/postprocessing`
- Flags: `bloom`, `dof`, `smaa` (+ existing `n8ao`)
- Pass order: N8AO → Bloom → DOF → SMAA → ToneMapping
- Composer unmount when all post flags false → AgX on `gl`
- Defaults: bloom/smaa/n8ao true; dof false

### Out
- TRAA, realism-effects, SSGI/SSR, pathtracer

---

## Encoding

- When composer mounted: ToneMapping effect last (AgX/None/Neutral from UI)
- ToneMappingApplier must re-run when **any** composer flag toggles off (not only n8ao) — rename dep to `composerActive`

---

## Verification

- Each of Bloom / DOF / SMAA / N8AO A/Bs
- All post off → Phase 4 look + AgX on gl
- AgX/None/Neutral work with composer on
- `npm run build` passes

---

## Canon

`docs/playbooks/post-aa.md` · `.cursor/rules/postfx.mdc`
