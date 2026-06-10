'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, ArrowLeft, CreditCard, MessageCircle, Plus, Minus, ShoppingBag, Ticket, X, Check, Loader2 } from 'lucide-react'
import Lk from 'next/link'
import { getImageUrl } from '../../lib/api'
import { loadCart, storeCart } from '../../lib/cartStorage'
import { isLoggedIn, getAppliedCoupon, saveAppliedCoupon, clearAppliedCoupon, apiCheckCoupon, apiMyCoupons } from '../../lib/customer'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [coupon, setCoupon] = useState(null)          // { code, percent }
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponOk, setCouponOk] = useState(false)     // "Cupón agregado"
  const [applying, setApplying] = useState(false)     // sombreado mientras carga
  const [available, setAvailable] = useState([])      // cupones sin usar del cliente
  const [logged, setLogged] = useState(false)

  useEffect(() => {
    setCart(loadCart())
    setCoupon(getAppliedCoupon())
    const li = isLoggedIn()
    setLogged(li)
    if (li) apiMyCoupons().then(cs => setAvailable(cs.filter(c => !c.is_used))).catch(() => {})
  }, [])

  const updateCart = (newCart) => {
    setCart(newCart)
    storeCart(newCart)
    window.dispatchEvent(new Event('cartUpdated'))
  }
  const updateQty = (key, delta) => updateCart(cart.map(i => i.key === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  const remove = (key) => updateCart(cart.filter(i => i.key !== key))
  const clear = () => updateCart([])

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  // El cupón descuenta sobre el subtotal; el IGV se calcula sobre lo ya descontado
  const discount = coupon ? Math.round(subtotal * coupon.percent) / 100 : 0
  const igv = (subtotal - discount) * 0.18
  const total = subtotal - discount + igv

  const applyCoupon = async (codeArg) => {
    const code = (codeArg || couponInput).trim().toUpperCase()
    if (!code || applying) return
    setCouponError(''); setCouponOk(false); setApplying(true)
    try {
      const data = await apiCheckCoupon(code, subtotal)
      const applied = { code: data.code, percent: data.percent }
      saveAppliedCoupon(applied)
      setCoupon(applied)
      setCouponInput('')
      setCouponOk(true)
      setTimeout(() => setCouponOk(false), 2500)
    } catch (err) {
      setCouponError(err.message)
    } finally {
      setApplying(false)
    }
  }

  const removeCoupon = () => {
    clearAppliedCoupon()
    setCoupon(null)
    setCouponOk(false)
  }

  const goCheckout = () => router.push('/checkout')

  const whatsappMsg = () => {
    if (!cart.length) return
    const lines = cart.map(i => `• ${i.name}${i.variant_color ? ` (${i.variant_color})` : ''} x${i.quantity} = ${fmt(i.price * i.quantity)}`)
    const msg = `Hola, quisiera hacer un pedido:\n\n${lines.join('\n')}\n\nTotal: ${fmt(total)}`
    window.open(`https://wa.me/51904811639?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1E1A1A', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10 }}>Mi pedido</p>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF7F4', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
            Carrito
          </h1>
        </div>
      </div>

      <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 52, fontWeight: 100, color: '#EEC5C5', letterSpacing: '0.1em', marginBottom: 16 }}>✦</div>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 18, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tu carrito está vacío</h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: '#9CA3AF', marginBottom: 28, fontWeight: 300, fontSize: 13 }}>Explora nuestro catálogo y encuentra tu rutina ideal</p>
            <Link href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#1E1A1A', color: '#EEC5C5',
              padding: '12px 28px', borderRadius: 8, textDecoration: 'none',
              fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase'
            }}>Ver catálogo</Link>
          </div>
        ) : (
          <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map(item => (
                <div key={item.key} className="cart-item" style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: '#fff', borderRadius: 14, padding: '16px',
                  border: '1px solid #EDE8E4'
                }}>
                  <div style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', background: '#FDF0F0', flexShrink: 0 }}>
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={22} color="#EEC5C5" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 13, color: '#1E1A1A', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.3 }}>{item.name}</div>
                    {item.variant_color && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C49A8A', marginTop: 3, letterSpacing: '0.04em' }}>{item.variant_color}</div>}
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A', fontWeight: 400, marginTop: 4 }}>{fmt(item.price)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => updateQty(item.key, -1)} style={{ width: 30, height: 30, border: '1px solid #EDE8E4', borderRadius: 6, background: '#FAF7F4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E1A1A' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.key, 1)} style={{ width: 30, height: 30, border: '1px solid #EDE8E4', borderRadius: 6, background: '#FAF7F4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E1A1A' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, color: '#1E1A1A' }}>{fmt(item.price * item.quantity)}</div>
                    <button onClick={() => remove(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C49A8A', marginTop: 6 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C49A8A', fontSize: 11, fontFamily: "'Inter', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}>
                <Trash2 size={12} /> Vaciar carrito
              </button>
            </div>

            {/* Summary */}
            <div>
              <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #EDE8E4', position: 'sticky', top: 24 }}>
                <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 14, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>Resumen</div>
                {/* ── Cupón ── */}
                <div style={{ marginBottom: 16 }}>
                  {coupon ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FDF0F0', border: '1px dashed #EEC5C5', borderRadius: 10, padding: '10px 12px' }}>
                      <Ticket size={15} color="#C49A8A" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#1E1A1A' }}>
                          {coupon.code}
                          {couponOk && <span style={{ color: '#5B7B53', fontWeight: 500, marginLeft: 8 }}><Check size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> Cupón agregado</span>}
                        </div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A' }}>−{coupon.percent}% aplicado</div>
                      </div>
                      <button onClick={removeCoupon} title="Quitar cupón" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : logged ? (
                    <div style={{ opacity: applying ? 0.55 : 1, pointerEvents: applying ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                      {/* Tus cupones disponibles: un click y listo */}
                      {available.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Tus cupones disponibles</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {available.map(cp => (
                              <button key={cp.code} onClick={() => applyCoupon(cp.code)} disabled={applying} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: '#FDF0F0', border: '1px dashed #EEC5C5', borderRadius: 20,
                                padding: '6px 12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                fontSize: 11, color: '#1E1A1A', fontWeight: 500,
                              }}>
                                <Ticket size={11} color="#C49A8A" /> {cp.code} · −{cp.percent}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={couponInput}
                          onChange={e => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Código de cupón"
                          disabled={applying}
                          style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid #EDE8E4', borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 12, outline: 'none', background: '#FAF7F4', color: '#1E1A1A' }}
                        />
                        <button onClick={() => applyCoupon()} disabled={applying} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEC5C5', color: '#1E1A1A', border: 'none', borderRadius: 8, padding: '0 16px', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', cursor: applying ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                          {applying ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Aplicando...</> : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C0392B', marginTop: 6 }}>{couponError}</p>}
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', background: '#FAF7F4', border: '1px dashed #EDE8E4', borderRadius: 10, padding: '10px 12px', lineHeight: 1.5 }}>
                      <Ticket size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
                      ¿Tienes un cupón? <Lk href="/login" style={{ color: '#C49A8A', fontWeight: 500 }}>Inicia sesión</Lk> para usarlo
                      {' '}o <Lk href="/register" style={{ color: '#C49A8A', fontWeight: 500 }}>crea tu cuenta</Lk> y obtén 30%.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', fontWeight: 300 }}>
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#C49A8A', fontWeight: 500 }}>
                      <span><Check size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Descuento ({coupon.percent}%)</span><span>−{fmt(discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', fontWeight: 300 }}>
                    <span>IGV (18%)</span><span>{fmt(igv)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#1E1A1A', fontWeight: 500, borderTop: '1px solid #EDE8E4', paddingTop: 12, marginTop: 4 }}>
                    <span>Total</span><span>{fmt(total)}</span>
                  </div>
                </div>

                <button onClick={goCheckout} style={{
                  width: '100%', marginTop: 24, background: '#1E1A1A', color: '#EEC5C5',
                  border: 'none', borderRadius: 10, padding: '14px 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 400,
                  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3A3434'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1E1A1A'}
                >
                  <CreditCard size={15} /> Proceder al pago
                </button>
                <button onClick={whatsappMsg} style={{
                  width: '100%', marginTop: 10, background: 'none', color: '#9CA3AF',
                  border: '1px solid #EDE8E4', borderRadius: 10, padding: '11px 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400,
                  letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}>
                  <MessageCircle size={13} /> Pedir por WhatsApp
                </button>

                <Link href="/catalog" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginTop: 14, fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF',
                  textDecoration: 'none', letterSpacing: '0.06em'
                }}>
                  <ArrowLeft size={13} /> Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
