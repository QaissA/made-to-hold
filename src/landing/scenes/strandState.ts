import * as THREE from 'three'

/** Live extruder read-out, written by Strand and read by the head + the HUD. */
export const extruder = {
  /** Local-space position of the print head on the strand. */
  head: new THREE.Vector3(),
  /** Head position along the strand, 0-1. */
  front: 0,
  /** 0 = settled, 1 = actively re-forming. */
  melt: 0,
  /** Nozzle temperature for the read-out. */
  temp: 198,
  /** True while the user is holding the object. */
  held: false,
}
