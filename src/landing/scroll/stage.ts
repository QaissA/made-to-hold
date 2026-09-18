/**
 * The shared stage state.
 *
 * One mutable object read every frame by both the DOM HUD and the R3F scene.
 * Deliberately outside React: scroll drives ~60 writes/second and nothing here
 * should ever trigger a re-render.
 */

export type PlateId = 'route' | 'face' | 'zellij'

export type ActId =
  | 'overture'
  | 'hero'
  | 'manifesto'
  | 'effort'
  | 'light'
  | 'heritage'
  | 'craft'
  | 'yours'

export type Stage = {
  /** Whole-document scroll progress, 0-1. */
  scroll: number
  /** Smoothed absolute scroll speed, 0-1ish. Drives nozzle heat. */
  heat: number
  /** Pointer in NDC-ish space, -1..1. */
  pointerX: number
  pointerY: number
  /** Act currently crossing viewport centre. */
  actId: ActId
  /** Progress through that act, 0-1. */
  actLocal: number
  /** Which relief the bed should be printing. */
  plate: PlateId
  /** Simulated layer counter for the HUD. */
  layer: number
  /** User asked for calm. */
  reduced: boolean
  /** Loader finished; the stage may start printing. */
  started: boolean
}

export const LAYER_TOTAL = 1284

export const stage: Stage = {
  scroll: 0,
  heat: 0,
  pointerX: 0,
  pointerY: 0,
  actId: 'hero',
  actLocal: 0,
  plate: 'route',
  layer: 0,
  reduced: false,
  started: false,
}

/** Act -> anchor word shown in the rail, and the plate the bed holds. */
export const ACTS: Record<ActId, { word: string; plate: PlateId }> = {
  overture: { word: 'Form', plate: 'route' },
  hero: { word: 'Form', plate: 'route' },
  manifesto: { word: 'Matter', plate: 'route' },
  effort: { word: 'Effort', plate: 'route' },
  light: { word: 'Light', plate: 'face' },
  heritage: { word: 'Heritage', plate: 'zellij' },
  craft: { word: 'Craft', plate: 'zellij' },
  yours: { word: 'Yours', plate: 'zellij' },
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}
