import type { SubjectId } from '../config/subject'
import { DEFAULT_SUBJECT } from '../config/subject'

type Props = {
  subject: SubjectId
  onSubjectChange: (v: SubjectId) => void
}

const OPTIONS: { id: SubjectId; label: string }[] = [
  { id: 'midgray', label: 'Mid-gray' },
  { id: 'glass', label: 'Glass' },
  { id: 'helmet', label: 'Helmet' },
]

export function SubjectControls({
  subject = DEFAULT_SUBJECT,
  onSubjectChange,
}: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
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
      <span>Subject</span>
      {OPTIONS.map(({ id, label }) => (
        <label
          key={id}
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <input
            type="radio"
            name="subject"
            value={id}
            checked={subject === id}
            onChange={() => onSubjectChange(id)}
          />
          {label}
        </label>
      ))}
    </div>
  )
}
