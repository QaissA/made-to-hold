import { EffectComposer, N8AO } from '@react-three/postprocessing'

type Props = { enabled: boolean }

/**
 * Phase 3: N8AO only. No ToneMapping effect — AgX stays on the renderer.
 * GI strategy: IBL (Environment) + N8AO. SSGI deferred.
 */
export function PostFX({ enabled }: Props) {
  if (!enabled) return null
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <N8AO aoRadius={0.4} intensity={1.5} quality="medium" halfRes />
    </EffectComposer>
  )
}
