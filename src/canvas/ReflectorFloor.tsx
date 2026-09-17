import { MeshReflectorMaterial } from '@react-three/drei'
import { REFERENCE_ALBEDO } from '../config/color'

export function ReflectorFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={0.85}
        roughness={0.6}
        depthScale={0.8}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={REFERENCE_ALBEDO}
        metalness={0.2}
        mirror={0.35}
      />
    </mesh>
  )
}
