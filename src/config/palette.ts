/**
 * Made to Hold — brand tokens (rebrand: "The Print Line").
 *
 * Direction: near-black kiln dark, one electric structural blue (majorelle),
 * one hot extrusion orange (the nozzle), bone for type. Everything else is
 * temperature: the site is a machine that is currently printing.
 */
export const PALETTE = {
  /** Base canvas — a cool blue-black, so warm filament always reads warm */
  ink: '#05070E',
  /** Raised panels */
  inkRaised: '#0D1120',
  /** Structural accent — zellij, frame, cold light */
  majorelle: '#3B2FE8',
  majorelleBright: '#6B5BFF',
  /** Hot extrusion — nozzle, CTA, the print frontier */
  ember: '#FF6A2B',
  /** Cooling filament / lithophane glow */
  amber: '#FFB45C',
  /** Tertiary heritage green */
  jade: '#1F6E5C',
  /** Primary text */
  bone: '#F2EDE3',
  /** Secondary text */
  muted: '#8E8A9C',
} as const

/**
 * The 3D atmosphere. Cold indigo so the ember strand has something to
 * separate from; the scene fog matches `horizon` so the ground dissolves
 * into the backdrop instead of ending at a visible edge.
 */
export const BACKDROP = {
  zenith: '#03040A',
  horizon: '#090D22',
  floor: '#020308',
  glow: '#1A2358',
} as const

/** Per-act accent, used by both DOM and 3D. */
export const ACT_ACCENT = {
  form: PALETTE.majorelleBright,
  effort: PALETTE.ember,
  light: PALETTE.amber,
  heritage: PALETTE.majorelle,
} as const
