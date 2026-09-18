import { useEffect, useState } from 'react'

/**
 * The one instruction the page gives. The strand is draggable, which nothing
 * on screen otherwise signals, so say it once and never again — it dismisses
 * permanently on the first drag.
 */
export function HoldHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const show = window.setTimeout(() => setVisible(true), 2600)
    const dismiss = () => setVisible(false)
    window.addEventListener('pointerdown', dismiss, { once: true })

    return () => {
      window.clearTimeout(show)
      window.removeEventListener('pointerdown', dismiss)
    }
  }, [])

  if (!visible) return null

  return (
    <p className="hold-hint" aria-hidden>
      <span className="hold-hint__ring" />
      Hold anywhere to turn it
    </p>
  )
}
