import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { DEFAULT_TONE_MAP, type ToneMapPreset } from '../config/color'
import { isComposerActive, type LightFlags } from '../config/lightUnits'

type Props = {
  flags: LightFlags
  toneMap?: ToneMapPreset
}

const COMPOSER_TONE_MAP: Record<ToneMapPreset, ToneMappingMode> = {
  agx: ToneMappingMode.AGX,
  none: ToneMappingMode.LINEAR,
  neutral: ToneMappingMode.NEUTRAL,
}

/**
 * Pass order: N8AO → Bloom → DOF → SMAA → ToneMapping.
 * Mount only when any post pass is enabled. No TRAA / realism-effects.
 */
export function PostFX({ flags, toneMap = DEFAULT_TONE_MAP }: Props) {
  if (!isComposerActive(flags)) return null

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      {flags.n8ao && (
        <N8AO aoRadius={0.4} intensity={1.5} quality="medium" halfRes />
      )}
      {flags.bloom && (
        <Bloom
          luminanceThreshold={0.85}
          luminanceSmoothing={0.2}
          intensity={0.6}
          mipmapBlur
        />
      )}
      {flags.dof && (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.08}
          bokehScale={2}
          height={480}
        />
      )}
      {flags.smaa && <SMAA />}
      <ToneMapping mode={COMPOSER_TONE_MAP[toneMap]} />
    </EffectComposer>
  )
}
