# Playbook: Path B — WebGPU + TSL

**Not the default.** Use when the user opts into WebGPU headroom (physical light units, compute, TSL GI nodes).

**Canon:** architecture §6 Path B

## When

- New greenfield comfort with newer APIs
- Need physically based light units / compute
- Effect ports available for your needs

## How (R3F)

- `Canvas` `gl` factory returning `WebGPURenderer`
- Prefer TSL nodes over one-off GLSL when extending materials
- Keep AgX / color-space rules identical to Path A
- Plan fallback: WebGPU → WebGL2 where required

## Do not

- Silently make WebGPU the project default without user approval
- Assume all `realism-effects` / postprocessing paths work unchanged — verify
