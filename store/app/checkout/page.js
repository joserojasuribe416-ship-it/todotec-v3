'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, ShoppingBag, Loader2 } from 'lucide-react'
import { getImageUrl } from '../../lib/api'

// ── Puntos de recojo ──────────────────────────────────────────────────────────
const PICKUP_POINTS = [
  { id: 'molina',     name: 'La Molina',   address: 'Av. La Molina 1234, La Molina' },
  { id: 'miraflores', name: 'Miraflores',  address: 'Av. Larco 456, Miraflores' },
  { id: 'sanisidro',  name: 'San Isidro',  address: 'Calle Los Libertadores 789, San Isidro' },
  { id: 'surco',      name: 'Surco',       address: 'Av. Caminos del Inca 321, Surco' },
  { id: 'sanborja',   name: 'San Borja',   address: 'Av. San Luis 654, San Borja' },
]

// ── Ubigeo Perú ───────────────────────────────────────────────────────────────
const UBIGEO = {
  "Lima":          ["Lima","Barranca","Cajatambo","Canta","Cañete","Huaral","Huarochirí","Huaura","Oyón","Yauyos"],
  "Arequipa":      ["Arequipa","Camaná","Caravelí","Castilla","Caylloma","Condesuyos","Islay","La Unión"],
  "La Libertad":   ["Trujillo","Ascope","Bolívar","Chepén","Gran Chimú","Julcán","Otuzco","Pacasmayo","Pataz","Sánchez Carrión","Santiago de Chuco","Virú"],
  "Piura":         ["Piura","Ayabaca","Huancabamba","Morropón","Paita","Sechura","Sullana","Talara"],
  "Cusco":         ["Cusco","Acomayo","Anta","Calca","Canas","Canchis","Chumbivilcas","Espinar","La Convención","Paruro","Paucartambo","Quispicanchi","Urubamba"],
  "Junín":         ["Huancayo","Chanchamayo","Chupaca","Concepción","Jauja","Junín","Satipo","Tarma","Yauli"],
  "Áncash":        ["Huaraz","Aija","Bolognesi","Carhuaz","Casma","Corongo","Huari","Huarmey","Huaylas","Ocros","Pallasca","Pomabamba","Recuay","Santa","Sihuas","Yungay"],
  "Lambayeque":    ["Chiclayo","Ferreñafe","Lambayeque"],
  "Callao":        ["Callao"],
  "Ica":           ["Ica","Chincha","Nazca","Palpa","Pisco"],
  "Loreto":        ["Maynas","Alto Amazonas","Datem del Marañón","Loreto","Mariscal Ramón Castilla","Putumayo","Requena","Ucayali"],
  "San Martín":    ["Moyobamba","Bellavista","El Dorado","Huallaga","Lamas","Mariscal Cáceres","Picota","Rioja","San Martín","Tocache"],
  "Cajamarca":     ["Cajamarca","Cajabamba","Celendín","Chota","Contumazá","Cutervo","Hualgayoc","Jaén","San Ignacio","San Marcos","San Miguel","San Pablo","Santa Cruz"],
  "Huánuco":       ["Huánuco","Ambo","Dos de Mayo","Huacaybamba","Huamalíes","Lauricocha","Leoncio Prado","Marañón","Pachitea","Puerto Inca","Yarowilca"],
  "Puno":          ["Puno","Azángaro","Carabaya","Chucuito","El Collao","Huancané","Lampa","Melgar","Moho","San Antonio de Putina","San Román","Sandia","Yunguyo"],
  "Ayacucho":      ["Huamanga","Cangallo","Huanca Sancos","Huanta","La Mar","Lucanas","Parinacochas","Páucar del Sara Sara","Sucre","Víctor Fajardo","Vilcas Huamán"],
  "Ucayali":       ["Coronel Portillo","Atalaya","Padre Abad","Purús"],
  "Apurímac":      ["Abancay","Andahuaylas","Antabamba","Aymaraes","Cotabambas","Chincheros","Grau"],
  "Moquegua":      ["Mariscal Nieto","General Sánchez Cerro","Ilo"],
  "Tacna":         ["Tacna","Candarave","Jorge Basadre","Tarata"],
  "Huancavelica":  ["Huancavelica","Acobamba","Angaraes","Castrovirreyna","Churcampa","Huaytará","Tayacaja"],
  "Tumbes":        ["Tumbes","Contralmirante Villar","Zarumilla"],
  "Amazonas":      ["Chachapoyas","Bagua","Bongará","Condorcanqui","Luya","Rodríguez de Mendoza","Utcubamba"],
  "Pasco":         ["Pasco","Daniel Alcides Carrión","Oxapampa"],
  "Madre de Dios": ["Tambopata","Manu","Tahuamanu"],
}

const DEPARTMENTS = Object.keys(UBIGEO).sort()

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1px solid #EDE8E4', borderRadius: 8,
  fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const labelStyle = {
  fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF',
  letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6,
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current }) {
  const steps = ['Resumen', 'Datos', 'Entrega', 'Pago']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#B5C4B1' : active ? '#1E1A1A' : '#EDE8E4',
                color: done || active ? '#FAF7F4' : '#9CA3AF',
                fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: 500, flexShrink: 0,
              }}>
                {done ? <Check size={14} /> : n}
              </div>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: active ? '#1E1A1A' : '#9CA3AF', whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: n < current ? '#B5C4B1' : '#EDE8E4', margin: '0 8px', marginBottom: 20 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [step, setStep] = useState(1)
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [customer, setCustomer] = useState({ nombre: '', apellido: '', email: '', dni: '', celular: '' })
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [pickupPoint, setPickupPoint] = useState(PICKUP_POINTS[0].id)
  const [dept, setDept] = useState('Lima')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    try { setCart(JSON.parse(sessionStorage.getItem('cart') || '[]')) } catch { setCart([]) }
  }, [])

  // Amounts
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const igv = subtotal * 0.18
  const shipping = subtotal >= 200 ? 0 : 10
  const total = subtotal + igv + shipping

  if (cart.length === 0 && step < 4) {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <ShoppingBag size={40} color="#EEC5C5" style={{ marginBottom: 16 }} />
          <p style={{ fontFamily: "'Inter', sans-serif", color: '#9CA3AF', marginBottom: 20 }}>Tu carrito está vacío</p>
          <Link href="/catalog" style={{ background: '#1E1A1A', color: '#EEC5C5', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ver catálogo</Link>
        </div>
      </div>
    )
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep2 = () => {
    const { nombre, apellido, email, dni, celular } = customer
    if (!nombre.trim() || !apellido.trim()) return 'Ingresa tu nombre y apellido'
    if (!email.includes('@')) return 'Correo inválido'
    if (dni.length < 8) return 'DNI debe tener 8 dígitos'
    if (celular.length < 9) return 'Celular inválido'
    return ''
  }

  const validateStep3 = () => {
    if (deliveryType === 'delivery') {
      if (!dept) return 'Selecciona un departamento'
      if (!province) return 'Selecciona una provincia'
      if (!address.trim()) return 'Ingresa tu dirección'
    }
    return ''
  }

  const next = () => {
    setError('')
    if (step === 1 && !confirmed) { setError('Confirma que revisaste tu pedido'); return }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    if (step === 3) {
      const err = validateStep3()
      if (err) { setError(err); return }
    }
    setStep(s => s + 1)
  }

  const back = () => { setError(''); setStep(s => s - 1) }

  // ── Pay ───────────────────────────────────────────────────────────────────
  const pay = async () => {
    setLoading(true)
    setError('')
    try {
      const pickup = PICKUP_POINTS.find(p => p.id === pickupPoint) || PICKUP_POINTS[0]
      const delivery = deliveryType === 'pickup'
        ? { type: 'pickup', point_name: pickup.name, point_address: pickup.address }
        : { type: 'delivery', department: dept, province, district, address }

      const body = {
        items: cart.map(i => ({
          product_id: i.id || 0,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          variant_color: i.variant_color || '',
          image: i.image || '',
        })),
        customer: { ...customer },
        delivery,
        subtotal: Math.round(subtotal * 100) / 100,
        shipping_cost: shipping,
        total: Math.round(total * 100) / 100,
      }

      const res = await fetch('/api/orders/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error al procesar el pago')

      // Limpiar carrito y redirigir a MercadoPago
      sessionStorage.setItem('cart', '[]')
      window.dispatchEvent(new Event('cartUpdated'))
      window.location.href = data.checkout_url
    } catch (e) {
      setError(e.message || 'Error inesperado')
      setLoading(false)
    }
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1E1A1A', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10 }}>Compra segura</p>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF7F4', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
            Checkout
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <StepBar current={step} />

        {/* ── STEP 1: RESUMEN ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E1A1A', marginBottom: 20 }}>Resumen del pedido</h2>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', overflow: 'hidden', marginBottom: 20 }}>
              {cart.map((item, idx) => (
                <div key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderBottom: idx < cart.length - 1 ? '1px solid #F3EEE9' : 'none',
                }}>
                  <div style={{ width: 54, height: 54, borderRadius: 8, overflow: 'hidden', background: '#FDF0F0', flexShrink: 0 }}>
                    {item.image
                      ? <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={18} color="#EEC5C5" /></div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 13, color: '#1E1A1A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.name}</div>
                    {item.variant_color && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C49A8A', marginTop: 2 }}>{item.variant_color}</div>}
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>x{item.quantity}</div>
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#1E1A1A' }}>{fmt(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', padding: '20px 22px', marginBottom: 20 }}>
              {[
                ['Subtotal', subtotal],
                ['IGV (18%)', igv],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                  <span>{label}</span><span>{fmt(val)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                <span>Envío</span>
                <span style={{ color: shipping === 0 ? '#B5C4B1' : '#1E1A1A', fontWeight: shipping === 0 ? 500 : 400 }}>
                  {shipping === 0 ? 'Gratis' : fmt(shipping)}
                </span>
              </div>
              {subtotal > 0 && subtotal < 200 && (
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C49A8A', marginBottom: 12, letterSpacing: '0.02em' }}>
                  ✦ Envío gratis a partir de S/ 200 — te faltan {fmt(200 - subtotal)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1E1A1A', borderTop: '1px solid #EDE8E4', paddingTop: 14 }}>
                <span>Total a pagar</span><span>{fmt(total)}</span>
              </div>
            </div>

            {/* Confirm checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
              <div onClick={() => setConfirmed(c => !c)} style={{
                width: 20, height: 20, borderRadius: 5, border: `2px solid ${confirmed ? '#1E1A1A' : '#D1C9C0'}`,
                background: confirmed ? '#1E1A1A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {confirmed && <Check size={12} color="#FAF7F4" />}
              </div>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B4444', lineHeight: 1.5 }}>
                Confirmo que revisé los productos de mi pedido y los datos son correctos.
              </span>
            </label>

            {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C49A8A', marginBottom: 16 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/cart" style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', textDecoration: 'none', letterSpacing: '0.06em' }}>
                <ArrowLeft size={13} /> Volver
              </Link>
              <button onClick={next} style={btnPrimary}>Continuar</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: DATOS PERSONALES ── */}
        {step === 2 && (
          <div>
            <h2 style={sectionTitle}>Datos personales</h2>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', padding: '24px 22px', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                {[
                  ['nombre', 'Nombre'],
                  ['apellido', 'Apellido'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      style={inputStyle}
                      value={customer[field]}
                      onChange={e => setCustomer(c => ({ ...c, [field]: e.target.value }))}
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Correo electrónico</label>
                <input style={inputStyle} type="email" value={customer.email}
                  onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} placeholder="correo@ejemplo.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginTop: 16 }}>
                <div>
                  <label style={labelStyle}>DNI</label>
                  <input style={inputStyle} value={customer.dni} maxLength={8}
                    onChange={e => setCustomer(c => ({ ...c, dni: e.target.value.replace(/\D/g, '') }))} placeholder="12345678" />
                </div>
                <div>
                  <label style={labelStyle}>Celular</label>
                  <input style={inputStyle} value={customer.celular} maxLength={9}
                    onChange={e => setCustomer(c => ({ ...c, celular: e.target.value.replace(/\D/g, '') }))} placeholder="987654321" />
                </div>
              </div>
            </div>

            {error && <p style={errorStyle}>{error}</p>}
            <NavButtons onBack={back} onNext={next} />
          </div>
        )}

        {/* ── STEP 3: ENTREGA ── */}
        {step === 3 && (
          <div>
            <h2 style={sectionTitle}>Método de entrega</h2>
            {/* Toggle */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
              {[['pickup', 'Recojo en punto'], ['delivery', 'Entrega a domicilio']].map(([val, label]) => (
                <button key={val} onClick={() => setDeliveryType(val)} style={{
                  flex: 1, padding: '13px 0', borderRadius: 10, border: `2px solid ${deliveryType === val ? '#1E1A1A' : '#EDE8E4'}`,
                  background: deliveryType === val ? '#1E1A1A' : '#fff', color: deliveryType === val ? '#FAF7F4' : '#6B7280',
                  fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* Pickup */}
            {deliveryType === 'pickup' && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', overflow: 'hidden', marginBottom: 22 }}>
                {PICKUP_POINTS.map((pt, idx) => (
                  <label key={pt.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', cursor: 'pointer',
                    borderBottom: idx < PICKUP_POINTS.length - 1 ? '1px solid #F3EEE9' : 'none',
                    background: pickupPoint === pt.id ? '#FAF7F4' : '#fff', transition: 'background 0.1s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', border: `2px solid ${pickupPoint === pt.id ? '#1E1A1A' : '#D1C9C0'}`,
                      background: pickupPoint === pt.id ? '#1E1A1A' : '#fff', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {pickupPoint === pt.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FAF7F4' }} />}
                    </div>
                    <input type="radio" name="pickup" value={pt.id} checked={pickupPoint === pt.id}
                      onChange={() => setPickupPoint(pt.id)} style={{ display: 'none' }} />
                    <div>
                      <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: 13, color: '#1E1A1A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{pt.name}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{pt.address}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Delivery */}
            {deliveryType === 'delivery' && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', padding: '22px 22px', marginBottom: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Departamento</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={dept} onChange={e => { setDept(e.target.value); setProvince('') }}>
                      <option value="">— Selecciona —</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Provincia</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={province} onChange={e => setProvince(e.target.value)} disabled={!dept}>
                      <option value="">— Selecciona —</option>
                      {(UBIGEO[dept] || []).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Distrito</label>
                  <input style={inputStyle} value={district} onChange={e => setDistrict(e.target.value)} placeholder="Ej: Surco" />
                </div>
                <div>
                  <label style={labelStyle}>Dirección completa</label>
                  <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Av. Los Álamos 123, Dpto 201" />
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C49A8A', marginTop: 12 }}>
                  ✦ Costo de envío: {shipping === 0 ? 'Gratis' : fmt(shipping)}
                </p>
              </div>
            )}

            {error && <p style={errorStyle}>{error}</p>}
            <NavButtons onBack={back} onNext={next} />
          </div>
        )}

        {/* ── STEP 4: PAGO ── */}
        {step === 4 && (
          <div>
            <h2 style={sectionTitle}>Confirma y paga</h2>

            {/* Mini resumen */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', padding: '20px 22px', marginBottom: 16 }}>
              <Row label="Cliente" value={`${customer.nombre} ${customer.apellido}`} />
              <Row label="Correo" value={customer.email} />
              <Row label="DNI" value={customer.dni} />
              <Row label="Celular" value={customer.celular} />
              <div style={{ borderTop: '1px solid #F3EEE9', marginTop: 12, paddingTop: 12 }}>
                <Row label="Entrega" value={
                  deliveryType === 'pickup'
                    ? `Recojo en ${PICKUP_POINTS.find(p => p.id === pickupPoint)?.name}`
                    : `Domicilio — ${dept}, ${province}${district ? ', ' + district : ''}`
                } />
                {deliveryType === 'delivery' && address && (
                  <Row label="Dirección" value={address} />
                )}
              </div>
              <div style={{ borderTop: '1px solid #F3EEE9', marginTop: 12, paddingTop: 12 }}>
                <Row label="Subtotal" value={fmt(subtotal)} />
                <Row label="IGV (18%)" value={fmt(igv)} />
                <Row label="Envío" value={shipping === 0 ? 'Gratis' : fmt(shipping)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1E1A1A' }}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {error && <p style={errorStyle}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={back} style={btnSecondary} disabled={loading}>← Volver</button>
              <button onClick={pay} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</> : '🔒 Pagar con MercadoPago'}
              </button>
            </div>

            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
              Serás redirigido a MercadoPago para completar el pago de forma segura.
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
      <span style={{ color: '#9CA3AF', minWidth: 80 }}>{label}</span>
      <span style={{ color: '#1E1A1A', textAlign: 'right', maxWidth: 280 }}>{value}</span>
    </div>
  )
}

function NavButtons({ onBack, onNext }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button onClick={onBack} style={btnSecondary}>← Volver</button>
      <button onClick={onNext} style={btnPrimary}>Continuar</button>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const sectionTitle = {
  fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 15,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E1A1A', marginBottom: 20,
}

const errorStyle = {
  fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C49A8A', marginBottom: 16,
}

const btnPrimary = {
  background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 10,
  padding: '13px 32px', fontFamily: "'Inter', sans-serif", fontSize: 12,
  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 400,
}

const btnSecondary = {
  background: 'none', border: '1px solid #EDE8E4', borderRadius: 10,
  padding: '13px 20px', fontFamily: "'Inter', sans-serif", fontSize: 11,
  color: '#9CA3AF', letterSpacing: '0.06em', cursor: 'pointer',
}
