# Playbook: Path C — GPU pathtracer (hero stills)

**Not realtime default.** Progressive path tracing for hero / “final quality” stills; can exceed Eevee (closer to Cycles).

**Canon:** architecture §6 Path C  
**Lib:** `three-gpu-pathtracer`

## When

- User requests hero render / still export
- Same Three.js scene graph as Path A viewport

## How

- Keep interactive viewport on Path A
- Toggle or route `src/render/PathtraceMode` for progressive accumulate
- Share materials/lights/HDRI; expect longer converge time

## Do not

- Replace the interactive canvas with path tracing by default
- Promise realtime path-traced complex scenes
