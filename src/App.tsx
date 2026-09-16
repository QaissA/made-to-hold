import { useState } from 'react'
import { Scene } from './canvas/Scene'
import {
  DEFAULT_EXPOSURE,
  DEFAULT_TONE_MAP,
  type ToneMapPreset,
} from './config/color'
import { ToneMapControls } from './ui/ToneMapControls'

export default function App() {
  const [toneMap, setToneMap] = useState<ToneMapPreset>(DEFAULT_TONE_MAP)
  const [exposure, setExposure] = useState(DEFAULT_EXPOSURE)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ToneMapControls
        toneMap={toneMap}
        exposure={exposure}
        onToneMapChange={setToneMap}
        onExposureChange={setExposure}
      />
      <Scene toneMap={toneMap} exposure={exposure} />
    </div>
  )
}
