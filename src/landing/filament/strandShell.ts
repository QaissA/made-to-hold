import * as THREE from 'three'
import { STRAND_SAMPLES as N } from './curves'

/**
 * An empty tube shell: N rings of `radialSegments` vertices carrying only
 * "where am I along the strand" and "where am I around it". Every real
 * coordinate is filled in by the vertex shader from the baked forms, so this
 * geometry is built once and never touched again.
 *
 * The ring seam is not duplicated — indices wrap — because there are no UVs to
 * split and the frame is continuous around the tube.
 */
export function buildStrandShell(radialSegments = 8): THREE.BufferGeometry {
  const rings = N
  const perRing = radialSegments
  const count = rings * perRing

  const position = new Float32Array(count * 3)
  const aU = new Float32Array(count)
  const aAngle = new Float32Array(count)

  for (let i = 0; i < rings; i++) {
    // Texel centre: the data textures are exactly N wide, sampled NEAREST.
    const u = (i + 0.5) / N
    for (let j = 0; j < perRing; j++) {
      const v = i * perRing + j
      aU[v] = u
      aAngle[v] = (j / perRing) * Math.PI * 2
    }
  }

  const indices = new Uint32Array((rings - 1) * perRing * 6)
  let k = 0
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < perRing; j++) {
      const jn = (j + 1) % perRing
      const a = i * perRing + j
      const b = i * perRing + jn
      const c = (i + 1) * perRing + j
      const d = (i + 1) * perRing + jn

      indices[k++] = a
      indices[k++] = c
      indices[k++] = b
      indices[k++] = b
      indices[k++] = c
      indices[k++] = d
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geometry.setAttribute('aU', new THREE.BufferAttribute(aU, 1))
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(aAngle, 1))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))

  // Positions are all zero on the CPU, so the derived bounds would be a point.
  // The caller sets a real radius; culling is off on the mesh regardless.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3)
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-3, -3, -3),
    new THREE.Vector3(3, 3, 3),
  )

  return geometry
}
