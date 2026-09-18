import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BACKDROP } from '../../config/palette'
import { stage } from '../scroll/stage'

/**
 * The room the strand hangs in.
 *
 * A flat black background gives the object nothing to sit against and makes
 * the whole page read as a cutout. This is a cool indigo atmosphere instead:
 * a vertical gradient with a slow-drifting glow pool low behind the subject,
 * so warm filament always has a cold ground to separate from.
 *
 * Deliberately unlit and unfogged — it IS the far distance. Scene fog is set
 * to the horizon colour so the ground plane dissolves into it seamlessly.
 */

const VERT = /* glsl */ `
varying vec3 vDir;

void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uFloor;
uniform vec3 uGlow;
uniform vec3 uGlowDir;
uniform float uGlowStrength;
uniform float uTime;

varying vec3 vDir;

void main() {
  vec3 d = normalize( vDir );

  // Vertical gradient. The indigo sits in a narrow band at the horizon and
  // falls away fast in both directions — this is a dark room with a lit wall
  // behind the subject, not a sky.
  float h = d.y;
  vec3 col = mix( uHorizon, uFloor, smoothstep( -0.02, -0.4, h ) );
  col = mix( col, uZenith, smoothstep( 0.0, 0.42, h ) );

  // A pool of cold light washing the wall BEHIND and slightly above the
  // subject. Kept off the horizon line itself so the ground plane joins the
  // backdrop invisibly instead of silhouetting against a bright band.
  float drift = sin( uTime * 0.05 ) * 0.35;
  vec3 dir = normalize( vec3( uGlowDir.x + drift, 0.0, uGlowDir.z ) );
  float azimuth = dot( normalize( vec3( d.x, 0.0, d.z ) ), dir );
  float band = exp( -abs( h - 0.14 ) * 5.5 );
  col += uGlow * pow( max( azimuth, 0.0 ), 5.0 ) * band * uGlowStrength;

  // Ordered dithering: these values are dark enough to band badly on 8-bit.
  float dither = fract( sin( dot( gl_FragCoord.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
  col += ( dither - 0.5 ) * 0.0022;

  gl_FragColor = vec4( col, 1.0 );
}
`

export function Backdrop() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color(BACKDROP.zenith) },
      uHorizon: { value: new THREE.Color(BACKDROP.horizon) },
      uFloor: { value: new THREE.Color(BACKDROP.floor) },
      uGlow: { value: new THREE.Color(BACKDROP.glow) },
      uGlowDir: { value: new THREE.Vector3(-0.55, 0, -0.84).normalize() },
      uGlowStrength: { value: 0.75 },
      uTime: { value: 0 },
    }),
    [],
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(34, 32, 24), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    uniforms.uTime.value = stage.reduced ? 0 : state.clock.elapsedTime
    if (matRef.current) matRef.current.uniformsNeedUpdate = true
  })

  return (
    <mesh geometry={geometry} renderOrder={-1} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  )
}
