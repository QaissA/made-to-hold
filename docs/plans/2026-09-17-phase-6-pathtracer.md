# Phase 6 Pathtracer Hero Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an opt-in Hero pathtrace toggle using `@react-three/gpu-pathtracer` on the shared scene, without making path tracing the interactive default.

**Architecture:** App holds `heroPathtrace` (default false). Scene wraps content in `PathtraceShell` (`<Pathtracer enabled={…}>`). PostFX mounts only when `!heroPathtrace && isComposerActive`. PathtraceControls show toggle + samples/reset.

**Tech Stack:** `@react-three/gpu-pathtracer` (wraps `three-gpu-pathtracer`). Worktree: `.worktrees/phase-6-pathtracer` on `feat/phase-6-pathtracer`.

**Design:** `docs/plans/2026-09-17-phase-6-pathtracer-design.md`  
**Playbook:** `docs/playbooks/path-c-pathtracer.md`

---

### Task 1: Commit design + install package

```powershell
cd c:\dev\3d-project\.worktrees\phase-6-pathtracer
git add docs/plans/2026-09-17-phase-6-pathtracer-design.md
git commit -m "docs: add Phase 6 pathtracer design"

npm install @react-three/gpu-pathtracer
npm run build
git add package.json package-lock.json
git commit -m "chore: add @react-three/gpu-pathtracer"
```

---

### Task 2: PathtraceShell + PathtraceControls

**Create `src/render/PathtraceShell.tsx`**

```tsx
import { Pathtracer } from '@react-three/gpu-pathtracer'
import type { ReactNode } from 'react'

type Props = {
  enabled: boolean
  children: ReactNode
}

/** Path C wrapper — enabled only for hero stills; Path A when false. */
export function PathtraceShell({ enabled, children }: Props) {
  return (
    <Pathtracer
      enabled={enabled}
      bounces={enabled ? 5 : 1}
      tiles={enabled ? 2 : 1}
      // samples / frames: leave uncapped while accumulating in hero mode
    >
      {children}
    </Pathtracer>
  )
}
```

Adjust props to match installed package API (`enabled`, `bounces`, `tiles`, etc.).

**Create `src/ui/PathtraceControls.tsx`**

```tsx
type Props = {
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  samples?: number
  onReset?: () => void
}

export function PathtraceControls({
  enabled,
  onEnabledChange,
  samples,
  onReset,
}: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        zIndex: 10,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.65)',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        borderRadius: 6,
      }}
    >
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        Hero pathtrace
      </label>
      {enabled && (
        <>
          <span>Samples: {samples ?? '…'}</span>
          {onReset && (
            <button type="button" onClick={onReset}>
              Reset
            </button>
          )}
        </>
      )}
    </div>
  )
}
```

Samples/reset may require a small child inside Pathtracer using `usePathtracer()` — put `PathtraceSampleHud` inside the shell when enabled and lift samples via callback/store, OR keep controls simple (toggle only) if hook bridging is awkward. Prefer: toggle + reset via `usePathtracer` from a component inside the Pathtracer tree; samples displayed there or via React state lifted with a callback ref.

**Commit:** `feat: add PathtraceShell and PathtraceControls`

---

### Task 3: Wire Scene + App

**App.tsx**
- `const [heroPathtrace, setHeroPathtrace] = useState(false)`
- Render `PathtraceControls` + pass `heroPathtrace` to Scene

**Scene.tsx**
- Accept `heroPathtrace: boolean`
- Wrap Suspense scene content (Lighting + meshes + contact) in `<PathtraceShell enabled={heroPathtrace}>`
- `<PostFX … />` only when `!heroPathtrace`
- ToneMappingApplier: when heroPathtrace, treat like composer off for gl TM (pathtracer owns output) — set NoToneMapping or leave package defaults; document

**Hero material fallback (if needed during impl):**  
When `heroPathtrace`, force `glass=false` and `reflectorFloor=false` for stability, OR swap GlassSphere → OpaqueSphere. Prefer automatic fallback with a console/README note.

**Build must pass.**

**Commit:** `feat: wire hero pathtrace toggle into Scene`

---

### Task 4: README + verification

```markdown
## Phase 6 — Hero pathtracer (Path C)

- Toggle **Hero pathtrace** (default off) — progressive GPU path tracing via `@react-three/gpu-pathtracer`
- Interactive default remains Path A (raster + post)
- PostFX disabled while pathtracing
- Transmission/reflector may fall back to opaque/plain for tracer stability
- Playbook: `docs/playbooks/path-c-pathtracer.md`
```

Manual:
- [ ] Default Path A
- [ ] Hero on → accumulates; PostFX off
- [ ] Hero off → realtime restored
- [ ] Build passes

**Commit:** `docs: document Phase 6 hero pathtracer`

---

## Execution handoff

Plan saved to `docs/plans/2026-09-17-phase-6-pathtracer.md`.

**Two execution options:**

1. **Subagent-Driven (this session)**  
2. **Parallel Session (separate)**  

**Which approach?**
