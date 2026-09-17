# Scene navigation — design

Date: 2026-09-17

## Goal

Let reviewers orbit the subject by default and optionally walk/fly through the studio for Path A A/B review.

## Decisions

| Choice | Decision |
|---|---|
| Modes | Orbit (default) + Walk toggle |
| Stack | drei `OrbitControls` + `PointerLockControls` + WASD |
| Enter/exit Walk | UI checkbox + `F` |
| Pathtrace | Disable all nav; freeze camera |
| Collision | None; fixed eye height ~1.6 |
| Framing | Save orbit camera pose on enter Walk; restore on exit |

## Behavior

- **Orbit:** drag orbit, scroll zoom; mild pan so A/B framing stays easy.
- **Walk:** pointer-lock look + WASD (+ optional Shift sprint). Exit via toggle/`F`. `Esc` unlocks pointer but stays in Walk until toggle/`F` (click canvas to re-lock).
- **Pathtrace on:** force Orbit (no controls), disable Walk UI; if Walk was active, exit and unlock.
- Ignore `F` when focus is in an input/textarea/select.

## Components

| Piece | Role |
|---|---|
| `src/config/nav.ts` | `NavMode`, defaults, walk speed / eye height |
| `src/ui/NavControls.tsx` | Walk checkbox; disabled when `heroPathtrace` |
| `src/canvas/CameraNav.tsx` | Orbit **or** PointerLock + WASD; `F` listener; no controls when pathtracing |
| `App.tsx` / `Scene.tsx` | `navMode` state → Scene → CameraNav |

## Out of scope

- Collision / stairs / gravity
- Pathtrace-interactive camera
- New npm dependencies
