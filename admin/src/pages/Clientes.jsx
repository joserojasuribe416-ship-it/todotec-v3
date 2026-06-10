import { useState, useEffect } from 'react'
import api from '../api/client'
import { UserCircle, Ticket, ShoppingBag, Search, Gift, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
const fdate = (iso) => iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function Clientes() {
  const [clients, setClients] = useState([])
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [couponFor, setCouponFor] = useState(null)   // cliente al que se le da cupón
  const [percent, setPercent] = useState('10')
  const [granting, setGranting] = useState(false)

  const load = () => Promise.all([
    api.get('/clients').then(r => setClients(r.data)),
    api.get('/clients/summary').then(r => setSummary(r.data)),
  ]).catch(() => {}).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const grantCoupon = async (e) => {
    e.preventDefault()
    const pct = parseFloat(percent)
    if (!pct || pct < 1 || pct > 100) return toast.error('Porcentaje entre 1 y 100')
    setGranting(true)
    try {
      const r = await api.post(`/clients/${couponFor}/coupons`, { percent: pct })
      toast.success(`Cupón ${r.data.code} creado`)
      setCouponFor(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear cupón')
    } finally {
      setGranting(false)
    }
  }

  const revokeCoupon = async (code) => {
    if (!confirm(`¿Eliminar el cupón ${code}? El cliente ya no podrá usarlo.`)) return
    try {
      await api.delete(`/clients/coupons/${code}`)
      toast.success('Cupón eliminado')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar')
    }
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return !q || c.email.includes(q) || `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) || (c.dni || '').includes(q)
  })

  const card = { background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', padding: '18px 20px' }

  return (
    <div style={{ padding: '24px 28px', fontFamily: "'Inter', sans-serif", maxWidth: 980 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 22, color: '#0A0A0A', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Clientes</h1>
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>Cuentas registradas en la tienda online y su historial de compras</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clientes con cuenta</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#0A0A0A', marginTop: 4 }}>{summary?.total_clients ?? '—'}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cupones usados</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#0A0A0A', marginTop: 4 }}>{summary?.coupons_used ?? '—'}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cupones por usar</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#0A0A0A', marginTop: 4 }}>{summary?.coupons_pending ?? '—'}</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 9, padding: '9px 14px', marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} color="#9CA3AF" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o DNI..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter', sans-serif", color: '#0A0A0A', background: 'transparent' }}
        />
      </div>

      {/* Lista */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
        {loading && <div style={{ padding: 24, fontSize: 13, color: '#9CA3AF' }}>Cargando...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
            {clients.length === 0 ? 'Aún no hay clientes registrados en la tienda.' : 'Sin resultados para esa búsqueda.'}
          </div>
        )}
        {filtered.map((c, idx) => (
          <div key={c.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', flexWrap: 'wrap' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FDF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCircle size={18} color="#C49A8A" />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
                {(c.nombre || c.apellido) ? `${c.nombre} ${c.apellido}`.trim() : c.email}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                {c.email}{c.celular ? ` · ${c.celular}` : ''}{c.dni ? ` · DNI ${c.dni}` : ''}
              </div>
              <div style={{ fontSize: 11, color: '#C4C4BC', marginTop: 2 }}>Cliente desde {fdate(c.created_at)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}><ShoppingBag size={11} /> Compras</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>{c.purchases}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Total gastado</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>{fmt(c.total_spent)}</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 84 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Última compra</div>
                <div style={{ fontSize: 12, color: '#0A0A0A', marginTop: 2 }}>{fdate(c.last_order)}</div>
              </div>
              <div title={c.coupons.map(cp => `${cp.code} ${cp.is_used ? '(usado)' : '(disponible)'}`).join('\n')} style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: c.coupons.some(cp => !cp.is_used) ? '#FDF0F0' : '#F3F4F6',
                color: c.coupons.some(cp => !cp.is_used) ? '#C49A8A' : '#9CA3AF', cursor: 'default',
              }}>
                <Ticket size={11} /> {c.coupons.filter(cp => !cp.is_used).length} cupón(es)
              </div>
              <button
                title="Dar cupón"
                onClick={() => { setCouponFor(couponFor === c.id ? null : c.id); setPercent('10') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '6px 12px',
                  borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer',
                  background: couponFor === c.id ? '#1E1A1A' : '#fff',
                  color: couponFor === c.id ? '#EEC5C5' : '#6B7280',
                }}>
                {couponFor === c.id ? <X size={12} /> : <Gift size={12} />} Dar cupón
              </button>
            </div>
            </div>

            {/* Mini-form: dar cupón */}
            {couponFor === c.id && (
              <form onSubmit={grantCoupon} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 20px 14px 72px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number" min="1" max="100" value={percent} autoFocus
                    onChange={e => setPercent(e.target.value)}
                    style={{ width: 70, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }}
                  />
                  <span style={{ fontSize: 13, color: '#6B7280' }}>% de descuento</span>
                </div>
                <button type="submit" disabled={granting} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1E1A1A', color: '#EEC5C5', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: granting ? 0.6 : 1 }}>
                  {granting ? 'Creando...' : 'Crear cupón'}
                </button>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>El cliente lo verá al instante en "Mis Cupones"</span>
              </form>
            )}

            {/* Cupones activos con opción de eliminar */}
            {couponFor === c.id && c.coupons.filter(cp => !cp.is_used).length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 20px 16px 72px' }}>
                {c.coupons.filter(cp => !cp.is_used).map(cp => (
                  <span key={cp.code} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, background: '#FDF0F0', color: '#C49A8A', padding: '4px 8px 4px 12px', borderRadius: 20 }}>
                    {cp.code} · {cp.percent}%
                    <button type="button" onClick={() => revokeCoupon(cp.code)} title="Eliminar cupón" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', padding: 2 }}>
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
