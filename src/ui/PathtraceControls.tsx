type Props = {
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  samples?: number
  onReset?: () => void
}

export function PathtraceControls({
  enabled,
  onEnabledChange,
  samples,
  onReset,
}: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
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
      }}
    >
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        Hero pathtrace
      </label>
      {enabled && (
        <>
          <span>Samples: {samples ?? '…'}</span>
          {onReset && (
            <button type="button" onClick={onReset}>
              Reset
            </button>
          )}
        </>
      )}
    </div>
  )
}
