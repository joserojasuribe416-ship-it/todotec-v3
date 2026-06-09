import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Usuarios() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', full_name: '', password: '', role: 'standard' })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/auth/users').then(r => setUsers(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Completa todos los campos')
    setSaving(true)
    try {
      await api.post('/auth/users', form)
      toast.success('Cuenta creada')
      setForm({ username: '', full_name: '', password: '', role: 'standard' })
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear cuenta')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id, name) => {
    if (!confirm(`¿Eliminar la cuenta de ${name}?`)) return
    await api.delete(`/auth/users/${id}`)
    toast.success('Cuenta eliminada')
    load()
  }

  const inp = { fontFamily: "'Inter', sans-serif", fontSize: 13, border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px', width: '100%', outline: 'none', background: '#fff', color: '#0A0A0A', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }

  return (
    <div style={{ padding: '24px 28px', fontFamily: "'Inter', sans-serif", maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 22, color: '#0A0A0A', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Usuarios</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>Gestión de accesos al panel de administración</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}
        >
          <Plus size={13} /> Nueva cuenta
        </button>
      </div>

      {/* Formulario nuevo usuario */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '22px 24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 18 }}>Nueva cuenta</h3>
          <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div>
              <label style={lbl}>Usuario (para login)</label>
              <input style={inp} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().trim() }))} placeholder="ej: maria" required />
            </div>
            <div>
              <label style={lbl}>Nombre completo</label>
              <input style={inp} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="ej: Maria García" />
            </div>
            <div>
              <label style={lbl}>Contraseña inicial</label>
              <input style={inp} type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="mínimo 6 caracteres" required />
            </div>
            <div>
              <label style={lbl}>Rol</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="standard">Standard — solo acceso</option>
                <option value="master">Master — puede crear cuentas</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#1E1A1A', color: '#EEC5C5', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creando...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
        {users.map((u, idx) => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
            borderBottom: idx < users.length - 1 ? '1px solid #F9FAFB' : 'none',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.role === 'master' ? '#1E1A1A' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {u.role === 'master'
                ? <Shield size={16} color="#EEC5C5" />
                : <User size={16} color="#9CA3AF" />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{u.full_name || u.username}</span>
                {u.id === me?.id && <span style={{ fontSize: 10, background: '#EFF6FF', color: '#2563EB', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>Tú</span>}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>@{u.username} · {u.role === 'master' ? 'Master' : 'Standard'}</div>
            </div>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
              background: u.role === 'master' ? '#1E1A1A' : '#F3F4F6',
              color: u.role === 'master' ? '#EEC5C5' : '#6B7280',
            }}>
              {u.role === 'master' ? 'Master' : 'Standard'}
            </span>
            {u.id !== me?.id && (
              <button
                onClick={() => del(u.id, u.full_name || u.username)}
                style={{ background: 'none', border: '1px solid #FEE2E2', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
