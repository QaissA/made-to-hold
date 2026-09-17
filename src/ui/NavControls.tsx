import type { NavMode } from '../config/nav'

type Props = {
  mode: NavMode
  onModeChange: (m: NavMode) => void
  disabled?: boolean
}

export function NavControls({ mode, onModeChange, disabled }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 12,
        zIndex: 10,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.65)',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        borderRadius: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={mode === 'walk'}
          disabled={disabled}
          onChange={(e) =>
            onModeChange(e.target.checked ? 'walk' : 'orbit')
          }
        />
        Walk
      </label>
      <span style={{ opacity: 0.7 }}>F</span>
    </div>
  )
}
