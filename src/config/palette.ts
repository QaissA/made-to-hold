/**
 * Made to Hold — brand tokens (light theme: "Daylight Studio").
 *
 * The page is paper. The filament is the dark thing lying on it. Everything
 * here depends on that inversion: heat still reads as heat because it is
 * emissive and saturated, but *settled* filament has to be graphite, not bone,
 * or it disappears into the ground it is sitting on.
 */
export const PALETTE = {
  /** Page ground — warm off-white */
  paper: '#F2EDE3',
  /** Raised panels, cards */
  paperRaised: '#FBF8F2',
  /** Primary text */
  ink: '#0B0C12',
  /** Secondary text */
  muted: '#6D6A78',

  /** Structural accent — zellij, frame, cold light */
  majorelle: '#3B2FE8',
  majorelleBright: '#5646FF',
  /** Hot extrusion — fills, the nozzle, the CTA */
  ember: '#FF6A2B',
  /** Ember deep enough to stay legible as text on paper */
  emberInk: '#C2410C',
  /** Cooling filament */
  amber: '#FFB45C',
  /** Amber deep enough to stay legible as text on paper */
  amberInk: '#B47216',
  /** Tertiary heritage green */
  jade: '#1F6E5C',
} as const

/**
 * The 3D set: a photographic sweep rather than a void. Paper everywhere,
 * deepening below so the subject has something to stand on, with a cool grey
 * wash behind it. Scene fog matches `horizon` so the ground has no visible edge.
 */
export const BACKDROP = {
  zenith: '#F8F5EF',
  horizon: '#F2EDE3',
  floor: '#CFC7B8',
  /** Mixed toward, not added — on paper that reads as soft shadow. */
  pool: '#E3DDD2',
} as const

/**
 * Filament colour by age, hottest first. Inverted from a dark ground: a
 * finished print lands on graphite so it reads as an object, and only
 * genuinely molten filament is bright.
 */
export const STRAND_TEMP = {
  hot: '#FF5A1F',
  warm: '#D2691E',
  /** Where a settled print ends up */
  settled: '#17181F',
  /** The oldest windings, cooled furthest */
  cold: '#0C0D13',
} as const

/** Per-act accent, used by both DOM and 3D. */
export const ACT_ACCENT = {
  form: PALETTE.majorelle,
  effort: PALETTE.ember,
  light: PALETTE.amberInk,
  heritage: PALETTE.majorelle,
} as const
