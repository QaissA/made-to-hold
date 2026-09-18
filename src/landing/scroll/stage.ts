import type { StrandId } from '../filament/curves'

/**
 * The shared stage state.
 *
 * One mutable object read every frame by both the DOM HUD and the R3F scene.
 * Deliberately outside React: scroll writes to it ~60 times a second and none
 * of that should ever cost a render.
 */

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
  /** Smoothed absolute scroll speed, 0-1ish. Drives extrusion heat. */
  heat: number
  /** Pointer in NDC space, -1..1. */
  pointerX: number
  pointerY: number
  /** Act currently crossing viewport centre. */
  actId: ActId
  /** Progress through that act, 0-1. */
  actLocal: number
  /** Which form the strand should be holding. */
  strand: StrandId
  /** Metres laid so far. Monotonic — the spool only ever empties. */
  metres: number
  /** User asked for calm. */
  reduced: boolean
  /** Loader finished; extrusion may begin. */
  started: boolean
}

/** Filament on the reel. The whole page consumes most of it. */
export const SPOOL_METRES = 400

export const stage: Stage = {
  scroll: 0,
  heat: 0,
  pointerX: 0,
  pointerY: 0,
  actId: 'hero',
  actLocal: 0,
  strand: 'vase',
  metres: 0,
  reduced: false,
  started: false,
}

/**
 * Act -> anchor word + the form the strand takes.
 *
 * The run closes on `vase`: the page ends holding the object it opened by
 * making.
 */
export const ACTS: Record<ActId, { word: string; strand: StrandId }> = {
  overture: { word: 'Form', strand: 'vase' },
  hero: { word: 'Form', strand: 'vase' },
  manifesto: { word: 'Matter', strand: 'vase' },
  effort: { word: 'Effort', strand: 'route' },
  light: { word: 'Light', strand: 'portrait' },
  heritage: { word: 'Heritage', strand: 'knot' },
  craft: { word: 'Craft', strand: 'spool' },
  yours: { word: 'Yours', strand: 'vase' },
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}
