import { Center, useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Mesh } from 'three'

const MODEL_URL = '/models/DamagedHelmet.glb'

export function DamagedHelmet() {
  const { scene } = useGLTF(MODEL_URL)
  const clone = useMemo(() => scene.clone(true), [scene])

  useMemo(() => {
    clone.traverse((obj) => {
      const mesh = obj as Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [clone])

  return (
    <Center position={[0, 0.75, 0]}>
      <primitive object={clone} scale={0.85} />
    </Center>
  )
}

useGLTF.preload(MODEL_URL)
