import { Fragment } from 'react'

type Props = {
  items: string[]
  /** Seconds for one full pass. */
  duration?: number
  reverse?: boolean
  className?: string
}

/** Extruded ticker — the filament spool never stops feeding. */
export function Marquee({
  items,
  duration = 34,
  reverse = false,
  className,
}: Props) {
  const run = (
    <span className="marquee__run">
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className="marquee__item">{item}</span>
          <span className="marquee__sep" aria-hidden>
            &#9670;
          </span>
        </Fragment>
      ))}
    </span>
  )

  return (
    <div
      className={['marquee', reverse ? 'marquee--rev' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--marquee-duration' as string]: `${duration}s` }}
    >
      <div className="marquee__track">
        {run}
        <span aria-hidden>{run}</span>
      </div>
    </div>
  )
}
