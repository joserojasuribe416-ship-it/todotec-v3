'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { apiRegister, saveSession } from '../../lib/customer'
import { mergeServerCart } from '../../lib/cartStorage'

const inp = { width: '100%', padding: '12px 14px', border: '1px solid #EDE8E4', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '' })
  const [privacy, setPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await apiRegister({ ...form, accept_privacy: privacy })
      saveSession(data.access_token, data.customer)
      await mergeServerCart()
      router.push('/account?welcome=1')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      <div className="page-pad" style={{ maxWidth: 460, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEC5C5',
            color: '#1E1A1A', borderRadius: 50, padding: '6px 16px', marginBottom: 14,
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.04em'
          }}>
            <Sparkles size={13} /> 30% DCTO en tu primera compra
          </div>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 28, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Crear cuenta
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9CA3AF', marginTop: 8, fontWeight: 300 }}>
            Al registrarte recibes tu cupón GLOWI30 en "Mis Cupones"
          </p>
        </div>

        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8E4', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="co-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Nombre</label>
              <input style={inp} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="María" required />
            </div>
            <div>
              <label style={lbl}>Apellido</label>
              <input style={inp} value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="López" required />
            </div>
          </div>
          <div>
            <label style={lbl}>Correo electrónico</label>
            <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tucorreo@gmail.com" required />
          </div>
          <div>
            <label style={lbl}>Contraseña</label>
            <input style={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} style={{ marginTop: 2, accentColor: '#1E1A1A' }} required />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>
              Acepto la <Link href="/privacidad" target="_blank" style={{ color: '#C49A8A' }}>política de privacidad</Link> y el tratamiento de mis datos personales (Ley N° 29733).
            </span>
          </label>

          {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C0392B' }}>{error}</p>}

          <button type="submit" disabled={loading || !privacy} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#EEC5C5', color: '#1E1A1A', border: 'none', borderRadius: 10,
            padding: '14px 0', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            opacity: (loading || !privacy) ? 0.6 : 1
          }}>
            <Sparkles size={15} /> {loading ? 'Creando cuenta...' : 'Crear cuenta y obtener 30%'}
          </button>
        </form>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: '#C49A8A', fontWeight: 500 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
