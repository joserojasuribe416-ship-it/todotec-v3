import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { Package, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Trash2, Plus, X, MessageCircle } from 'lucide-react'

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

function OrderRow({ order, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const navigate = useNavigate()

  const changeStatus = async (newStatus) => {
    const labels = { pending_payment: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', cancelled: 'Cancelado' }
    const extra = newStatus === 'paid' && !order.sale_id ? '\nEsto generará la venta y descontará el stock automáticamente.' : ''
    if (!confirm(`¿Cambiar estado a "${labels[newStatus]}"?${extra}`)) return
    setUpdating(true)
    try {
      await api.put(`/orders/${order.id}/status`, { status: newStatus })
      onStatusChange(order.id, newStatus)
    } catch { /* ignore */ }
    setUpdating(false)
  }

  const deleteOrder = async () => {
    if (!confirm(`¿Eliminar pedido #${order.order_number || (10000 + order.id)}? ${order.sale_id ? 'También se eliminará la venta enlazada y se revertirá el stock.' : ''}`)) return
    try {
      await api.delete(`/orders/${order.id}`)
      onDelete(order.id)
    } catch { /* ignore */ }
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
        <td style={td}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#1E1A1A' }}>#{order.order_number || (10000 + order.id)}</span>
          {order.source === 'manual' && (
            <div style={{ marginTop: 2 }}>
              <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, letterSpacing: '0.06em' }}>MANUAL</span>
            </div>
          )}
        </td>
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
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: '1px solid #EDE8E4', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Ver
            </button>
            <button onClick={deleteOrder} title="Eliminar pedido" style={{ background: 'none', border: '1px solid #FEE2E2', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#DC2626', display: 'inline-flex', alignItems: 'center' }}>
              <Trash2 size={13} />
            </button>
          </div>
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

const PICKUP_POINTS = [
  { name: 'Tienda Miraflores', address: 'Av. Larco 345, Miraflores' },
  { name: 'Tienda San Isidro', address: 'Av. Conquistadores 123, San Isidro' },
  { name: 'Tienda Surco', address: 'Av. Primavera 456, Santiago de Surco' },
  { name: 'Tienda La Molina', address: 'Av. La Molina 789, La Molina' },
  { name: 'Tienda San Borja', address: 'Av. San Luis 321, San Borja' },
]

function ManualOrderModal({ onSave, onClose }) {
  const [products, setProducts] = useState([])
  const [customer, setCustomer] = useState({ nombre: '', apellido: '', email: '', dni: '', celular: '' })
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [pickupPoint, setPickupPoint] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [cart, setCart] = useState([])
  const [selProduct, setSelProduct] = useState('')
  const [selVariant, setSelVariant] = useState('')
  const [qty, setQty] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/products').then(r => setProducts(r.data)) }, [])

  const selectedProduct = products.find(p => p.id === parseInt(selProduct))

  const addToCart = () => {
    if (!selectedProduct) return
    const variant = selVariant ? selectedProduct.variants?.find(v => v.id === parseInt(selVariant)) : null
    const key = `${selectedProduct.id}-${variant?.id || 'none'}`
    const existing = cart.findIndex(c => c._key === key)
    if (existing >= 0) {
      const nc = [...cart]; nc[existing].quantity += parseInt(qty); setCart(nc)
    } else {
      setCart(c => [...c, {
        _key: key,
        product_id: selectedProduct.id,
        name: selectedProduct.name,
        quantity: parseInt(qty),
        price: selectedProduct.sale_price,
        variant_color: variant?.color || '',
        image: variant?.image_url || selectedProduct.image_url || '',
      }])
    }
    setSelProduct(''); setSelVariant(''); setQty(1)
  }

  const removeFromCart = (key) => setCart(c => c.filter(x => x._key !== key))

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = deliveryType === 'delivery' ? (subtotal >= 200 ? 0 : 10) : 0
  const igv = subtotal * 0.18
  const total = subtotal + igv + shipping

  const save = async () => {
    if (cart.length === 0) return alert('Agrega al menos un producto')
    if (!customer.nombre) return alert('Ingresa el nombre del cliente')
    setSaving(true)
    try {
      const point = PICKUP_POINTS[pickupPoint]
      const delivery = deliveryType === 'pickup'
        ? { type: 'pickup', point_name: point.name, point_address: point.address }
        : { type: 'delivery', address: deliveryAddress, department: '', province: '', district: '' }

      const { data } = await api.post('/orders/manual', {
        customer,
        delivery,
        items: cart.map(({ _key, ...i }) => i),
        subtotal: Math.round(subtotal * 100) / 100,
        shipping_cost: shipping,
        total: Math.round(total * 100) / 100,
      })
      onSave(data)
      onClose()
    } catch(e) {
      alert(e.response?.data?.detail || 'Error al crear pedido')
    }
    setSaving(false)
  }

  const inp = { fontFamily: "'Inter', sans-serif", fontSize: 13, border: '1px solid #EDE8E4', borderRadius: 8, padding: '8px 12px', width: '100%', outline: 'none', background: '#fff', color: '#1E1A1A', boxSizing: 'border-box' }
  const lbl = { fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={18} color="#16A34A" />
            <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E1A1A' }}>Nuevo Pedido Manual</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Cliente */}
          <div>
            <p style={{ ...lbl, fontSize: 10, marginBottom: 10 }}>Datos del cliente</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Nombre', 'nombre'], ['Apellido', 'apellido'], ['Correo', 'email'], ['Celular', 'celular'], ['DNI', 'dni']].map(([label, field]) => (
                <div key={field}>
                  <label style={lbl}>{label}</label>
                  <input style={inp} value={customer[field]} onChange={e => setCustomer(c => ({ ...c, [field]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Productos */}
          <div>
            <p style={{ ...lbl, fontSize: 10, marginBottom: 10 }}>Productos</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <select style={{ ...inp, flex: 2, minWidth: 180 }} value={selProduct} onChange={e => { setSelProduct(e.target.value); setSelVariant('') }}>
                <option value="">Seleccionar producto...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {selectedProduct?.variants?.length > 0 && (
                <select style={{ ...inp, flex: 1, minWidth: 120 }} value={selVariant} onChange={e => setSelVariant(e.target.value)}>
                  <option value="">Color...</option>
                  {selectedProduct.variants.filter(v => v.stock > 0).map(v => (
                    <option key={v.id} value={v.id}>{v.color} (stock: {v.stock})</option>
                  ))}
                </select>
              )}
              <input style={{ ...inp, width: 60 }} type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} />
              <button onClick={addToCart} disabled={!selProduct} style={{ background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, opacity: selProduct ? 1 : 0.4 }}>
                Añadir
              </button>
            </div>
            {cart.length > 0 && (
              <div style={{ border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                {cart.map(item => (
                  <div key={item._key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F9F5F2' }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#1E1A1A' }}>{item.name}</span>
                      {item.variant_color && <span style={{ fontSize: 11, color: '#C49A8A', marginLeft: 6 }}>{item.variant_color}</span>}
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>x{item.quantity}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>S/ {(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item._key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entrega */}
          <div>
            <p style={{ ...lbl, fontSize: 10, marginBottom: 10 }}>Entrega</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[['pickup', '📍 Recojo en punto'], ['delivery', '🚚 Domicilio']].map(([val, label]) => (
                <button key={val} onClick={() => setDeliveryType(val)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1px solid ${deliveryType === val ? '#1E1A1A' : '#EDE8E4'}`, background: deliveryType === val ? '#1E1A1A' : '#fff', color: deliveryType === val ? '#FAF7F4' : '#6B7280', fontSize: 12, cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
            {deliveryType === 'pickup' ? (
              <select style={inp} value={pickupPoint} onChange={e => setPickupPoint(parseInt(e.target.value))}>
                {PICKUP_POINTS.map((p, i) => <option key={i} value={i}>{p.name} — {p.address}</option>)}
              </select>
            ) : (
              <input style={inp} placeholder="Dirección completa (calle, distrito, provincia, departamento)" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
            )}
          </div>

          {/* Totales */}
          {cart.length > 0 && (
            <div style={{ background: '#FAF7F4', borderRadius: 10, padding: '14px 18px' }}>
              {[['Subtotal', subtotal], ['IGV (18%)', igv], ['Envío', shipping]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                  <span>{label}</span><span>S/ {val.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#1E1A1A', borderTop: '1px solid #EDE8E4', paddingTop: 10, marginTop: 4 }}>
                <span>Total</span><span>S/ {total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #EDE8E4', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={save} disabled={saving || cart.length === 0} style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: '#1E1A1A', color: '#EEC5C5', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || cart.length === 0 ? 0.5 : 1 }}>
              {saving ? 'Creando...' : 'Crear Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Pedidos() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [showManual, setShowManual] = useState(false)

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

  const handleDelete = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const handleNewManual = (data) => {
    // Recargar la lista para mostrar el nuevo pedido
    load()
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowManual(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}>
            <Plus size={13} /> Pedido Manual
          </button>
          <button onClick={refresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Actualizar
          </button>
        </div>
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
                <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {showManual && <ManualOrderModal onSave={handleNewManual} onClose={() => setShowManual(false)} />}
    </div>
  )
}

const td = { padding: '14px 16px', verticalAlign: 'middle' }
