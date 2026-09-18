/**
 * Made to Hold — brand tokens (rebrand: "The Print Line").
 *
 * Direction: near-black kiln dark, one electric structural blue (majorelle),
 * one hot extrusion orange (the nozzle), bone for type. Everything else is
 * temperature: the site is a machine that is currently printing.
 */
export const PALETTE = {
  /** Base canvas / 3D backdrop */
  ink: '#07070A',
  /** Raised plaster panels */
  inkRaised: '#111019',
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

/** Per-act accent, used by both DOM and 3D. */
export const ACT_ACCENT = {
  form: PALETTE.majorelleBright,
  effort: PALETTE.ember,
  light: PALETTE.amber,
  heritage: PALETTE.majorelle,
} as const
