import type { CSSProperties, ElementType } from 'react'
import { useInView } from './useInView'

type Props = {
  children: string
  as?: ElementType
  /** Stagger unit. Characters for hero-scale type, words for body copy. */
  by?: 'char' | 'word' | 'line'
  className?: string
  /** Seconds between units. */
  step?: number
  delay?: number
  style?: CSSProperties
}

/**
 * Print-reveal for DOM type: every unit rises out of a clipped band, the same
 * bottom-to-top motion the bed uses. One shared gesture across 2D and 3D is the
 * whole point of the rebrand, so this is deliberately not a generic fade.
 */
export function SplitText({
  children,
  as,
  by = 'word',
  className,
  step = 0.045,
  delay = 0,
  style,
}: Props) {
  // Cast to a concrete intrinsic so ref/className/style stay typed; the tag
  // actually rendered is whatever the caller passed.
  const Tag = (as ?? 'span') as 'span'
  const { ref, inView } = useInView<HTMLElement>(0.2)

  const units =
    by === 'line'
      ? children.split('\n')
      : by === 'char'
        ? children.split('')
        : children.split(' ')

  // Blank units keep their slot in the string but don't consume a stagger step.
  let visible = -1
  const delays = units.map((unit) => {
    if (unit === ' ' || unit === '') return ''
    visible += 1
    return (delay + visible * step).toFixed(3) + 's'
  })

  return (
    <Tag
      ref={ref}
      className={['split', `split--${by}`, inView ? 'is-in' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-label={children}
    >
      {units.map((unit, i) => {
        if (unit === ' ' || unit === '') {
          return (
            <span key={i} className="split__space" aria-hidden>
              &nbsp;
            </span>
          )
        }

        const d = delays[i]

        return (
          <span key={i} className="split__frag" aria-hidden>
            <span className="split__mask">
              <span className="split__unit" style={{ transitionDelay: d }}>
                {unit}
              </span>
            </span>
            {by === 'word' && i < units.length - 1 ? (
              <span className="split__space">&nbsp;</span>
            ) : null}
          </span>
        )
      })}
    </Tag>
  )
}
