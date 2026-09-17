# Made to Hold P1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `/` landing with overture loader + procedural hero trio (“Made to hold.”) on Path A, and move the existing sandbox to `/lab`.

**Architecture:** React Router splits landing vs lab. Shared canvas/lighting/color stay in `src/canvas` + `src/config`. Landing-only UI under `src/landing/`. Procedural trio geometry (no glTF yet). Lenis stub only — full scroll spine is P2.

**Tech Stack:** React, R3F, drei, existing PostFX/Lighting, react-router-dom, lenis, maath

**Design:** `docs/plans/2026-09-17-made-to-hold-p1-design.md`  
**Playbook:** `docs/playbooks/landing-page.md`

---

### Task 1: Deps + palette + base CSS

**Files:**
- Create: `src/config/palette.ts`
- Modify: `src/index.css`
- Modify: `package.json` (via npm install)

**Step 1: Install deps**

```bash
npm install react-router-dom lenis maath
```

**Step 2: Add palette**

```ts
/** Made to Hold brand tokens (DOM + optional Three Color). */
export const PALETTE = {
  bg: '#0E0D0F',
  bgPlaster: '#1A1720',
  majorelle: '#3B33E0',
  majorelleBright: '#5B4BFF',
  saffron: '#E8A13A',
  terracotta: '#C05A3E',
  zellijGreen: '#1F6E5C',
  bone: '#EDE6D8',
  muted: '#8A8494',
} as const
```

**Step 3: Wire CSS variables + fonts in `index.css`**

- Set `:root` CSS vars from palette
- Import Google fonts for Space Grotesk + Space Mono (Clash Display via Fontshare CDN `@import` or link in `index.html`)
- `body { background: var(--bg); color: var(--bone); margin: 0; }`
- Keep `#root` full viewport

**Step 4: Commit**

```bash
git add package.json package-lock.json src/config/palette.ts src/index.css index.html
git commit -m "feat: add Made to Hold palette and landing deps"
```

---

### Task 2: Router + move lab sandbox

**Files:**
- Create: `src/lab/LabApp.tsx` (move current `App.tsx` contents)
- Modify: `src/App.tsx` → router only
- Modify: `src/main.tsx` if needed

**Step 1:** Move existing default export App body into `LabApp`.

**Step 2:** New `App.tsx`:

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './landing/LandingPage'
import LabApp from './lab/LabApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lab" element={<LabApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**Step 3:** Temporary `LandingPage` stub: full-viewport dark bg + link “Open lab” to `/lab` + text “Made to hold.” so routing verifies before hero work.

**Step 4:** `npm run build` must pass. Manually: `/` stub, `/lab` sandbox.

**Step 5: Commit**

```bash
git add src/App.tsx src/lab/LabApp.tsx src/landing/LandingPage.tsx
git commit -m "feat: route landing at / and sandbox at /lab"
```

---

### Task 3: Lenis stub + printReveal helper

**Files:**
- Create: `src/landing/scroll/useLenis.ts`
- Create: `src/landing/scroll/printReveal.ts`

**Step 1: `useLenis`**

Hook that creates Lenis on mount, `requestAnimationFrame` loop, destroys on unmount. Return Lenis instance (optional). Call from `LandingPage` only.

**Step 2: `printReveal.ts`**

Export helpers:

```ts
/** 0 = fully hidden below, 1 = fully revealed. Rising print band. */
export function printProgress(t: number): number {
  return Math.min(1, Math.max(0, t))
}

/** Clip plane Y in world units given progress and object height. */
export function printClipY(progress: number, yMin: number, yMax: number): number {
  return yMin + (yMax - yMin) * printProgress(progress)
}
```

**Step 3: Commit**

```bash
git add src/landing/scroll
git commit -m "feat: add Lenis stub and print-reveal helpers"
```

---

### Task 4: Overture loader

**Files:**
- Create: `src/landing/Overture.tsx`

**Step 1:** DOM overlay:

- Full-screen `position: fixed`, z-index high, `background: var(--bg)`
- Simple SVG/CSS zellij-ish grid (6–12 tiles) that fades/scales with progress
- Mono counter: `${Math.round(progress * 100)}%` via drei `useProgress` — note: `useProgress` must run inside a Canvas **or** use a parent that mounts a hidden/warmup Canvas. Practical P1 pattern: Overture sits over Landing; progress comes from props driven by a Suspense boundary around Hero Canvas using `useProgress` in a child bridge, **or** fake timed progress 0→1 over ~1.2s while Hero mounts then snap to ready.

**Recommended P1:** combine timed ramp (min display ~800ms) with optional `useProgress` from a tiny bridge component inside Canvas; call `onDone()` when both `progress>=1` and min time elapsed. End copy: “Ready to hold.” then unmount/fade out.

**Step 2: Commit**

```bash
git add src/landing/Overture.tsx
git commit -m "feat: add Made to Hold overture loader"
```

---

### Task 5: Procedural HeroTrio + Hero canvas

**Files:**
- Create: `src/landing/scenes/HeroTrio.tsx`
- Create: `src/landing/Hero.tsx`
- Reuse: `src/canvas/Lighting.tsx`, `src/canvas/PostFX.tsx` (or a slim landing lighting subset)

**Step 1: `HeroTrio`**

Three grouped meshes on a turntable (`useFrame` slow Y rotation + optional `OrbitControls` makeDefault damped):

1. **Lithophane slab** — thin `boxGeometry`, bone `MeshPhysicalMaterial` (transmission ~0.2–0.4, thickness, roughness low)
2. **Zellij star** — simple extruded star / octahedron cluster, majorelle + terracotta materials
3. **Strava ribbon** — `CatmullRomCurve3` → `TubeGeometry`, matte PLA-like standard material (saffron-tint)

Apply `THREE.Plane` clipping: rising `clippingPlanes` on materials driven by `print` progress 0→1 over ~2s on mount (`maath` damp toward 1). Enable `gl.localClippingEnabled = true` in Canvas `onCreated`.

**Step 2: `Hero`**

```tsx
<Canvas
  shadows
  dpr={[1, 2]}
  camera={{ position: [2.2, 1.4, 3.2], fov: 40 }}
  gl={{ antialias: true, toneMapping: AgX, outputColorSpace: SRGB }}
  style={{ position: 'absolute', inset: 0 }}
  onCreated={({ gl }) => { gl.localClippingEnabled = true }}
>
  <color attach="background" args={[PALETTE.bg]} />
  <Suspense fallback={null}>
    <Lighting flags={{ ...studioDefaults }} />  {/* environment + key/fill; trim UI-only flags */}
    <HeroTrio />
    <ContactShadows or soft shadow as appropriate />
  </Suspense>
  <PostFX flags={{ n8ao: true, bloom: true, smaa: true, dof: false, ... }} />
  <OrbitControls enableDamping makeDefault />
</Canvas>
```

Use a **landing-specific light flag preset** (environment/key/fill on; area optional) — do not mount lab UI panels.

Progress bridge: child that calls `useProgress` and `onProgress(p)`.

**Step 3: Build**

`npm run build` — fix TS/clipping types.

**Step 4: Commit**

```bash
git add src/landing/Hero.tsx src/landing/scenes/HeroTrio.tsx
git commit -m "feat: add procedural hero trio with print reveal"
```

---

### Task 6: Assemble LandingPage

**Files:**
- Modify: `src/landing/LandingPage.tsx`
- Modify: `README.md` (routes note)
- Optional: `docs/architecture/project-overview.md` one-liner

**Step 1:** Compose:

- `useLenis()`
- State `showOverture` → false after `Overture` `onDone`
- Full-viewport relative container
- `<Hero onProgress={...} />` under overlay
- DOM: Clash/display *Made to hold.* bottom/center; muted scroll cue; small link to `/lab`
- Grain: optional CSS `opacity: 0.04` noise overlay (pseudo or SVG)

**Step 2:** Verify `/` and `/lab`. Build green.

**Step 3: Commit**

```bash
git add src/landing/LandingPage.tsx README.md
git commit -m "feat: assemble Made to Hold P1 landing page"
```

---

## Done when

- [ ] `/` loader → hero trio prints in + tagline
- [ ] `/lab` sandbox intact
- [ ] AgX + studio.hdr on hero; orbit drag works
- [ ] `npm run build` green
- [ ] No Path C / GSAP spine required
