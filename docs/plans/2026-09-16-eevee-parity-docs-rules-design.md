# Eevee-Parity Docs & Cursor Rules — Design

**Date:** 2026-09-16  
**Status:** Approved  
**Scope:** Documentation + agent rules only (no R3F app scaffold)

---

## Decisions

| Topic | Choice |
|---|---|
| Audience | Both: human reference docs + Cursor agent guardrails |
| Render paths | All three documented; **Path A default**; B = migration; C = hero stills |
| Doc depth | Split + condensed: full architecture archive + short day-to-day playbooks |
| Rule scope | Layered: always-on project rule + file-scoped rules |
| Done criteria | Docs + rules + root `AGENTS.md` entry point |

**Approach:** Mirror tree (Approach B) — `AGENTS.md` routes → `docs/` for humans → `.cursor/rules/` for non-negotiables.

---

## Document map

| Artifact | Role |
|---|---|
| `AGENTS.md` | Agent entry: which doc/rule to open; Path A default; color foundation first |
| `README.md` | Human one-pager: goal, stack, links into `docs/` |
| `docs/architecture/eevee-parity.md` | Full architecture v1.0 (canon) |
| `docs/playbooks/color-foundation.md` | Phase 1 checklist |
| `docs/playbooks/lighting-shadows.md` | Lights, area-light shadow proxies, bias/mapSize |
| `docs/playbooks/gi-ao.md` | IBL → SSGI → lightmaps decision tree |
| `docs/playbooks/post-aa.md` | Pass order: N8AO → SSGI/SSR → Bloom → DOF → TRAA |
| `docs/playbooks/path-b-webgpu.md` | Path B migration notes (not default) |
| `docs/playbooks/path-c-pathtracer.md` | Path C hero mode when/how |
| `docs/reference/parity-checklist.md` | Side-by-side A/B validation |
| `docs/reference/known-gaps.md` | Four gaps + mitigations |

---

## Cursor rules

### Always apply

- `project-render-stack.mdc` — Path A default; AgX + `SRGBColorSpace`; pin `realism-effects`; point to `AGENTS.md` / docs; do not treat Path B/C as default

### File-scoped

| Rule | Globs | Focus |
|---|---|---|
| `canvas-scene.mdc` | `src/canvas/**` | Canvas `gl` tone mapping/output; soft shadows; dpr; no double gamma |
| `lighting.mdc` | `src/canvas/Lighting*`, `src/**/light*` | Same HDRI; RectAreaLight + shadow proxy; mapSize/bias |
| `materials.mdc` | `src/materials/**`, `**/*Material*` | Principled → Physical; texture colorSpace; glTF KHR |
| `postfx.mdc` | `src/canvas/PostFX*`, `src/**/post*` | Effect pass order; single output encoding |
| `pathtracer.mdc` | `src/render/**` | Path C hero/stills only |
| `webgpu-tsl.mdc` | `src/**/*webgpu*`, `src/**/*tsl*` | Path B conventions when those files exist |

Rules: concise (<50 lines), actionable, ✅/❌ snippets. Long explanation stays in `docs/`.

---

## Ownership

1. Architecture narrative → `docs/architecture/eevee-parity.md` (wins on conflict until updated)
2. Day-to-day steps → playbooks (must not contradict architecture)
3. Non-negotiable agent behavior → `.cursor/rules/` (cite playbooks; do not restate the essay)
4. Routing only → `AGENTS.md` (no duplicate policy)

---

## Out of scope (this pass)

- App scaffold (`package.json`, Canvas, components)
- Installing three / R3F / postprocessing
- Sample glTF / HDRI assets or A/B screenshot fixtures

---

## Next step

Implementation plan: `docs/plans/2026-09-16-eevee-parity-docs-rules.md`
