import { MeshTransmissionMaterial } from '@react-three/drei'

export function GlassSphere() {
  return (
    <mesh castShadow position={[0, 0.75, 0]}>
      <sphereGeometry args={[0.75, 64, 64]} />
      <MeshTransmissionMaterial
        backside
        samples={6}
        resolution={512}
        transmission={1}
        roughness={0.05}
        thickness={0.6}
        ior={1.5}
        chromaticAberration={0.02}
        anisotropy={0.1}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.1}
        color="#ffffff"
      />
    </mesh>
  )
}
