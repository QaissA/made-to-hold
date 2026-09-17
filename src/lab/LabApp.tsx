import { useCallback, useRef, useState } from 'react'
import { Scene } from '../canvas/Scene'
import {
  DEFAULT_EXPOSURE,
  DEFAULT_TONE_MAP,
  type ToneMapPreset,
} from '../config/color'
import { DEFAULT_LIGHT_FLAGS, type LightFlags } from '../config/lightUnits'
import { DEFAULT_SUBJECT, type SubjectId } from '../config/subject'
import { LightControls } from '../ui/LightControls'
import { PathtraceControls } from '../ui/PathtraceControls'
import { SubjectControls } from '../ui/SubjectControls'
import { ToneMapControls } from '../ui/ToneMapControls'

export default function LabApp() {
  const [toneMap, setToneMap] = useState<ToneMapPreset>(DEFAULT_TONE_MAP)
  const [exposure, setExposure] = useState(DEFAULT_EXPOSURE)
  const [lightFlags, setLightFlags] = useState<LightFlags>(DEFAULT_LIGHT_FLAGS)
  const [subject, setSubject] = useState<SubjectId>(DEFAULT_SUBJECT)
  const [heroPathtrace, setHeroPathtrace] = useState(false)
  const [pathSamples, setPathSamples] = useState<number | undefined>()
  const pathResetRef = useRef<(() => void) | null>(null)

  const handleSamplesChange = useCallback((samples: number) => {
    setPathSamples((prev) => (prev === samples ? prev : samples))
  }, [])

  const handleResetReady = useCallback((reset: () => void) => {
    pathResetRef.current = reset
  }, [])

  const handleEnabledChange = useCallback((enabled: boolean) => {
    setHeroPathtrace(enabled)
    if (!enabled) {
      setPathSamples(undefined)
      pathResetRef.current = null
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ToneMapControls
        toneMap={toneMap}
        exposure={exposure}
        onToneMapChange={setToneMap}
        onExposureChange={setExposure}
      />
      <LightControls flags={lightFlags} onChange={setLightFlags} />
      <PathtraceControls
        enabled={heroPathtrace}
        onEnabledChange={handleEnabledChange}
        samples={pathSamples}
        onReset={
          heroPathtrace
            ? () => {
                pathResetRef.current?.()
              }
            : undefined
        }
      />
      <SubjectControls subject={subject} onSubjectChange={setSubject} />
      <Scene
        toneMap={toneMap}
        exposure={exposure}
        lightFlags={lightFlags}
        subject={subject}
        heroPathtrace={heroPathtrace}
        onPathSamplesChange={handleSamplesChange}
        onPathResetReady={handleResetReady}
      />
    </div>
  )
}
