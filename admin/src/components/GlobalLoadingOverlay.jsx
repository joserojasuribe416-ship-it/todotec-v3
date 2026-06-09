import { useState, useEffect } from 'react'

export default function GlobalLoadingOverlay() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e) => setLoading(e.detail > 0)
    window.addEventListener('api:loading', handler)
    return () => window.removeEventListener('api:loading', handler)
  }, [])

  if (!loading) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(30,26,26,0.15)',
      backdropFilter: 'blur(1.5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'all',
      cursor: 'wait',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '16px 26px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2.5px solid #EDE8E4',
          borderTopColor: '#1E1A1A',
          animation: 'overlay-spin 0.7s linear infinite',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, color: '#1E1A1A', fontWeight: 500, letterSpacing: '0.02em' }}>
          Guardando...
        </span>
      </div>
      <style>{`
        @keyframes overlay-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
