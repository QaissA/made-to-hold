import {
  AgXToneMapping,
  NeutralToneMapping,
  NoToneMapping,
  SRGBColorSpace,
  type ToneMapping,
} from 'three'

export type ToneMapPreset = 'agx' | 'none' | 'neutral'

export const TONE_MAP_PRESETS: Record<ToneMapPreset, ToneMapping> = {
  agx: AgXToneMapping,
  none: NoToneMapping,
  neutral: NeutralToneMapping,
}

export const DEFAULT_TONE_MAP: ToneMapPreset = 'agx'
export const DEFAULT_EXPOSURE = 1.0
export const OUTPUT_COLOR_SPACE = SRGBColorSpace

/** Mid-gray albedo for reference geometry (~18% gray). */
export const REFERENCE_ALBEDO = '#2e2e2e'
