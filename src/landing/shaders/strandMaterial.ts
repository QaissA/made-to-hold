import * as THREE from 'three'

/**
 * The strand material — v2's signature.
 *
 * The tube exists only in the vertex shader. A shell of empty rings carries
 * two attributes (position along the strand, angle around it); everything else
 * — centre, radius, frame — is read from baked data textures. So the filament
 * can become a vase, a route, a face or a knot with no geometry rebuild and,
 * more importantly, without ever being cut.
 *
 * Re-forming is a travelling wave, not a cross-fade: `uFront` sweeps along the
 * strand, everything behind it has already become the new shape, everything
 * ahead is still the old one, and a molten band rides the boundary. You watch
 * the line re-lay itself end to end.
 *
 * Colour is temperature. Distance *behind the print head* drives a ramp from
 * white-hot through ember and bone to cold blue, so the strand wears its own
 * history: you can see the order in which it was laid down.
 *
 * Patched MeshStandardMaterial rather than a raw ShaderMaterial so the scene
 * keeps PBR + IBL + AgX per project canon.
 */

export type StrandUniforms = {
  uPos: THREE.IUniform<THREE.Texture | null>
  uNrm: THREE.IUniform<THREE.Texture | null>
  uBin: THREE.IUniform<THREE.Texture | null>
  /** Texture-V of the settled form and the one it is becoming. */
  uRowA: THREE.IUniform<number>
  uRowB: THREE.IUniform<number>
  /** Re-forming wavefront along the strand, 0-1. */
  uFront: THREE.IUniform<number>
  /** Gate: 0 when settled, 1 while a re-form is running. */
  uMorphing: THREE.IUniform<number>
  /** How violently the molten band swells. */
  uMeltAmp: THREE.IUniform<number>
  /** Print head position along the strand for the first lay-down, 0-1. */
  uDraw: THREE.IUniform<number>
  /** Local-space position of the head, where undrawn rings collapse. */
  uHeadPos: THREE.IUniform<THREE.Vector3>
  uRadius: THREE.IUniform<number>
  /** Local-space point the pointer is warming, and how hard. */
  uTouch: THREE.IUniform<THREE.Vector3>
  uTouchStrength: THREE.IUniform<number>
  /** 0 = still showing print heat, 1 = fully cooled to one colour. */
  uCool: THREE.IUniform<number>
  uTime: THREE.IUniform<number>
  uHot: THREE.IUniform<THREE.Color>
  uWarm: THREE.IUniform<THREE.Color>
  uBone: THREE.IUniform<THREE.Color>
  uCold: THREE.IUniform<THREE.Color>
}

const SHARED_DECLS = /* glsl */ `
uniform sampler2D uPos;
uniform sampler2D uNrm;
uniform sampler2D uBin;
uniform float uRowA;
uniform float uRowB;
uniform float uFront;
uniform float uMorphing;
uniform float uMeltAmp;
uniform float uDraw;
uniform vec3 uHeadPos;
uniform float uRadius;
uniform vec3 uTouch;
uniform float uTouchStrength;
uniform float uTime;

attribute float aU;
attribute float aAngle;

varying float vAge;
varying float vMelt;
varying float vTouch;
varying float vDrawn;
`

/**
 * Shared ring reconstruction. Both the lit pass and the depth pass run this so
 * they displace identically — otherwise self-shadows would be cast from an
 * undisplaced shell collapsed at the origin.
 */
const RING = /* glsl */ `
  vec2 uvA = vec2( aU, uRowA );
  vec2 uvB = vec2( aU, uRowB );

  // Everything behind the wavefront has already re-formed.
  float m = uMorphing * ( 1.0 - smoothstep( uFront - 0.10, uFront + 0.02, aU ) );

  vec4 pA = texture2D( uPos, uvA );
  vec4 pB = texture2D( uPos, uvB );

  vec3 centre = mix( pA.xyz, pB.xyz, m );
  float rad = mix( pA.w, pB.w, m ) * uRadius;

  vec3 nrm = normalize( mix( texture2D( uNrm, uvA ).xyz, texture2D( uNrm, uvB ).xyz, m ) );
  vec3 bin = mix( texture2D( uBin, uvA ).xyz, texture2D( uBin, uvB ).xyz, m );
  // Mixing two frames can collapse them toward each other; re-orthogonalise so
  // the ring never degenerates mid-morph.
  bin = normalize( bin - nrm * dot( bin, nrm ) );

  // The molten band riding the wavefront.
  float melt = exp( -abs( aU - uFront ) * 26.0 ) * uMorphing * uMeltAmp;
  rad *= 1.0 + melt * 0.9;
  centre += nrm * sin( aU * 210.0 + uTime * 2.6 ) * melt * 0.03;

  // Local warmth under the pointer — the filament softens where you touch it.
  float touch = exp( -distance( centre, uTouch ) * 4.5 ) * uTouchStrength;
  rad *= 1.0 + touch * 0.5;

  // Everything ahead of the print head has not been extruded yet.
  float drawn = 1.0 - smoothstep( uDraw - 0.004, uDraw, aU );
  centre = mix( uHeadPos, centre, drawn );
  rad *= drawn;

  vec3 ringDir = nrm * cos( aAngle ) + bin * sin( aAngle );
  vec3 strandPos = centre + ringDir * rad;

  // Age is measured from whichever head last passed this point. Filament the
  // wave has already remade is young again; filament ahead of the wave keeps
  // the age it had, so only the part that has actually been re-melted glows.
  float ageDraw = clamp( uDraw - aU, 0.0, 1.0 );
  float behind = step( aU, uFront );
  float ageWave = mix( ageDraw, clamp( uFront - aU, 0.0, 1.0 ), behind );
  vAge = mix( ageDraw, ageWave, uMorphing );
  vMelt = melt;
  vTouch = touch;
  vDrawn = drawn;
`

const FRAG_DECLS = /* glsl */ `
uniform vec3 uHot;
uniform vec3 uWarm;
uniform vec3 uBone;
uniform vec3 uCold;
uniform float uCool;

varying float vAge;
varying float vMelt;
varying float vTouch;
varying float vDrawn;

/** Extrusion temperature as a function of how long ago it was laid down. */
vec3 strandTemperature( float age ) {
  vec3 c = mix( uHot, uWarm, smoothstep( 0.0, 0.05, age ) );
  c = mix( c, uBone, smoothstep( 0.04, 0.22, age ) );
  c = mix( c, uCold, smoothstep( 0.3, 0.9, age ) );
  return c;
}
`

const FRAG_ALBEDO = /* glsl */ `
  // A settled print is one colour. Heat is a transient of making it, so the
  // ramp fades out once the strand stops moving — which also stops the colour
  // gradient from fighting forms that carry an image in their own thickness.
  diffuseColor.rgb *= mix( strandTemperature( vAge ), uBone, uCool );
`

const FRAG_EMISSIVE = /* glsl */ `
  // Only freshly extruded filament genuinely glows; the rest is lit.
  float glow = exp( -vAge * 34.0 );
  vec3 heat = uHot * glow * 2.4 * ( 1.0 - uCool );
  heat += uWarm * vMelt * 2.2;
  heat += uWarm * vTouch * 1.5;
  totalEmissiveRadiance += heat * vDrawn;
`

export function createStrandMaterial(): {
  material: THREE.MeshStandardMaterial
  depthMaterial: THREE.MeshDepthMaterial
  uniforms: StrandUniforms
} {
  const uniforms: StrandUniforms = {
    uPos: { value: null },
    uNrm: { value: null },
    uBin: { value: null },
    uRowA: { value: 0.1 },
    uRowB: { value: 0.1 },
    uFront: { value: 0 },
    uMorphing: { value: 0 },
    uMeltAmp: { value: 1 },
    uDraw: { value: 0 },
    uHeadPos: { value: new THREE.Vector3() },
    uRadius: { value: 1 },
    uTouch: { value: new THREE.Vector3(999, 999, 999) },
    uTouchStrength: { value: 0 },
    uCool: { value: 0 },
    uTime: { value: 0 },
    uHot: { value: new THREE.Color('#FF6A2B') },
    uWarm: { value: new THREE.Color('#FFB45C') },
    uBone: { value: new THREE.Color('#D8D2C6') },
    uCold: { value: new THREE.Color('#4238A8') },
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.05,
  })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)

    shader.vertexShader = SHARED_DECLS + shader.vertexShader
    // The ring must be built here: <defaultnormal_vertex> consumes
    // objectNormal before <begin_vertex> runs.
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      RING + '\n  vec3 objectNormal = ringDir;',
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '  vec3 transformed = strandPos;',
    )

    shader.fragmentShader = FRAG_DECLS + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      '#include <map_fragment>\n' + FRAG_ALBEDO,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n' + FRAG_EMISSIVE,
    )
  }

  material.customProgramCacheKey = () => 'mth-strand-v2'

  // The shadow pass has to displace the same way.
  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  })

  depthMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = SHARED_DECLS + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      RING + '\n  vec3 transformed = strandPos;',
    )
  }

  depthMaterial.customProgramCacheKey = () => 'mth-strand-depth-v2'

  return { material, depthMaterial, uniforms }
}
