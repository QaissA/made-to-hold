# DamagedHelmet A/B Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vendor Khronos DamagedHelmet and add a Mid-gray / Glass / Helmet subject picker on the existing Path A scene for Blender A/B prep.

**Architecture:** Download GLB to `public/models/`. `SubjectControls` drives App state. Scene renders OpaqueSphere, GlassSphere, or DamagedHelmet. Keep studio HDRI and all Phase 1–6 systems.

**Tech Stack:** Existing R3F + drei `useGLTF` / `Center`. Worktree: `.worktrees/ab-damaged-helmet` on `feat/ab-damaged-helmet`.

**Design:** `docs/plans/2026-09-17-ab-damaged-helmet-design.md`

---

### Task 1: Commit design + vendor DamagedHelmet

**Step 1: Commit design** (if not already with assets)

**Step 2: Download GLB**

```powershell
New-Item -ItemType Directory -Force -Path public\models, public\references | Out-Null
# Khronos glTF-Sample-Models DamagedHelmet binary:
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb" -OutFile "public\models\DamagedHelmet.glb"
```

If URL 404, try `main` branch path instead of `master`.

**Step 3: ATTRIBUTION**

`public/models/ATTRIBUTION.md`:
- DamagedHelmet by theblueturtle_ (Khronos glTF Sample Models)
- License per Khronos sample model license / CC as listed upstream
- Source URL

`public/references/README.md`:
- Place Eevee PNG screenshots here for side-by-side A/B
- Same camera / HDRI / exposure as R3F

**Step 4: Commit**

```
git add docs/plans/2026-09-17-ab-damaged-helmet-design.md public/models public/references
git commit -m "chore: vendor DamagedHelmet and A/B reference slot"
```

---

### Task 2: DamagedHelmet component + subject type

**Create `src/config/subject.ts`**

```ts
export type SubjectId = 'midgray' | 'glass' | 'helmet'
export const DEFAULT_SUBJECT: SubjectId = 'helmet'
```

**Create `src/canvas/DamagedHelmet.tsx`**

```tsx
import { Center, useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Group } from 'three'

export function DamagedHelmet() {
  const { scene } = useGLTF('/models/DamagedHelmet.glb')
  const clone = useMemo(() => scene.clone(true), [scene])

  useMemo(() => {
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }, [clone])

  return (
    <Center position={[0, 0.75, 0]}>
      <primitive object={clone} scale={0.85} />
    </Center>
  )
}

useGLTF.preload('/models/DamagedHelmet.glb')
```

Fix TypeScript (`THREE.Mesh` import from `three`). Tune scale so it sits similarly to the 0.75-radius sphere.

**Commit:** `feat: add DamagedHelmet glTF subject component`

---

### Task 3: SubjectControls + Scene/App wiring

**Create `src/ui/SubjectControls.tsx`** — select or radio for Mid-gray / Glass / Helmet.

**App.tsx** — `subject` state default `DEFAULT_SUBJECT`; render SubjectControls; pass to Scene.

**Scene.tsx** — replace glass ? Glass : Opaque with:

```tsx
{subject === 'helmet' && <DamagedHelmet />}
{subject === 'glass' && <GlassSphere />}
{subject === 'midgray' && <OpaqueSphere />}
```

When `heroPathtrace` and subject is glass, existing force-off still applies — for helmet, keep helmet. When pathtrace forces glass false, subject glass should show OpaqueSphere (current behavior via `glass` local var) — better: derive display from subject + heroPathtrace:

```tsx
const showHelmet = subject === 'helmet'
const showGlass = subject === 'glass' && !heroPathtrace
const showMidgray = subject === 'midgray' || (subject === 'glass' && heroPathtrace)
```

**Build must pass.**

**Commit:** `feat: wire Mid-gray Glass Helmet subject picker`

---

### Task 4: README + verification

Document:
- DamagedHelmet path and attribution
- Subject picker
- How to A/B with Blender (same studio.hdr, AgX, put Eevee shot in references/)
- Link parity checklist

`npm run build`

**Commit:** `docs: document DamagedHelmet A/B subject workflow`

---

## Execution handoff

Plan saved to `docs/plans/2026-09-17-ab-damaged-helmet.md`.

**Two execution options:**

1. **Subagent-Driven (this session)**  
2. **Parallel Session (separate)**  

**Which approach?**
