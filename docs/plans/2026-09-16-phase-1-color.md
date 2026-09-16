# Phase 1 Color Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a Vite + R3F + TypeScript app with AgX color management, a gray reference scene, sample HDRI Environment, and a tone-mapping toggle (AgX / None / Neutral) plus exposure.

**Architecture:** Minimal Path A viewport. `config/color.ts` owns defaults; `Scene` owns `<Canvas>`; `Lighting` is Environment-only; `GroundTruth` is procedural gray geometry; `ToneMapControls` drives runtime tone mapping via React state. No postprocessing.

**Tech Stack:** Vite, React 18+, TypeScript, three, @react-three/fiber, @react-three/drei. Work from `.worktrees/phase-1-color` on branch `feat/phase-1-color`.

**Design:** `docs/plans/2026-09-16-phase-1-color-design.md`  
**Playbook:** `docs/playbooks/color-foundation.md`

---

### Task 1: Commit design doc + scaffold Vite app

**Files:**
- Create: Vite React-TS project files at worktree root (alongside existing `docs/`, `AGENTS.md`, `.cursor/`)
- Modify: `.gitignore` if Vite template needs additions (`node_modules`, `dist`)

**Step 1: Commit design (if not already)**

```powershell
cd c:\dev\3d-project\.worktrees\phase-1-color
git add docs/plans/2026-09-16-phase-1-color-design.md
git commit -m "docs: add Phase 1 color foundation design"
```

**Step 2: Scaffold Vite in place without clobbering docs**

Prefer creating in a temp folder and moving app files up, OR `npm create vite@latest . -- --template react-ts` only if the CLI allows non-empty dirs. Safe approach:

```powershell
cd c:\dev\3d-project\.worktrees\phase-1-color
npm create vite@latest __vite_tmp -- --template react-ts
# Move package.json, vite.config.ts, tsconfig*, index.html, src/, public/ from __vite_tmp to .
# Merge .gitignore entries (keep .worktrees/ ignore from parent pattern if present)
Remove-Item -Recurse -Force __vite_tmp
```

**Step 3: Install deps**

```powershell
npm install
npm install three @types/three @react-three/fiber @react-three/drei
```

**Step 4: Verify**

```powershell
npm run build
```

Expected: build succeeds (default Vite App OK).

**Step 5: Commit**

```powershell
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src public .gitignore
git commit -m "chore: scaffold Vite React TypeScript app"
```

---

### Task 2: Color config module

**Files:**
- Create: `src/config/color.ts`
- Test: optional unit-free; verify by import in Scene later

**Step 1: Write `src/config/color.ts`**

```ts
import {
  AgXToneMapping,
  NeutralToneMapping,
  NoToneMapping,
  SRGBColorSpace,
  type ToneMapping,
} from 'three'

export type ToneMapPreset = 'agx' | 'none' | 'neutral'

export const TONE_MAP_PRESETS: Record<ToneMapPreset, ToneMapping> = {
  agx: AgXToneMapping,
  none: NoToneMapping,
  neutral: NeutralToneMapping,
}

export const DEFAULT_TONE_MAP: ToneMapPreset = 'agx'
export const DEFAULT_EXPOSURE = 1.0
export const OUTPUT_COLOR_SPACE = SRGBColorSpace

/** Mid-gray albedo for reference geometry (~18% gray). */
export const REFERENCE_ALBEDO = '#2e2e2e'
```

**Step 2: Commit**

```powershell
git add src/config/color.ts
git commit -m "feat: add shared AgX color config defaults"
```

---

### Task 3: GroundTruth + Lighting components

**Files:**
- Create: `src/canvas/GroundTruth.tsx`
- Create: `src/canvas/Lighting.tsx`
- Create: `public/hdri/README.md` (attribution placeholder until HDRI binary added)

**Step 1: Write GroundTruth**

```tsx
import { REFERENCE_ALBEDO } from '../config/color'

export function GroundTruth() {
  return (
    <group>
      <mesh castShadow position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshStandardMaterial color={REFERENCE_ALBEDO} roughness={0.45} metalness={0} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={REFERENCE_ALBEDO} roughness={0.85} metalness={0} />
      </mesh>
    </group>
  )
}
```

**Step 2: Write Lighting**

Use drei `Environment`. Prefer a local file once present; until then use drei's built-in preset **only as temporary** — Phase 1 design asks for a file under `public/hdri/`. Download a small free HDRI (e.g. Poly Haven “studio small” or similar, CC0) to `public/hdri/studio.hdr` and attribute it.

```tsx
import { Environment } from '@react-three/drei'

export function Lighting() {
  return <Environment files="/hdri/studio.hdr" />
}
```

**Step 3: HDRI**

- Download a CC0 `.hdr` into `public/hdri/studio.hdr`
- Write `public/hdri/ATTRIBUTION.md` with source URL + license

If network download is blocked, use `<Environment preset="studio" />` temporarily and note TODO in ATTRIBUTION.md — but prefer real file.

**Step 4: Commit**

```powershell
git add src/canvas/GroundTruth.tsx src/canvas/Lighting.tsx public/hdri
git commit -m "feat: add gray reference scene and Environment lighting"
```

---

### Task 4: Scene Canvas + tone map wiring

**Files:**
- Create: `src/canvas/Scene.tsx`
- Create: `src/ui/ToneMapControls.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`, `src/index.css`

**Step 1: ToneMapControls**

```tsx
import type { ToneMapPreset } from '../config/color'
import { DEFAULT_EXPOSURE, DEFAULT_TONE_MAP } from '../config/color'

type Props = {
  toneMap: ToneMapPreset
  exposure: number
  onToneMapChange: (v: ToneMapPreset) => void
  onExposureChange: (v: number) => void
}

export function ToneMapControls({
  toneMap = DEFAULT_TONE_MAP,
  exposure = DEFAULT_EXPOSURE,
  onToneMapChange,
  onExposureChange,
}: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.65)',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        borderRadius: 6,
      }}
    >
      <label>
        Tone{' '}
        <select
          value={toneMap}
          onChange={(e) => onToneMapChange(e.target.value as ToneMapPreset)}
        >
          <option value="agx">AgX</option>
          <option value="none">None</option>
          <option value="neutral">Neutral</option>
        </select>
      </label>
      <label>
        Exposure{' '}
        <input
          type="range"
          min={0.2}
          max={2.5}
          step={0.05}
          value={exposure}
          onChange={(e) => onExposureChange(Number(e.target.value))}
        />{' '}
        {exposure.toFixed(2)}
      </label>
    </div>
  )
}
```

**Step 2: Scene**

```tsx
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import {
  DEFAULT_EXPOSURE,
  DEFAULT_TONE_MAP,
  OUTPUT_COLOR_SPACE,
  TONE_MAP_PRESETS,
  type ToneMapPreset,
} from '../config/color'
import { GroundTruth } from './GroundTruth'
import { Lighting } from './Lighting'

function ToneMappingApplier({
  toneMap,
  exposure,
}: {
  toneMap: ToneMapPreset
  exposure: number
}) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = TONE_MAP_PRESETS[toneMap]
    gl.toneMappingExposure = exposure
    gl.outputColorSpace = OUTPUT_COLOR_SPACE
  }, [gl, toneMap, exposure])
  return null
}

type SceneProps = {
  toneMap?: ToneMapPreset
  exposure?: number
}

export function Scene({
  toneMap = DEFAULT_TONE_MAP,
  exposure = DEFAULT_EXPOSURE,
}: SceneProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [2.5, 1.8, 3.5], fov: 45 }}
      gl={{
        antialias: true,
        toneMapping: TONE_MAP_PRESETS[DEFAULT_TONE_MAP],
        toneMappingExposure: DEFAULT_EXPOSURE,
        outputColorSpace: OUTPUT_COLOR_SPACE,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ToneMappingApplier toneMap={toneMap} exposure={exposure} />
      <color attach="background" args={['#111']} />
      <Suspense fallback={null}>
        <Lighting />
        <GroundTruth />
      </Suspense>
      <ambientLight intensity={0.05} />
    </Canvas>
  )
}
```

Note: tiny ambient is only a safety fill; Environment should dominate. If too bright/dark, tune exposure via UI first.

**Step 3: App**

```tsx
import { useState } from 'react'
import { Scene } from './canvas/Scene'
import {
  DEFAULT_EXPOSURE,
  DEFAULT_TONE_MAP,
  type ToneMapPreset,
} from './config/color'
import { ToneMapControls } from './ui/ToneMapControls'

export default function App() {
  const [toneMap, setToneMap] = useState<ToneMapPreset>(DEFAULT_TONE_MAP)
  const [exposure, setExposure] = useState(DEFAULT_EXPOSURE)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ToneMapControls
        toneMap={toneMap}
        exposure={exposure}
        onToneMapChange={setToneMap}
        onExposureChange={setExposure}
      />
      <Scene toneMap={toneMap} exposure={exposure} />
    </div>
  )
}
```

**Step 4: CSS** — full-bleed, no margin:

```css
html, body, #root {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}
```

Remove default Vite App.css usage from main/App.

**Step 5: Run**

```powershell
npm run dev
```

Expected: gray sphere on plane, IBL lighting, controls work; switching to None looks harsher/wrong.

**Step 6: Commit**

```powershell
git add src/canvas/Scene.tsx src/ui/ToneMapControls.tsx src/App.tsx src/main.tsx src/index.css
git commit -m "feat: wire AgX Canvas with tone map and exposure controls"
```

---

### Task 5: README Phase 1 notes + playbook cross-link

**Files:**
- Modify: `README.md`

**Step 1: Append a Phase 1 section** (keep existing docs table)

```markdown
## Phase 1 — Color foundation

```bash
npm install
npm run dev
```

- Default view transform: **AgX** (Blender 4.x default)
- Use the on-screen control to compare AgX / None / Neutral
- Sample HDRI: `public/hdri/studio.hdr` (see ATTRIBUTION.md)
- Checklist: `docs/playbooks/color-foundation.md`
```

**Step 2: Commit**

```powershell
git add README.md
git commit -m "docs: document Phase 1 dev server and AgX controls"
```

---

### Task 6: Verification gate

**Step 1: Build**

```powershell
npm run build
```

Expected: success.

**Step 2: Manual checklist** (from playbook, applicable items)

- [ ] `toneMapping` defaults to AgX
- [ ] `outputColorSpace` is SRGB
- [ ] Exposure control updates look
- [ ] None / Neutral visibly differ from AgX
- [ ] No EffectComposer / double encoding
- [ ] Environment HDRI loads (or documented preset fallback)

**Step 3: Final status**

```powershell
git status
git log --oneline docs/eevee-parity-rules..HEAD
```

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-09-16-phase-1-color.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — fresh subagent per task, review between tasks  
2. **Parallel Session (separate)** — new session with executing-plans  

**Which approach?**
