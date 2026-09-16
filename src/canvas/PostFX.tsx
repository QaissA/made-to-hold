import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import {
  DEFAULT_TONE_MAP,
  type ToneMapPreset,
} from '../config/color'

type Props = {
  enabled: boolean
  toneMap?: ToneMapPreset
}

const COMPOSER_TONE_MAP: Record<ToneMapPreset, ToneMappingMode> = {
  agx: ToneMappingMode.AGX,
  none: ToneMappingMode.LINEAR,
  neutral: ToneMappingMode.NEUTRAL,
}

/**
 * Phase 3: N8AO + composer ToneMapping (EffectComposer forces NoToneMapping on gl).
 * GI strategy: IBL (Environment) + N8AO. SSGI deferred.
 */
export function PostFX({ enabled, toneMap = DEFAULT_TONE_MAP }: Props) {
  if (!enabled) return null
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <N8AO aoRadius={0.4} intensity={1.5} quality="medium" halfRes />
      <ToneMapping mode={COMPOSER_TONE_MAP[toneMap]} />
    </EffectComposer>
  )
}
