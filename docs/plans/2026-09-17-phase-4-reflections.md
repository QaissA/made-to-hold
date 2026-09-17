# Phase 4 Reflections & Transmission Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reflective floor (`MeshReflectorMaterial`) and a glass hero (`MeshTransmissionMaterial`) with UI toggles on the Phase 3 scene.

**Architecture:** Extend `LightFlags` with `reflectorFloor` and `glass`. Scene swaps plain ground ↔ reflector and opaque sphere ↔ glass sphere. ContactShadows suppressed when reflector is on.

**Tech Stack:** Existing Vite + R3F + drei (already has MeshReflectorMaterial / MeshTransmissionMaterial). Worktree: `.worktrees/phase-4-reflections` on `feat/phase-4-reflections`.

**Design:** `docs/plans/2026-09-17-phase-4-reflections-design.md`

---

### Task 1: Commit design + extend flags

**Files:**
- Create: design doc (commit)
- Modify: `src/config/lightUnits.ts`

**Step 1: Extend LightFlags**

```ts
export type LightFlags = {
  environment: boolean
  key: boolean
  fill: boolean
  rim: boolean
  area: boolean
  contactShadows: boolean
  n8ao: boolean
  reflectorFloor: boolean
  glass: boolean
}

export const DEFAULT_LIGHT_FLAGS: LightFlags = {
  environment: true,
  key: true,
  fill: true,
  rim: true,
  area: true,
  contactShadows: true,
  n8ao: true,
  reflectorFloor: true,
  glass: true,
}
```

**Step 2: Commit**

```powershell
git add docs/plans/2026-09-17-phase-4-reflections-design.md src/config/lightUnits.ts
git commit -m "feat: add Phase 4 reflector/glass flags and design"
```

(Or split design commit + flags commit if preferred.)

---

### Task 2: ReflectorFloor + GlassSphere + GroundTruth split

**Files:**
- Create: `src/canvas/ReflectorFloor.tsx`
- Create: `src/canvas/GlassSphere.tsx`
- Modify: `src/canvas/GroundTruth.tsx`

**Step 1: ReflectorFloor**

```tsx
import { MeshReflectorMaterial } from '@react-three/drei'
import { REFERENCE_ALBEDO } from '../config/color'

export function ReflectorFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={0.85}
        roughness={0.6}
        depthScale={0.8}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={REFERENCE_ALBEDO}
        metalness={0.2}
        mirror={0.35}
      />
    </mesh>
  )
}
```

Tune if too dark/bright with AgX.

**Step 2: GlassSphere**

```tsx
import { MeshTransmissionMaterial } from '@react-three/drei'

export function GlassSphere() {
  return (
    <mesh castShadow position={[0, 0.75, 0]}>
      <sphereGeometry args={[0.75, 64, 64]} />
      <MeshTransmissionMaterial
        backside
        samples={6}
        resolution={512}
        transmission={1}
        roughness={0.05}
        thickness={0.6}
        ior={1.5}
        chromaticAberration={0.02}
        anisotropy={0.1}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.1}
        color="#ffffff"
      />
    </mesh>
  )
}
```

Prefer lower `samples`/`resolution` if perf is poor.

**Step 3: GroundTruth** — export pieces:

```tsx
import { REFERENCE_ALBEDO } from '../config/color'

export function OpaqueSphere() {
  return (
    <mesh castShadow position={[0, 0.75, 0]}>
      <sphereGeometry args={[0.75, 64, 64]} />
      <meshStandardMaterial color={REFERENCE_ALBEDO} roughness={0.45} metalness={0} />
    </mesh>
  )
}

export function PlainGround() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color={REFERENCE_ALBEDO} roughness={0.85} metalness={0} />
    </mesh>
  )
}

/** @deprecated prefer OpaqueSphere + PlainGround / ReflectorFloor */
export function GroundTruth() {
  return (
    <group>
      <OpaqueSphere />
      <PlainGround />
    </group>
  )
}
```

**Step 4: Commit**

```powershell
git add src/canvas/ReflectorFloor.tsx src/canvas/GlassSphere.tsx src/canvas/GroundTruth.tsx
git commit -m "feat: add reflector floor and transmission glass sphere"
```

---

### Task 3: Wire Scene + LightControls

**Files:**
- Modify: `src/canvas/Scene.tsx`, `src/ui/LightControls.tsx`

**Step 1: Scene composition**

```tsx
{lightFlags.glass ? <GlassSphere /> : <OpaqueSphere />}
{lightFlags.reflectorFloor ? <ReflectorFloor /> : <PlainGround />}
{lightFlags.contactShadows && !lightFlags.reflectorFloor && <ContactShadowGround />}
```

**Step 2: LightControls LABELS** — add:

```ts
{ key: 'reflectorFloor', label: 'Reflector floor' },
{ key: 'glass', label: 'Glass' },
```

Optional UX: when enabling reflectorFloor, auto-set contactShadows false in onChange — nice-to-have, not required if Scene already ignores contact when reflector on.

**Step 3: Build**

```powershell
npm run build
```

**Step 4: Commit**

```powershell
git add src/canvas/Scene.tsx src/ui/LightControls.tsx
git commit -m "feat: wire reflector and glass toggles into Scene"
```

---

### Task 4: README + verification

**Step 1: README Phase 4 section**

```markdown
## Phase 4 — Reflections & transmission

- Reflective floor: drei `MeshReflectorMaterial` (toggle **Reflector floor**)
- Glass: drei `MeshTransmissionMaterial` (toggle **Glass**; replaces opaque mid-gray sphere)
- ContactShadows disabled while reflector is on
- SSR deferred; production glass will prefer Physical/glTF later
- Playbook: `docs/playbooks/post-aa.md` (reflections/transmission)
```

Update Status.

**Step 2: Manual checklist**

- [ ] Reflector shows sphere and lights
- [ ] Glass refracts environment/floor
- [ ] Glass off → opaque mid-gray
- [ ] Reflector off → plain ground (+ ContactShadows if enabled)
- [ ] `npm run build` passes

**Step 3: Commit**

```powershell
git add README.md
git commit -m "docs: document Phase 4 reflector and glass"
```

---

## Execution handoff

Plan saved to `docs/plans/2026-09-17-phase-4-reflections.md`.

**Two execution options:**

1. **Subagent-Driven (this session)**  
2. **Parallel Session (separate)**  

**Which approach?**
