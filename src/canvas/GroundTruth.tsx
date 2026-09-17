import { REFERENCE_ALBEDO } from '../config/color'

export function OpaqueSphere() {
  return (
    <mesh castShadow position={[0, 0.75, 0]}>
      <sphereGeometry args={[0.75, 64, 64]} />
      <meshStandardMaterial color={REFERENCE_ALBEDO} roughness={0.45} metalness={0} />
    </mesh>
  )
}

export function PlainGround() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color={REFERENCE_ALBEDO} roughness={0.85} metalness={0} />
    </mesh>
  )
}

/** @deprecated prefer OpaqueSphere + PlainGround / ReflectorFloor */
export function GroundTruth() {
  return (
    <group>
      <OpaqueSphere />
      <PlainGround />
    </group>
  )
}
