export type NavMode = 'orbit' | 'walk'

export const DEFAULT_NAV_MODE: NavMode = 'orbit'

/** Eye height (Y) while walking. */
export const WALK_EYE_HEIGHT = 1.6

/** Base move speed (world units / second). */
export const WALK_SPEED = 3

/** Sprint multiplier when Shift is held. */
export const WALK_SPRINT_MULT = 1.75

export const NAV_TOGGLE_KEY = 'KeyF'
