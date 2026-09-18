/**
 * What the stage is showing. These are the studio's actual products, not
 * abstractions of them — a visitor has to be able to tell what we make from
 * the object alone.
 */
export type ProductId = 'printer' | 'route' | 'lithophane' | 'zellij'

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
  /** Which product the stage should be showing. */
  product: ProductId
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
  product: 'printer',
  metres: 0,
  reduced: false,
  started: false,
}

/**
 * Act -> anchor word + the product on the stage.
 *
 * The run opens and closes on the machine: the page ends at the thing that
 * made everything you just scrolled past.
 */
export const ACTS: Record<ActId, { word: string; product: ProductId }> = {
  overture: { word: 'Form', product: 'printer' },
  hero: { word: 'Form', product: 'printer' },
  manifesto: { word: 'Matter', product: 'printer' },
  effort: { word: 'Effort', product: 'route' },
  light: { word: 'Light', product: 'lithophane' },
  heritage: { word: 'Heritage', product: 'zellij' },
  craft: { word: 'Craft', product: 'printer' },
  yours: { word: 'Yours', product: 'zellij' },
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}
