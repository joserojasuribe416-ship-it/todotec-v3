import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F9FAFB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: '#1E1A1A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 22,
          }}>🌸</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A', marginBottom: 4, letterSpacing: '-0.01em' }}>
            Glowi Skin Admin
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Ingresa tus credenciales para continuar</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6',
          padding: '32px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Usuario */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6, letterSpacing: '0.02em' }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ej: jose"
                autoComplete="username"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 9,
                  border: '1px solid #E5E7EB', fontSize: 14, color: '#0A0A0A',
                  outline: 'none', boxSizing: 'border-box', background: '#fff',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#1E1A1A'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%', padding: '10px 40px 10px 14px', borderRadius: 9,
                    border: '1px solid #E5E7EB', fontSize: 14, color: '#0A0A0A',
                    outline: 'none', boxSizing: 'border-box', background: '#fff',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1E1A1A'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#1E1A1A', color: '#FAF7F4', border: 'none', borderRadius: 9,
                padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.15s', letterSpacing: '0.02em',
              }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Ingresando...</>
                : 'Ingresar'
              }
            </button>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
