# Three.js agent skills

Project-local Three.js skills for Cursor (`.cursor/skills/`) and Claude Code (`.claude/skills/`).

## Source

The README in community mirrors still points at `https://github.com/pinkforest/threejs-playground.git`, but that repo is **not public** (clone returns 404). Skills were installed from the public mirror:

`https://github.com/CloudAI-X/threejs-skills`

Vendor checkout (ignored by git): `.vendor/threejs-skills`

## Skills

| Skill | Use when |
|---|---|
| `threejs-fundamentals` | Scene, camera, renderer, Object3D |
| `threejs-geometry` | Built-ins, BufferGeometry, instancing |
| `threejs-materials` | PBR / physical / shader materials |
| `threejs-lighting` | Lights, shadows, env lighting |
| `threejs-textures` | Maps, UVs, env maps, RTTs |
| `threejs-animation` | Keyframes, skeletal, morphs |
| `threejs-loaders` | GLTF/GLB, textures, async load |
| `threejs-shaders` | GLSL, ShaderMaterial |
| `threejs-postprocessing` | EffectComposer, bloom, DOF |
| `threejs-interaction` | Raycast, controls, picking |

## Precedence

**This repo’s canon wins** over generic Three.js skill advice:

1. `docs/architecture/eevee-parity.md` + `AGENTS.md`
2. Path A default (WebGL2 + AgX + screen-space) — not Path B/C unless asked
3. `.cursor/rules/*` for matching files

Skills fill API/pattern gaps; they must not override AgX, Path A, or known-gaps honesty.

## Refresh

```bash
git -C .vendor/threejs-skills pull
# then re-copy skills/* into .cursor/skills and .claude/skills
```
