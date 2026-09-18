import { useEffect, useRef, useState } from 'react'
import { ACTS, stage } from '../scroll/stage'

/**
 * Left rail: the one-word anchor for the act you are in, plus a filament that
 * fills as the job runs. The word swaps with a print-reveal, never a fade.
 */
export function AnchorRail() {
  const [word, setWord] = useState(ACTS.hero.word)
  const fillRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let last = ACTS.hero.word

    const tick = () => {
      const next = ACTS[stage.actId]?.word ?? last
      if (next !== last) {
        last = next
        setWord(next)
      }
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${stage.scroll})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="rail" aria-hidden>
      <div className="rail__track">
        <span className="rail__fill" ref={fillRef} />
      </div>
      <div className="rail__word-mask">
        <span className="rail__word" key={word}>
          {word}
        </span>
      </div>
    </div>
  )
}
