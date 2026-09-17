# Phase 5 Post & AA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add toggleable Bloom, DepthOfField, and SMAA to PostFX with correct pass order and AgX composer ToneMapping, without TRAA/realism-effects.

**Architecture:** Extend LightFlags with bloom/dof/smaa. PostFX mounts EffectComposer when any of n8ao|bloom|dof|smaa is true. Passes: N8AO → Bloom → DOF → SMAA → ToneMapping. ToneMappingApplier depends on composerActive.

**Tech Stack:** Existing `@react-three/postprocessing`. Worktree: `.worktrees/phase-5-post-aa` on `feat/phase-5-post-aa`.

**Design:** `docs/plans/2026-09-17-phase-5-post-aa-design.md`

---

### Task 1: Commit design + extend flags

**Step 1: Extend `src/config/lightUnits.ts`**

```ts
export type LightFlags = {
  // ...existing...
  n8ao: boolean
  bloom: boolean
  dof: boolean
  smaa: boolean
  reflectorFloor: boolean
  glass: boolean
}

export const DEFAULT_LIGHT_FLAGS: LightFlags = {
  // ...existing trues...
  n8ao: true,
  bloom: true,
  dof: false,
  smaa: true,
  reflectorFloor: true,
  glass: true,
}

export function isComposerActive(flags: LightFlags): boolean {
  return flags.n8ao || flags.bloom || flags.dof || flags.smaa
}
```

**Step 2: Commit design + flags**

```powershell
git add docs/plans/2026-09-17-phase-5-post-aa-design.md src/config/lightUnits.ts
git commit -m "feat: add Phase 5 post flags and design"
```

---

### Task 2: Expand PostFX

**File:** `src/canvas/PostFX.tsx`

Replace with logic:

```tsx
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { DEFAULT_TONE_MAP, type ToneMapPreset } from '../config/color'
import { isComposerActive, type LightFlags } from '../config/lightUnits'

type Props = {
  flags: LightFlags
  toneMap?: ToneMapPreset
}

const COMPOSER_TONE_MAP: Record<ToneMapPreset, ToneMappingMode> = {
  agx: ToneMappingMode.AGX,
  none: ToneMappingMode.LINEAR,
  neutral: ToneMappingMode.NEUTRAL,
}

/**
 * Pass order: N8AO → Bloom → DOF → SMAA → ToneMapping.
 * Mount only when any post pass is enabled. No TRAA / realism-effects.
 */
export function PostFX({ flags, toneMap = DEFAULT_TONE_MAP }: Props) {
  if (!isComposerActive(flags)) return null

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      {flags.n8ao && (
        <N8AO aoRadius={0.4} intensity={1.5} quality="medium" halfRes />
      )}
      {flags.bloom && (
        <Bloom
          luminanceThreshold={0.85}
          luminanceSmoothing={0.2}
          intensity={0.6}
          mipmapBlur
        />
      )}
      {flags.dof && (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.08}
          bokehScale={2}
          height={480}
        />
      )}
      {flags.smaa && <SMAA />}
      <ToneMapping mode={COMPOSER_TONE_MAP[toneMap]} />
    </EffectComposer>
  )
}
```

**Notes:**
- Tune Bloom/DOF if look is too strong/weak with AgX + glass.
- DepthOfField props vary by package version — adjust to match `@react-three/postprocessing` types (focusDistance may be world-space or normalized; verify).
- Prefer focusing roughly on the sphere (~camera distance to [0,0.75,0]).

**Commit:** `feat: expand PostFX with Bloom DOF and SMAA`

---

### Task 3: Wire Scene + LightControls

**Scene.tsx changes:**
- `<PostFX flags={lightFlags} toneMap={toneMap} />` (remove old `enabled={lightFlags.n8ao}`)
- ToneMappingApplier: rename prop to `composerActive={isComposerActive(lightFlags)}` and depend on it

**LightControls:** add labels Bloom, DOF, SMAA.

**Build:** `npm run build` must pass.

**Commit:** `feat: wire Bloom DOF SMAA toggles into Scene`

---

### Task 4: README + verification

Append Phase 5 section; update Status.

Manual:
- [ ] Bloom on/off visible on bright highlights
- [ ] DOF softens background when on
- [ ] SMAA reduces edges
- [ ] All post off → AgX on gl, Phase 4 look
- [ ] Tone presets work with composer on
- [ ] Build passes

**Commit:** `docs: document Phase 5 post and AA toggles`

---

## Execution handoff

Plan saved to `docs/plans/2026-09-17-phase-5-post-aa.md`.

**Two execution options:**

1. **Subagent-Driven (this session)**  
2. **Parallel Session (separate)**  

**Which approach?**
