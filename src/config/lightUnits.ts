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
  n8ao: boolean
  bloom: boolean
  dof: boolean
  smaa: boolean
  reflectorFloor: boolean
}

export const DEFAULT_LIGHT_FLAGS: LightFlags = {
  environment: true,
  key: true,
  fill: true,
  rim: true,
  area: true,
  contactShadows: true,
  n8ao: true,
  bloom: true,
  dof: false,
  smaa: true,
  reflectorFloor: true,
}

export function isComposerActive(flags: LightFlags): boolean {
  return flags.n8ao || flags.bloom || flags.dof || flags.smaa
}
