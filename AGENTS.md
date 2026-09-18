# Agent guide — Eevee-parity R3F

## Non-negotiables

1. **Path A is default** (WebGL2 raster + screen-space). Do not switch the interactive viewport to Path B or C unless the user asks.
2. **Color foundation first** — `THREE.AgXToneMapping`, `outputColorSpace = SRGBColorSpace`, correct texture `colorSpace`. See `docs/playbooks/color-foundation.md`.
3. **Canon** — `docs/architecture/eevee-parity.md` wins on conflicts. Update playbooks/rules to match; do not silently diverge.
4. **Rules** — follow `.cursor/rules/` when editing matching files. Always-on: `project-render-stack.mdc`.
5. **Three.js skills** — project skills in `.cursor/skills/` (`threejs-*`). Use for API/patterns; **canon + Path A still win**. See `docs/reference/threejs-skills.md`.

## What to open

| Task | Open |
|---|---|
| Any render/look work | `docs/playbooks/color-foundation.md` first |
| Canvas / renderer config | `docs/playbooks/color-foundation.md` + rule `canvas-scene.mdc` |
| Lights / shadows | `docs/playbooks/lighting-shadows.md` + `lighting.mdc` |
| Materials / glTF | `docs/playbooks/color-foundation.md` (textures) + `materials.mdc` |
| GI / AO | `docs/playbooks/gi-ao.md` |
| Post / bloom / DOF / AA | `docs/playbooks/post-aa.md` + `postfx.mdc` |
| WebGPU / TSL | `docs/playbooks/path-b-webgpu.md` + `webgpu-tsl.mdc` |
| Pathtracer / hero still | `docs/playbooks/path-c-pathtracer.md` + `pathtracer.mdc` |
| Stakeholder honesty | `docs/reference/known-gaps.md` |
| A/B vs Blender | `docs/reference/parity-checklist.md` |
| Three.js API skills | `.cursor/skills/threejs-*` + `docs/reference/threejs-skills.md` |

## Out of scope unless asked

- Inventing a different tone mapper than AgX for “Blender default” matches
- Claiming true SSS or RectAreaLight shadows exist in Three.js
- Making path tracing the realtime default
