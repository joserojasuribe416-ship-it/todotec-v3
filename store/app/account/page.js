'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Ticket, KeyRound, LogOut, Check, Copy, Sparkles } from 'lucide-react'
import {
  isLoggedIn, getCustomer, saveSession, getToken, logout,
  apiMe, apiUpdateMe, apiChangePassword, apiMyCoupons,
} from '../../lib/customer'

const inp = { width: '100%', padding: '11px 14px', border: '1px solid #EDE8E4', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }

function AccountInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const welcome = searchParams.get('welcome') === '1'

  const [tab, setTab] = useState(welcome ? 'cupones' : 'datos')
  const [profile, setProfile] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [pwd, setPwd] = useState({ current: '', nueva: '' })

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    apiMe().then(p => setProfile({
      nombre: p.nombre || '', apellido: p.apellido || '', dni: p.dni || '', celular: p.celular || '',
      email: p.email,
      address: p.delivery_data?.address || '', district: p.delivery_data?.district || '',
      province: p.delivery_data?.province || '', department: p.delivery_data?.department || '',
    })).catch(() => { logout(); router.replace('/login') })
    apiMyCoupons().then(setCoupons).catch(() => {})
  }, [router])

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }))
  const flash = (m) => { setMsg(m); setError(''); setTimeout(() => setMsg(''), 2500) }

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      const updated = await apiUpdateMe({
        nombre: profile.nombre, apellido: profile.apellido, dni: profile.dni, celular: profile.celular,
        delivery_data: { type: 'delivery', address: profile.address, district: profile.district, province: profile.province, department: profile.department },
      })
      saveSession(getToken(), updated)
      flash('Datos guardados')
    } catch (err) { setError(err.message) }
  }

  const changePwd = async (e) => {
    e.preventDefault()
    try {
      await apiChangePassword(pwd.current, pwd.nueva)
      setPwd({ current: '', nueva: '' })
      flash('Contraseña actualizada')
    } catch (err) { setError(err.message) }
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(''), 1800)
  }

  const doLogout = () => { logout(); router.push('/') }

  if (!profile) return <div style={{ background: '#FAF7F4', minHeight: '60vh' }} />

  const tabBtn = (key, icon, label) => (
    <button onClick={() => { setTab(key); setError('') }} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
      border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 12,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
      background: tab === key ? '#1E1A1A' : 'transparent',
      color: tab === key ? '#EEC5C5' : '#6B7280',
    }}>{icon} {label}</button>
  )

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      <div style={{ background: '#1E1A1A', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10 }}>Hola, {profile.nombre || 'glower'}</p>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF7F4', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
            Mi Perfil
          </h1>
        </div>
      </div>

      <div className="page-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        {welcome && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EEC5C5', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A' }}>
            <Sparkles size={18} /> ¡Cuenta creada! Tu cupón de 30% ya está en "Mis Cupones" — úsalo en el carrito.
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', background: '#fff', borderRadius: 10, padding: 6, border: '1px solid #EDE8E4', width: 'fit-content', maxWidth: '100%' }}>
          {tabBtn('datos', <User size={14} />, 'Mis datos')}
          {tabBtn('cupones', <Ticket size={14} />, 'Mis Cupones')}
          {tabBtn('password', <KeyRound size={14} />, 'Contraseña')}
        </div>

        {msg && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#5B7B53', marginBottom: 14 }}><Check size={12} style={{ display: 'inline' }} /> {msg}</p>}
        {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C0392B', marginBottom: 14 }}>{error}</p>}

        {tab === 'datos' && (
          <form onSubmit={saveProfile} style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8E4', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="co-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={lbl}>Nombre</label><input style={inp} value={profile.nombre} onChange={e => set('nombre', e.target.value)} /></div>
              <div><label style={lbl}>Apellido</label><input style={inp} value={profile.apellido} onChange={e => set('apellido', e.target.value)} /></div>
              <div><label style={lbl}>DNI</label><input style={inp} value={profile.dni} onChange={e => set('dni', e.target.value)} /></div>
              <div><label style={lbl}>Celular</label><input style={inp} value={profile.celular} onChange={e => set('celular', e.target.value)} /></div>
            </div>
            <div><label style={lbl}>Correo (no editable)</label><input style={{ ...inp, background: '#FAF7F4', color: '#9CA3AF' }} value={profile.email} disabled /></div>
            <div style={{ borderTop: '1px solid #F3EDE9', paddingTop: 16 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C49A8A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Dirección de envío guardada</div>
              <div className="co-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>Departamento</label><input style={inp} value={profile.department} onChange={e => set('department', e.target.value)} placeholder="Lima" /></div>
                <div><label style={lbl}>Provincia</label><input style={inp} value={profile.province} onChange={e => set('province', e.target.value)} placeholder="Lima" /></div>
                <div><label style={lbl}>Distrito</label><input style={inp} value={profile.district} onChange={e => set('district', e.target.value)} placeholder="Miraflores" /></div>
                <div><label style={lbl}>Dirección</label><input style={inp} value={profile.address} onChange={e => set('address', e.target.value)} placeholder="Av. Larco 123" /></div>
              </div>
            </div>
            <button type="submit" style={{ background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 10, padding: '13px 0', fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Guardar cambios
            </button>
          </form>
        )}

        {tab === 'cupones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {coupons.length === 0 && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#9CA3AF' }}>No tienes cupones por ahora.</p>
            )}
            {coupons.map(cp => (
              <div key={cp.code} style={{
                background: cp.is_used ? '#FAF7F4' : '#fff', borderRadius: 16, padding: '20px 22px',
                border: cp.is_used ? '1px dashed #EDE8E4' : '1.5px solid #EEC5C5',
                display: 'flex', alignItems: 'center', gap: 16, opacity: cp.is_used ? 0.6 : 1,
              }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: cp.is_used ? '#EDE8E4' : '#EEC5C5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ticket size={20} color="#1E1A1A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 17, fontWeight: 300, color: '#1E1A1A', letterSpacing: '0.06em' }}>−{cp.percent}%</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{cp.description}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: cp.is_used ? '#9CA3AF' : '#C49A8A', marginTop: 6, letterSpacing: '0.06em' }}>{cp.code}</div>
                </div>
                {cp.is_used ? (
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Usado</span>
                ) : (
                  <button onClick={() => copyCode(cp.code)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: '#1E1A1A', color: '#EEC5C5',
                    border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: '0.04em'
                  }}>
                    {copied === cp.code ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                  </button>
                )}
              </div>
            ))}
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              Aplica tu cupón en el <Link href="/cart" style={{ color: '#C49A8A' }}>carrito</Link> antes de pagar.
            </p>
          </div>
        )}

        {tab === 'password' && (
          <form onSubmit={changePwd} style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8E4', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
            <div><label style={lbl}>Contraseña actual</label><input style={inp} type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} required /></div>
            <div><label style={lbl}>Contraseña nueva</label><input style={inp} type="password" value={pwd.nueva} onChange={e => setPwd(p => ({ ...p, nueva: e.target.value }))} minLength={6} placeholder="Mínimo 6 caracteres" required /></div>
            <button type="submit" style={{ background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 10, padding: '13px 0', fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Cambiar contraseña
            </button>
          </form>
        )}

        <button onClick={doLogout} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, background: 'none',
          border: 'none', cursor: 'pointer', color: '#9CA3AF', fontFamily: "'Inter', sans-serif",
          fontSize: 12, letterSpacing: '0.04em'
        }}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountInner />
    </Suspense>
  )
}
