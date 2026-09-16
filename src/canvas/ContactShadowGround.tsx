import { ContactShadows } from '@react-three/drei'

export function ContactShadowGround() {
  return (
    <ContactShadows
      position={[0, 0.001, 0]}
      opacity={0.55}
      scale={8}
      blur={2.5}
      far={4}
      resolution={1024}
      color="#000000"
    />
  )
}
