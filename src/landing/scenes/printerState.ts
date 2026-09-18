/** Live printer read-out, written by PrintBed and read by the gantry + lights. */
export const printer = {
  /** Current frontier height, 0-1 in relief space. */
  printY: 0,
  /** Nozzle position across the bed, 0-1 in UV space. */
  nozzleX: 0.5,
  /** Nozzle position along the bed, -0.5..0.5 in UV space. */
  nozzleZ: 0,
  /** 0 = cold and settled, 1 = actively extruding. */
  hot: 0,
}

/** Bed is a BED_SIZE square; relief is scaled by BED_AMP in world units. */
export const BED_SIZE = 3
export const BED_AMP = 0.62
