# Phase 2 Lighting & Shadows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a studio light rig (key/fill/rim + RectAreaLight with shadow proxy), ContactShadows, and UI toggles on top of the Phase 1 AgX viewport.

**Architecture:** Expand `Lighting.tsx` to host Environment and direct lights. `lightUnits.ts` holds named intensities. `LightControls` toggles feed App state into Scene → Lighting. Area light never casts native shadows — a co-located SpotLight proxy does.

**Tech Stack:** Existing Vite + R3F + drei + three. Worktree: `.worktrees/phase-2-lighting` on `feat/phase-2-lighting`.

**Design:** `docs/plans/2026-09-16-phase-2-lighting-design.md`  
**Playbook:** `docs/playbooks/lighting-shadows.md`

---

### Task 1: Commit design + lightUnits config

**Files:**
- Create: `src/config/lightUnits.ts`
- Already created: design doc (commit together)

**Step 1: Write `src/config/lightUnits.ts`**

```ts
/**
 * Hand-tuned Three.js intensities (not Blender Watts).
 * Adjust against the mid-gray reference + studio HDRI.
 */
export const LIGHT = {
  env: 1,
  key: 2.2,
  fill: 0.45,
  rim: 0.8,
  area: 8,
  /** Shadow-only proxy; keep low so LTC area dominates the look */
  areaShadowProxy: 1.2,
} as const

export const KEY_SHADOW = {
  mapSize: 2048,
  bias: -0.0001,
  normalBias: 0.02,
  cameraNear: 0.5,
  cameraFar: 20,
} as const

export type LightFlags = {
  environment: boolean
  key: boolean
  fill: boolean
  rim: boolean
  area: boolean
  contactShadows: boolean
}

export const DEFAULT_LIGHT_FLAGS: LightFlags = {
  environment: true,
  key: true,
  fill: true,
  rim: true,
  area: true,
  contactShadows: true,
}
```

**Step 2: Commit**

```powershell
git add docs/plans/2026-09-16-phase-2-lighting-design.md src/config/lightUnits.ts
git commit -m "docs: add Phase 2 lighting design and lightUnits config"
```

(If design already committed separately, commit lightUnits alone.)

---

### Task 2: Expand Lighting + ContactShadows

**Files:**
- Modify: `src/canvas/Lighting.tsx`
- Create: `src/canvas/ContactShadowGround.tsx`

**Step 1: ContactShadowGround**

```tsx
import { ContactShadows } from '@react-three/drei'

export function ContactShadowGround() {
  return (
    <ContactShadows
      position={[0, 0.001, 0]}
      opacity={0.55}
      scale={8}
      blur={2.5}
      far={4}
      resolution={1024}
      color="#000000"
    />
  )
}
```

**Step 2: Replace Lighting.tsx**

```tsx
import { Environment, RectAreaLightUniformsLib } from '@react-three/drei'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { KEY_SHADOW, LIGHT, type LightFlags } from '../config/lightUnits'

// Ensure RectAreaLight shaders are initialized once
let areaReady = false
function ensureAreaLights() {
  if (!areaReady) {
    RectAreaLightUniformsLib.init()
    areaReady = true
  }
}

type Props = { flags: LightFlags }

export function Lighting({ flags }: Props) {
  useLayoutEffect(() => {
    ensureAreaLights()
  }, [])

  return (
    <>
      {flags.environment && (
        <Environment files="/hdri/studio.hdr" environmentIntensity={LIGHT.env} />
      )}

      {flags.key && (
        <directionalLight
          castShadow
          intensity={LIGHT.key}
          position={[4, 6, 2]}
          shadow-mapSize-width={KEY_SHADOW.mapSize}
          shadow-mapSize-height={KEY_SHADOW.mapSize}
          shadow-bias={KEY_SHADOW.bias}
          shadow-normalBias={KEY_SHADOW.normalBias}
          shadow-camera-near={KEY_SHADOW.cameraNear}
          shadow-camera-far={KEY_SHADOW.cameraFar}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
      )}

      {flags.fill && (
        <directionalLight intensity={LIGHT.fill} position={[-3, 2, -1]} />
      )}

      {flags.rim && (
        <directionalLight intensity={LIGHT.rim} position={[-2, 3, -4]} />
      )}

      {flags.area && (
        <group position={[0, 2.5, 2]}>
          {/* LTC shading — no native shadows in Three.js */}
          <rectAreaLight
            width={2}
            height={1}
            intensity={LIGHT.area}
            color="#ffffff"
            lookAt={[0, 0.75, 0]}
          />
          {/*
            Gap 1 mitigation: hidden spot proxy carries the shadow map.
            Keep intensity modest so the RectAreaLight look dominates.
          */}
          <spotLight
            castShadow
            intensity={LIGHT.areaShadowProxy}
            angle={0.55}
            penumbra={0.6}
            distance={12}
            position={[0, 0, 0]}
            target-position={[0, 0.75, 0]}
            shadow-mapSize-width={KEY_SHADOW.mapSize}
            shadow-mapSize-height={KEY_SHADOW.mapSize}
            shadow-bias={KEY_SHADOW.bias}
            shadow-normalBias={KEY_SHADOW.normalBias}
          />
        </group>
      )}
    </>
  )
}
```

**Notes for implementer:**
- `lookAt` / `target-position` as JSX props may need a small helper (`useRef` + `useLayoutEffect` calling `.lookAt`) — prefer refs if R3F props don't apply cleanly.
- Import `RectAreaLightUniformsLib` from `three/examples/jsm/lights/RectAreaLightUniformsLib.js` if drei doesn't export it.
- Remove the Phase 1 `ambientLight` from Scene if still present (or leave tiny fill only when all directs off).

**Step 3: Commit**

```powershell
git add src/canvas/Lighting.tsx src/canvas/ContactShadowGround.tsx
git commit -m "feat: add studio light rig with area-light shadow proxy"
```

---

### Task 3: LightControls UI + App/Scene wiring

**Files:**
- Create: `src/ui/LightControls.tsx`
- Modify: `src/canvas/Scene.tsx`, `src/App.tsx`

**Step 1: LightControls**

```tsx
import type { LightFlags } from '../config/lightUnits'

type Props = {
  flags: LightFlags
  onChange: (next: LightFlags) => void
}

const LABELS: { key: keyof LightFlags; label: string }[] = [
  { key: 'environment', label: 'Environment' },
  { key: 'key', label: 'Key' },
  { key: 'fill', label: 'Fill' },
  { key: 'rim', label: 'Rim' },
  { key: 'area', label: 'Area (+proxy)' },
  { key: 'contactShadows', label: 'ContactShadows' },
]

export function LightControls({ flags, onChange }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.65)',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        borderRadius: 6,
      }}
    >
      {LABELS.map(({ key, label }) => (
        <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={flags[key]}
            onChange={(e) => onChange({ ...flags, [key]: e.target.checked })}
          />
          {label}
        </label>
      ))}
    </div>
  )
}
```

**Step 2: Wire Scene**

- Accept `lightFlags: LightFlags`
- Render `<Lighting flags={lightFlags} />`
- Conditionally `<ContactShadowGround />` when `lightFlags.contactShadows`
- Keep ToneMappingApplier + GroundTruth
- Drop redundant ambient or keep ≤0.02 only as safety

**Step 3: Wire App**

```tsx
const [lightFlags, setLightFlags] = useState(DEFAULT_LIGHT_FLAGS)
// ...
<LightControls flags={lightFlags} onChange={setLightFlags} />
<Scene toneMap={...} exposure={...} lightFlags={lightFlags} />
```

**Step 4: Build**

```powershell
npm run build
```

Expected: success.

**Step 5: Commit**

```powershell
git add src/ui/LightControls.tsx src/canvas/Scene.tsx src/App.tsx
git commit -m "feat: add light toggles for studio rig A/B"
```

---

### Task 4: README + verification

**Files:**
- Modify: `README.md`

**Step 1: Append Phase 2 section**

```markdown
## Phase 2 — Lighting & shadows

- Studio rig: key (shadowed) + fill + rim + RectAreaLight with Spot shadow proxy
- Right-side toggles A/B each light and ContactShadows
- Intensities: `src/config/lightUnits.ts` (hand-tuned, not Watts)
- Playbook: `docs/playbooks/lighting-shadows.md`
```

Update Status line to mention Phase 2.

**Step 2: Manual checklist**

- [ ] Key alone → soft shadow on ground
- [ ] Area on → highlight + proxy shadow; off disables both
- [ ] Env off → directs still work
- [ ] ContactShadows toggle visible
- [ ] No severe acne on sphere
- [ ] `npm run build` passes

**Step 3: Commit**

```powershell
git add README.md
git commit -m "docs: document Phase 2 lighting rig and toggles"
```

---

## Execution handoff

Plan saved to `docs/plans/2026-09-16-phase-2-lighting.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — task-by-task with reviews  
2. **Parallel Session (separate)** — executing-plans in a new session  

**Which approach?**
