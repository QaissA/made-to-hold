# DamagedHelmet A/B Scaffold Design

**Date:** 2026-09-17  
**Status:** Approved  
**Branch:** `feat/ab-damaged-helmet` (from `master` @ `f54d7df`)  
**Worktree:** `.worktrees/ab-damaged-helmet`

---

## Decisions

| Topic | Choice |
|---|---|
| Asset source | Khronos DamagedHelmet (glTF-Binary) |
| Subject UI | Toggle Mid-gray \| Glass \| DamagedHelmet |
| HDRI | Keep `public/hdri/studio.hdr` |
| Approach | Vendor GLB + subject picker (Approach A) |

---

## Scope

### In
- Vendor `DamagedHelmet.glb` + model ATTRIBUTION
- `DamagedHelmet.tsx` (`useGLTF`, shadows, sensible scale/center)
- SubjectControls: `midgray` | `glass` | `helmet` (default **helmet** for this milestone)
- Scene switches subject; floor/reflector unchanged
- `public/references/README.md` for future Eevee screenshots
- README A/B notes (same HDRI, AgX, checklist link)

### Out
- New HDRI, automated image diff, SSGI, Blender export pipeline

---

## Pathtrace note

Prefer keeping helmet under Path C; if unstable, document. Do not silently force midgray without UI feedback.

---

## Verification

- Helmet loads under AgX + studio HDRI
- Subject picker cycles all three
- Attributions present; build passes

---

## Canon

`docs/reference/parity-checklist.md` · `docs/playbooks/color-foundation.md` · `materials.mdc`
