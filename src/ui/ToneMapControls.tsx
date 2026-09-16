import type { ToneMapPreset } from '../config/color'
import { DEFAULT_EXPOSURE, DEFAULT_TONE_MAP } from '../config/color'

type Props = {
  toneMap: ToneMapPreset
  exposure: number
  onToneMapChange: (v: ToneMapPreset) => void
  onExposureChange: (v: number) => void
}

export function ToneMapControls({
  toneMap = DEFAULT_TONE_MAP,
  exposure = DEFAULT_EXPOSURE,
  onToneMapChange,
  onExposureChange,
}: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.65)',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        borderRadius: 6,
      }}
    >
      <label>
        Tone{' '}
        <select
          value={toneMap}
          onChange={(e) => onToneMapChange(e.target.value as ToneMapPreset)}
        >
          <option value="agx">AgX</option>
          <option value="none">None</option>
          <option value="neutral">Neutral</option>
        </select>
      </label>
      <label>
        Exposure{' '}
        <input
          type="range"
          min={0.2}
          max={2.5}
          step={0.05}
          value={exposure}
          onChange={(e) => onExposureChange(Number(e.target.value))}
        />{' '}
        {exposure.toFixed(2)}
      </label>
    </div>
  )
}
