'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, ShoppingBag, Loader2, QrCode, CreditCard, Upload, X, Ticket } from 'lucide-react'
import { getImageUrl } from '../../lib/api'
import { loadCart, clearCart } from '../../lib/cartStorage'
import { isLoggedIn, getCustomer as getStoredCustomer, apiMe, getAppliedCoupon, clearAppliedCoupon, getToken, saveAppliedCoupon, apiCheckCoupon, apiMyCoupons } from '../../lib/customer'

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
const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
  const [paymentMethod, setPaymentMethod] = useState('mercadopago')
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const fileInputRef = useRef(null)

  const [coupon, setCoupon] = useState(null)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [couponOk, setCouponOk] = useState(false)
  const [couponErr, setCouponErr] = useState('')

  useEffect(() => {
    setCart(loadCart())
    setCoupon(getAppliedCoupon())
    if (isLoggedIn()) {
      apiMyCoupons().then(cs => setAvailableCoupons(cs.filter(c => !c.is_used))).catch(() => {})
    }
    // Cliente con sesión: precargar sus datos guardados (editables)
    if (isLoggedIn()) {
      const fill = (p) => {
        setCustomer(c => ({
          ...c,
          nombre: p.nombre || c.nombre, apellido: p.apellido || c.apellido,
          email: p.email || c.email, dni: p.dni || c.dni, celular: p.celular || c.celular,
        }))
        const dd = p.delivery_data || {}
        if (dd.address) {
          setDeliveryType('delivery')
          if (dd.department) setDept(dd.department)
          if (dd.province) setProvince(dd.province)
          if (dd.district) setDistrict(dd.district)
          setAddress(dd.address)
        }
      }
      const stored = getStoredCustomer()
      if (stored) fill(stored)
      apiMe().then(fill).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (step === 4) {
      fetch('/api/appearance/qr-image').then(r => r.json()).then(d => setQrImageUrl(d.qr_image_url || '')).catch(() => {})
    }
  }, [step])

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    const reader = new FileReader()
    reader.onload = ev => setScreenshotPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ── Cupones en el checkout ─────────────────────────────────────────────────
  const applyCheckoutCoupon = async (code) => {
    if (applyingCoupon) return
    setCouponErr(''); setCouponOk(false); setApplyingCoupon(true)
    try {
      const data = await apiCheckCoupon(code, cart.reduce((s, i) => s + i.price * i.quantity, 0))
      const applied = { code: data.code, percent: data.percent }
      saveAppliedCoupon(applied)
      setCoupon(applied)
      setCouponOk(true)
      setTimeout(() => setCouponOk(false), 2500)
    } catch (err) {
      setCouponErr(err.message)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const removeCheckoutCoupon = () => {
    clearAppliedCoupon()
    setCoupon(null)
    setCouponOk(false)
  }

  // Amounts — el cupón descuenta el subtotal; el IGV se calcula sobre lo descontado
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = coupon ? Math.round(subtotal * coupon.percent) / 100 : 0
  const igv = (subtotal - discount) * 0.18
  const shipping = subtotal >= 200 ? 0 : 10
  const total = subtotal - discount + igv + shipping

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

  // ── Build order body ──────────────────────────────────────────────────────
  const buildOrderBody = () => {
    const pickup = PICKUP_POINTS.find(p => p.id === pickupPoint) || PICKUP_POINTS[0]
    const delivery = deliveryType === 'pickup'
      ? { type: 'pickup', point_name: pickup.name, point_address: pickup.address }
      : { type: 'delivery', department: dept, province, district, address }
    return {
      items: cart.map(i => ({
        product_id: i.id || 0, name: i.name, quantity: i.quantity, price: i.price,
        variant_color: i.variant_color || '', image: i.image || '',
        pack_id: i.pack_id || null, pack_name: i.pack_name || '',
      })),
      customer: { ...customer },
      delivery,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping_cost: shipping,
      total: Math.round(total * 100) / 100,
      coupon_code: coupon?.code || '',
    }
  }

  // Cabeceras del pedido: incluye la sesión del cliente si existe
  const orderHeaders = () => {
    const h = { 'Content-Type': 'application/json' }
    const t = getToken()
    if (t) h['Authorization'] = `Bearer ${t}`
    return h
  }

  // ── Pay MercadoPago ───────────────────────────────────────────────────────
  const pay = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders/create-preference', {
        method: 'POST', headers: orderHeaders(),
        body: JSON.stringify(buildOrderBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error al procesar el pago')
      clearCart()
      clearAppliedCoupon()
      window.dispatchEvent(new Event('cartUpdated'))
      window.location.href = data.checkout_url
    } catch (e) {
      setError(e.message || 'Error inesperado')
      setLoading(false)
    }
  }

  // ── Pay QR ────────────────────────────────────────────────────────────────
  const payQR = async () => {
    if (!screenshotFile) { setError('Por favor sube la captura de tu pago'); return }
    setLoading(true)
    setError('')
    try {
      // 1. Crear pedido QR
      const res = await fetch('/api/orders/create-qr', {
        method: 'POST', headers: orderHeaders(),
        body: JSON.stringify(buildOrderBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error al crear el pedido')

      // 2. Subir captura
      const formData = new FormData()
      formData.append('file', screenshotFile)
      await fetch(`/api/orders/${data.order_id}/screenshot`, { method: 'POST', body: formData })

      // 3. Limpiar carrito + cupón y redirigir
      clearCart()
      clearAppliedCoupon()
      window.dispatchEvent(new Event('cartUpdated'))
      router.push(`/checkout/success?qr=1&order_id=${data.order_id}&order_number=${data.order_number}`)
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

      <div className="page-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
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

            {/* ── Cupones ── */}
            <div style={{ marginBottom: 14 }}>
              {coupon ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FDF0F0', border: '1px dashed #EEC5C5', borderRadius: 12, padding: '12px 14px' }}>
                  <Ticket size={16} color="#C49A8A" />
                  <div style={{ flex: 1, fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E1A1A' }}>{coupon.code}</span>
                    <span style={{ fontSize: 12, color: '#C49A8A', marginLeft: 8 }}>−{coupon.percent}% aplicado</span>
                    {couponOk && <span style={{ fontSize: 12, color: '#5B7B53', fontWeight: 500, marginLeft: 8 }}><Check size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Cupón agregado</span>}
                  </div>
                  <button onClick={removeCheckoutCoupon} title="Quitar cupón" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                    <X size={15} />
                  </button>
                </div>
              ) : availableCoupons.length > 0 ? (
                <div style={{ background: '#fff', border: '1px solid #EDE8E4', borderRadius: 12, padding: '14px 16px', opacity: applyingCoupon ? 0.55 : 1, pointerEvents: applyingCoupon ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Tus cupones disponibles — toca para aplicar
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {availableCoupons.map(cp => (
                      <button key={cp.code} onClick={() => applyCheckoutCoupon(cp.code)} disabled={applyingCoupon} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#FDF0F0', border: '1px dashed #EEC5C5', borderRadius: 20,
                        padding: '7px 14px', cursor: applyingCoupon ? 'wait' : 'pointer',
                        fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#1E1A1A', fontWeight: 500,
                      }}>
                        {applyingCoupon ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Ticket size={12} color="#C49A8A" />}
                        {cp.code} · −{cp.percent}%
                      </button>
                    ))}
                  </div>
                  {couponErr && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C0392B', marginTop: 8 }}>{couponErr}</p>}
                </div>
              ) : null}
            </div>

            {/* Totals */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', padding: '20px 22px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#C49A8A', fontWeight: 500, marginBottom: 10 }}>
                  <span>Descuento {coupon?.code} ({coupon?.percent}%)</span><span>−{fmt(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                <span>IGV (18%)</span><span>{fmt(igv)}</span>
              </div>
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
              <div className="co-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
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
              <div className="co-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginTop: 16 }}>
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
                <div className="co-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 16 }}>
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
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', padding: '20px 22px', marginBottom: 20 }}>
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
                {deliveryType === 'delivery' && address && <Row label="Dirección" value={address} />}
              </div>
              <div style={{ borderTop: '1px solid #F3EEE9', marginTop: 12, paddingTop: 12 }}>
                <Row label="Subtotal" value={fmt(subtotal)} />
                {discount > 0 && <Row label={`Descuento ${coupon?.code || ''}`} value={`−${fmt(discount)}`} />}
                <Row label="IGV (18%)" value={fmt(igv)} />
                <Row label="Envío" value={shipping === 0 ? 'Gratis' : fmt(shipping)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1E1A1A' }}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Selector método de pago */}
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Método de pago</p>
            <div className="co-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { id: 'mercadopago', icon: <CreditCard size={20} />, label: 'MercadoPago', sub: 'Tarjeta, Yape, billetera digital' },
                { id: 'qr',          icon: <QrCode size={20} />,    label: 'QR / Transferencia', sub: 'Yape, Plin, banco' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setPaymentMethod(opt.id)} style={{
                  padding: '16px 14px', borderRadius: 12,
                  border: `2px solid ${paymentMethod === opt.id ? '#1E1A1A' : '#EDE8E4'}`,
                  background: paymentMethod === opt.id ? '#1E1A1A' : '#fff',
                  color: paymentMethod === opt.id ? '#FAF7F4' : '#6B7280',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <div style={{ marginBottom: 6, color: paymentMethod === opt.id ? '#EEC5C5' : '#9CA3AF' }}>{opt.icon}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, opacity: 0.7 }}>{opt.sub}</div>
                </button>
              ))}
            </div>

            {/* MercadoPago */}
            {paymentMethod === 'mercadopago' && (
              <div>
                {error && <p style={errorStyle}>{error}</p>}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={back} style={btnSecondary} disabled={loading}>← Volver</button>
                  <button onClick={pay} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                    {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</> : '🔒 Pagar con MercadoPago'}
                  </button>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 14 }}>
                  Serás redirigido a MercadoPago para completar el pago de forma segura.
                </p>
              </div>
            )}

            {/* QR */}
            {paymentMethod === 'qr' && (
              <div>
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE8E4', padding: '24px 22px', marginBottom: 16 }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Instrucciones de pago</p>

                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* QR Image */}
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      {qrImageUrl ? (
                        <img src={qrImageUrl} alt="QR de pago" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 10, border: '1px solid #EDE8E4' }} />
                      ) : (
                        <div style={{ width: 160, height: 160, borderRadius: 10, border: '2px dashed #EDE8E4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                          <QrCode size={40} color="#EEC5C5" />
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF' }}>QR próximamente</span>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ background: '#FAF7F4', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#1E1A1A', fontWeight: 600, marginBottom: 4 }}>
                          Transferir a nombre de:
                        </p>
                        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 18, letterSpacing: '0.06em', color: '#C49A8A', fontWeight: 400 }}>
                          Jose Rojas Uribe
                        </p>
                      </div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                        1. Escanea el QR con Yape, Plin u otro app de pago.<br />
                        2. Transfiere el monto exacto: <strong style={{ color: '#1E1A1A' }}>{fmt(total)}</strong><br />
                        3. Toma una captura de pantalla del pago confirmado.<br />
                        4. Súbela abajo y haz clic en <strong>Enviar pedido</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Screenshot upload */}
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Captura de pago *</p>
                    {screenshotPreview ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={screenshotPreview} alt="Captura" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1px solid #EDE8E4', objectFit: 'contain' }} />
                        <button onClick={() => { setScreenshotFile(null); setScreenshotPreview('') }} style={{ position: 'absolute', top: 6, right: 6, background: '#1E1A1A', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <X size={12} color="#FAF7F4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{ border: '2px dashed #EDE8E4', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#C49A8A'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#EDE8E4'}
                      >
                        <Upload size={24} color="#EEC5C5" style={{ marginBottom: 8 }} />
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Haz clic para subir la captura</p>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF' }}>PNG, JPG o screenshot</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScreenshotChange} style={{ display: 'none' }} />
                  </div>
                </div>

                {error && <p style={errorStyle}>{error}</p>}

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={back} style={btnSecondary} disabled={loading}>← Volver</button>
                  <button onClick={payQR} disabled={loading || !screenshotFile} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, opacity: (loading || !screenshotFile) ? 0.6 : 1 }}>
                    {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : '✓ Enviar pedido'}
                  </button>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 14 }}>
                  Tu pedido quedará pendiente hasta que confirmemos la recepción del pago.
                </p>
              </div>
            )}
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
