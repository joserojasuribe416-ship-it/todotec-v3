'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { apiLogin, saveSession } from '../../lib/customer'
import { mergeServerCart } from '../../lib/cartStorage'

const inp = { width: '100%', padding: '12px 14px', border: '1px solid #EDE8E4', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await apiLogin(email, password)
      saveSession(data.access_token, data.customer)
      await mergeServerCart()
      router.push('/account')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      <div className="page-pad" style={{ maxWidth: 420, margin: '0 auto', padding: '56px 24px' }}>
        <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 28, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
          Iniciar sesión
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 32, fontWeight: 300 }}>
          Bienvenida de vuelta a tu rutina
        </p>

        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8E4', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Correo electrónico</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" required />
          </div>
          <div>
            <label style={lbl}>Contraseña</label>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C0392B' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 10,
            padding: '14px 0', fontFamily: "'Inter', sans-serif", fontSize: 12,
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: loading ? 0.6 : 1
          }}>
            <LogIn size={15} /> {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
          ¿Aún no tienes cuenta?{' '}
          <Link href="/register" style={{ color: '#C49A8A', fontWeight: 500 }}>Crea una y obtén 30% de descuento</Link>
        </p>
      </div>
    </div>
  )
}
