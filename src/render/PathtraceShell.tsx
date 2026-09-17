import { Pathtracer, usePathtracer } from '@react-three/gpu-pathtracer'
import { useFrame } from '@react-three/fiber'
import { useEffect, type ReactNode } from 'react'

type PathtraceHudProps = {
  onSamplesChange?: (samples: number) => void
  onResetReady?: (reset: () => void) => void
}

/** Lives inside Pathtracer so usePathtracer works; lifts samples/reset outward. */
function PathtraceHud({ onSamplesChange, onResetReady }: PathtraceHudProps) {
  const { pathtracer, reset } = usePathtracer()

  useEffect(() => {
    onResetReady?.(reset)
  }, [reset, onResetReady])

  useFrame(() => {
    onSamplesChange?.(pathtracer.samples)
  })

  return null
}

type Props = {
  enabled: boolean
  children: ReactNode
  onSamplesChange?: (samples: number) => void
  onResetReady?: (reset: () => void) => void
}

/** Path C wrapper — enabled only for hero stills; Path A when false. */
export function PathtraceShell({
  enabled,
  children,
  onSamplesChange,
  onResetReady,
}: Props) {
  return (
    <Pathtracer
      enabled={enabled}
      bounces={enabled ? 5 : 1}
      tiles={enabled ? 2 : 1}
      // Uncapped while accumulating in hero mode (package default max is 32)
      samples={enabled ? Number.POSITIVE_INFINITY : 1}
    >
      {enabled && (
        <PathtraceHud
          onSamplesChange={onSamplesChange}
          onResetReady={onResetReady}
        />
      )}
      {children}
    </Pathtracer>
  )
}
