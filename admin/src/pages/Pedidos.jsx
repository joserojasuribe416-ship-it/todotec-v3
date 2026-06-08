import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { Package, ChevronDown, ChevronUp, RefreshCw, ExternalLink } from 'lucide-react'

const STATUS_CONFIG = {
  pending_payment: { label: 'Pendiente',  bg: '#F3F4F6', color: '#6B7280' },
  paid:            { label: 'Pagado',     bg: '#EFF6FF', color: '#2563EB' },
  shipped:         { label: 'Enviado',    bg: '#F0FDF4', color: '#16A34A' },
  cancelled:       { label: 'Cancelado', bg: '#FEF2F2', color: '#DC2626' },
}

const STATUS_OPTIONS = ['pending_payment', 'paid', 'shipped', 'cancelled']

const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: '0.04em',
    }}>{cfg.label}</span>
  )
}

function OrderRow({ order, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const navigate = useNavigate()

  const changeStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await api.put(`/orders/${order.id}/status`, { status: newStatus })
      onStatusChange(order.id, newStatus)
    } catch { /* ignore */ }
    setUpdating(false)
  }

  const createdAt = order.created_at
    ? new Date(order.created_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <>
      <tr style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#FDFBFA'}
        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
      >
        <td style={td}><span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#1E1A1A' }}>#{order.order_number || (10000 + order.id)}</span></td>
        <td style={td}><span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280' }}>{createdAt}</span></td>
        <td style={td}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A' }}>{order.customer_nombre} {order.customer_apellido}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF' }}>{order.customer_email}</div>
        </td>
        <td style={td}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280' }}>
            {(order.items || []).length} prod · {order.delivery_type === 'pickup' ? '📍 Recojo' : '🚚 Domicilio'}
          </span>
        </td>
        <td style={td}><span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#1E1A1A' }}>{fmt(order.total)}</span></td>
        <td style={td}><StatusBadge status={order.status} /></td>
        <td style={{ ...td, textAlign: 'right' }}>
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: '1px solid #EDE8E4', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Ver
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: '0 12px 16px', background: '#FDFAF9' }}>
            <div style={{ border: '1px solid #EDE8E4', borderRadius: 12, padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Left: Customer + Delivery */}
              <div>
                <Section label="Cliente">
                  <Info k="Nombre"  v={`${order.customer_nombre} ${order.customer_apellido}`} />
                  <Info k="Correo"  v={order.customer_email} />
                  <Info k="DNI"     v={order.customer_dni} />
                  <Info k="Celular" v={order.customer_celular} />
                </Section>
                <Section label="Entrega" mt>
                  {order.delivery_type === 'pickup' ? (
                    <>
                      <Info k="Tipo"      v="Recojo en punto" />
                      <Info k="Punto"     v={order.delivery_data?.point_name} />
                      <Info k="Dirección" v={order.delivery_data?.point_address} />
                    </>
                  ) : (
                    <>
                      <Info k="Tipo"          v="Domicilio" />
                      <Info k="Departamento"  v={order.delivery_data?.department} />
                      <Info k="Provincia"     v={order.delivery_data?.province} />
                      <Info k="Distrito"      v={order.delivery_data?.district} />
                      <Info k="Dirección"     v={order.delivery_data?.address} />
                    </>
                  )}
                </Section>
              </div>

              {/* Right: Items + Totals + Actions */}
              <div>
                <Section label="Productos">
                  {(order.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#374151', marginBottom: 6 }}>
                      <span>{item.name}{item.variant_color ? ` (${item.variant_color})` : ''} x{item.quantity}</span>
                      <span style={{ fontWeight: 500 }}>{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 8, paddingTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                      <span>Envío</span><span>{fmt(order.shipping_cost)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#1E1A1A' }}>
                      <span>Total</span><span>{fmt(order.total)}</span>
                    </div>
                  </div>
                </Section>

                <Section label="Cambiar estado" mt>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} onClick={() => changeStatus(s)} disabled={updating || order.status === s} style={{
                        padding: '6px 14px', borderRadius: 20, border: '1px solid',
                        borderColor: order.status === s ? '#1E1A1A' : '#EDE8E4',
                        background: order.status === s ? '#1E1A1A' : '#fff',
                        color: order.status === s ? '#FAF7F4' : '#6B7280',
                        fontFamily: "'Inter', sans-serif", fontSize: 11, cursor: updating || order.status === s ? 'default' : 'pointer',
                        opacity: updating ? 0.6 : 1, transition: 'all 0.15s',
                      }}>
                        {STATUS_CONFIG[s]?.label}
                      </button>
                    ))}
                  </div>
                </Section>

                {order.mp_payment_id && (
                  <div style={{ marginTop: 12, fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF' }}>
                    MP Payment ID: {order.mp_payment_id}
                  </div>
                )}
                {order.sale_id && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() => navigate(`/ventas?highlight=${order.sale_id}`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#16A34A', fontWeight: 500 }}
                    >
                      <ExternalLink size={12} /> Ver venta generada
                    </button>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Section({ label, children, mt }) {
  return (
    <div style={{ marginTop: mt ? 16 : 0 }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  )
}

function Info({ k, v }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#374151', marginBottom: 4 }}>
      <span style={{ color: '#9CA3AF', minWidth: 80, flexShrink: 0 }}>{k}</span>
      <span>{v || '—'}</span>
    </div>
  )
}

export default function Pedidos() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/orders')
      setOrders(data)
    } catch { /* ignore */ }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const refresh = () => { setRefreshing(true); load() }

  const handleStatusChange = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ padding: '24px 28px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 22, color: '#0A0A0A', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Pedidos</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={refresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', opacity: refreshing ? 0.6 : 1 }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {STATUS_OPTIONS.map(s => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{cfg.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: cfg.color }}>{counts[s] || 0}</div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'Todos'], ...STATUS_OPTIONS.map(s => [s, STATUS_CONFIG[s].label])].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: filter === val ? '#1E1A1A' : '#F3F4F6',
            color: filter === val ? '#FAF7F4' : '#6B7280',
            fontSize: 12, letterSpacing: '0.04em', transition: 'all 0.15s',
          }}>{label} {val !== 'all' && counts[val] ? `(${counts[val]})` : ''}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 13 }}>Cargando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Package size={40} color="#EDE8E4" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>No hay pedidos {filter !== 'all' ? `con estado "${STATUS_CONFIG[filter]?.label}"` : 'aún'}</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                {['#', 'Fecha', 'Cliente', 'Detalle', 'Total', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const td = { padding: '14px 16px', verticalAlign: 'middle' }
