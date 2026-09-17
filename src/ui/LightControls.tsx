import type { LightFlags } from '../config/lightUnits'

type Props = {
  flags: LightFlags
  onChange: (next: LightFlags) => void
}

const LABELS: { key: keyof LightFlags; label: string }[] = [
  { key: 'environment', label: 'Environment' },
  { key: 'key', label: 'Key' },
  { key: 'fill', label: 'Fill' },
  { key: 'rim', label: 'Rim' },
  { key: 'area', label: 'Area (+proxy)' },
  { key: 'contactShadows', label: 'ContactShadows' },
  { key: 'n8ao', label: 'N8AO' },
  { key: 'bloom', label: 'Bloom' },
  { key: 'dof', label: 'DOF' },
  { key: 'smaa', label: 'SMAA' },
  { key: 'reflectorFloor', label: 'Reflector floor' },
  { key: 'glass', label: 'Glass' },
]

export function LightControls({ flags, onChange }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.65)',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        borderRadius: 6,
      }}
    >
      {LABELS.map(({ key, label }) => (
        <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={flags[key]}
            onChange={(e) => onChange({ ...flags, [key]: e.target.checked })}
          />
          {label}
        </label>
      ))}
    </div>
  )
}
