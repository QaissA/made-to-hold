import * as THREE from 'three'

/**
 * The print-bed material — the signature of the rebrand.
 *
 * A patched MeshStandardMaterial (so it keeps PBR + IBL + AgX, per canon) whose
 * surface is displaced by a relief height map *clamped to a rising print
 * frontier*. Below the frontier the object exists at full relief; above it the
 * surface is a flat plateau — exactly how FDM lays a part down. The contour
 * where the relief crosses the frontier is the hot extrusion line.
 *
 * Two plates are always bound so one can dissolve into the next (uMix), which
 * is how the site re-prints between acts without ever cutting away.
 */

export type BedUniforms = {
  uHeightA: THREE.IUniform<THREE.Texture | null>
  uHeightB: THREE.IUniform<THREE.Texture | null>
  uAlbedoA: THREE.IUniform<THREE.Texture | null>
  uAlbedoB: THREE.IUniform<THREE.Texture | null>
  uMix: THREE.IUniform<number>
  uPrintY: THREE.IUniform<number>
  uAmp: THREE.IUniform<number>
  uNormalStrength: THREE.IUniform<number>
  uTexel: THREE.IUniform<number>
  uBand: THREE.IUniform<number>
  uHot: THREE.IUniform<number>
  uHotColor: THREE.IUniform<THREE.Color>
  uLayerFreq: THREE.IUniform<number>
  uNozzleX: THREE.IUniform<number>
}

const VERT_HEAD = /* glsl */ `
uniform sampler2D uHeightA;
uniform sampler2D uHeightB;
uniform float uMix;
uniform float uPrintY;
uniform float uAmp;
uniform float uNormalStrength;
uniform float uTexel;
varying vec2 vBedUv;
varying float vRelief;
varying float vLaid;

float bedRelief( vec2 p ) {
  return mix( texture2D( uHeightA, p ).r, texture2D( uHeightB, p ).r, uMix );
}

float bedLaid( vec2 p ) {
  return min( bedRelief( p ), uPrintY );
}
`

const VERT_NORMAL = /* glsl */ `
  float hL = bedLaid( uv - vec2( uTexel, 0.0 ) );
  float hR = bedLaid( uv + vec2( uTexel, 0.0 ) );
  float hD = bedLaid( uv - vec2( 0.0, uTexel ) );
  float hU = bedLaid( uv + vec2( 0.0, uTexel ) );
  vec3 objectNormal = normalize( vec3(
    ( hL - hR ) * uNormalStrength,
    ( hD - hU ) * uNormalStrength,
    1.0
  ) );
`

const VERT_BEGIN = /* glsl */ `
  vBedUv = uv;
  vRelief = bedRelief( uv );
  vLaid = min( vRelief, uPrintY );
  vec3 transformed = vec3( position );
  transformed.z += vLaid * uAmp;
`

const FRAG_HEAD = /* glsl */ `
uniform sampler2D uAlbedoA;
uniform sampler2D uAlbedoB;
uniform float uMix;
uniform float uPrintY;
uniform float uBand;
uniform float uHot;
uniform vec3 uHotColor;
uniform float uLayerFreq;
uniform float uNozzleX;
varying vec2 vBedUv;
varying float vRelief;
varying float vLaid;
`

const FRAG_ALBEDO = /* glsl */ `
  vec3 plateA = texture2D( uAlbedoA, vBedUv ).rgb;
  vec3 plateB = texture2D( uAlbedoB, vBedUv ).rgb;
  diffuseColor.rgb *= mix( plateA, plateB, uMix );
`

/** Anisotropic layer striation — the tactile FDM tell. */
const FRAG_ROUGHNESS = /* glsl */ `
  float layer = fract( vLaid * uLayerFreq );
  float ridge = abs( layer - 0.5 ) * 2.0;
  roughnessFactor = clamp( roughnessFactor * ( 0.88 + ridge * 0.22 ), 0.05, 1.0 );
`

const FRAG_EMISSIVE = /* glsl */ `
  float live = step( 0.004, uPrintY ) * step( uPrintY, 0.999 );

  // The extrusion perimeter: the contour where relief meets the frontier.
  float contour = 1.0 - smoothstep( 0.0, uBand, abs( vRelief - uPrintY ) );

  // The freshly laid plateau still radiating heat.
  float plateau = step( uPrintY, vRelief ) * 0.022;

  // Nozzle sweep — a bright pass raking across the bed as it lays.
  float sweep = 1.0 - smoothstep( 0.0, 0.09, abs( vBedUv.x - uNozzleX ) );

  float heat = ( contour * ( 1.0 + sweep * 1.6 ) + plateau ) * live * uHot;
  totalEmissiveRadiance += uHotColor * heat;
`

export function createBedMaterial(): {
  material: THREE.MeshStandardMaterial
  uniforms: BedUniforms
} {
  const uniforms: BedUniforms = {
    uHeightA: { value: null },
    uHeightB: { value: null },
    uAlbedoA: { value: null },
    uAlbedoB: { value: null },
    uMix: { value: 0 },
    uPrintY: { value: 0 },
    uAmp: { value: 0.62 },
    uNormalStrength: { value: 26 },
    uTexel: { value: 1 / 512 },
    uBand: { value: 0.022 },
    uHot: { value: 1 },
    uHotColor: { value: new THREE.Color('#ff6a2b') },
    uLayerFreq: { value: 118 },
    uNozzleX: { value: 0.5 },
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    // Satin PEI sheet: a glossier value blows out to white at grazing angles.
    roughness: 0.8,
    metalness: 0.02,
  })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)

    shader.vertexShader = VERT_HEAD + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      VERT_NORMAL,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      VERT_BEGIN,
    )

    shader.fragmentShader = FRAG_HEAD + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      '#include <map_fragment>\n' + FRAG_ALBEDO,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\n' + FRAG_ROUGHNESS,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n' + FRAG_EMISSIVE,
    )
  }

  material.customProgramCacheKey = () => 'mth-print-bed-v1'

  return { material, uniforms }
}
