import { Environment } from '@react-three/drei'
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import {
  DEFAULT_LIGHT_FLAGS,
  KEY_SHADOW,
  LIGHT,
  type LightFlags,
} from '../config/lightUnits'

let areaReady = false
function ensureAreaLights() {
  if (!areaReady) {
    RectAreaLightUniformsLib.init()
    areaReady = true
  }
}

const AREA_TARGET = new THREE.Vector3(0, 0.75, 0)

export function Lighting({
  flags = DEFAULT_LIGHT_FLAGS,
}: {
  flags?: LightFlags
}) {
  const areaRef = useRef<THREE.RectAreaLight>(null)

  useLayoutEffect(() => {
    ensureAreaLights()
  }, [])

  useLayoutEffect(() => {
    areaRef.current?.lookAt(AREA_TARGET)
  }, [flags.area])

  return (
    <>
      {flags.environment && (
        <Environment
          files="/hdri/studio.hdr"
          environmentIntensity={LIGHT.env}
        />
      )}

      {flags.key && (
        <directionalLight
          castShadow
          intensity={LIGHT.key}
          position={[4, 6, 2]}
          shadow-mapSize-width={KEY_SHADOW.mapSize}
          shadow-mapSize-height={KEY_SHADOW.mapSize}
          shadow-bias={KEY_SHADOW.bias}
          shadow-normalBias={KEY_SHADOW.normalBias}
          shadow-camera-near={KEY_SHADOW.cameraNear}
          shadow-camera-far={KEY_SHADOW.cameraFar}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
      )}

      {flags.fill && (
        <directionalLight intensity={LIGHT.fill} position={[-3, 2, -1]} />
      )}

      {flags.rim && (
        <directionalLight intensity={LIGHT.rim} position={[-2, 3, -4]} />
      )}

      {flags.area && (
        <group position={[0, 2.5, 2]}>
          {/* LTC shading — no native shadows in Three.js */}
          <rectAreaLight
            ref={areaRef}
            width={2}
            height={1}
            intensity={LIGHT.area}
            color="#ffffff"
          />
          {/*
            Gap 1 mitigation: hidden spot proxy carries the shadow map.
            Keep intensity modest so the RectAreaLight look dominates.
          */}
          <spotLight
            castShadow
            intensity={LIGHT.areaShadowProxy}
            angle={0.55}
            penumbra={0.6}
            distance={12}
            position={[0, 0, 0]}
            shadow-mapSize-width={KEY_SHADOW.mapSize}
            shadow-mapSize-height={KEY_SHADOW.mapSize}
            shadow-bias={KEY_SHADOW.bias}
            shadow-normalBias={KEY_SHADOW.normalBias}
          >
            {/* World (0, 0.75, 0) in local space of group at (0, 2.5, 2) */}
            <object3D attach="target" position={[0, -1.75, -2]} />
          </spotLight>
        </group>
      )}
    </>
  )
}
