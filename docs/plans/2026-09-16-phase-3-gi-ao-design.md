# Phase 3 — GI & AO Design

**Date:** 2026-09-16  
**Status:** Approved  
**Branch:** `feat/phase-3-gi-ao` (from `feat/phase-2-lighting` @ `1415c46`)  
**Worktree:** `.worktrees/phase-3-gi-ao`

---

## Decisions

| Topic | Choice |
|---|---|
| GI strategy | IBL (existing Environment) + **N8AO only** (no SSGI yet) |
| Control | Toggle to A/B N8AO on/off |
| Git | New branch + worktree from Phase 2 tip |
| Approach | `@react-three/postprocessing` + `n8ao` (Approach A) |

---

## Scope

### In
- Install/pin `n8ao` and `@react-three/postprocessing` (and transitive `postprocessing`)
- `src/canvas/PostFX.tsx` — EffectComposer + N8AO when enabled
- UI toggle for N8AO
- Keep renderer AgX / SRGB — **no** `<ToneMapping />` effect in the composer
- Comment/README: GI strategy = IBL + N8AO; SSGI deferred

### Out
- SSGI / realism-effects, lightmap baking, bloom/DOF/TRAA

---

## Design §2 — Layout & encoding

**Files**
```
src/canvas/PostFX.tsx       # EffectComposer + N8AO (conditional)
src/ui/LightControls.tsx    # add N8AO checkbox (or extend flags)
src/config/lightUnits.ts    # extend LightFlags with n8ao OR separate postFlags
src/canvas/Scene.tsx        # mount PostFX inside Canvas
src/App.tsx                 # state for n8ao
```

**Encoding rules (non-negotiable)**
- Tone mapping stays on `gl` (AgX) via existing `ToneMappingApplier`
- When N8AO is off: **do not mount** EffectComposer (avoids pipeline cost / surprises)
- When N8AO is on: composer runs AO only — no second tone-map/gamma pass
- Prefer HalfFloat frame buffer if required by N8AO quality on WebGL2

**Verify**
- Toggle on → contact darkening in creases (sphere/ground)
- Toggle off → matches Phase 2 look
- AgX / None / Neutral still work with AO on
- `npm run build` passes

---

## Canon

`docs/playbooks/gi-ao.md` · `docs/playbooks/post-aa.md` (pass order note: N8AO first)
