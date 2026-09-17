import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--bone)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
      }}
    >
      <h1 style={{ margin: 0, fontWeight: 500, letterSpacing: '0.02em' }}>
        Made to hold.
      </h1>
      <Link to="/lab" style={{ color: 'var(--bone)' }}>
        Open lab
      </Link>
    </div>
  )
}
