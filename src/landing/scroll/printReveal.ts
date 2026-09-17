/** 0 = fully hidden below, 1 = fully revealed. Rising print band. */
export function printProgress(t: number): number {
  return Math.min(1, Math.max(0, t))
}

/** Clip plane Y in world units given progress and object height. */
export function printClipY(progress: number, yMin: number, yMax: number): number {
  return yMin + (yMax - yMin) * printProgress(progress)
}
