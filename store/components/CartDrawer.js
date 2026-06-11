'use client'
// Mini-carrito lateral: se abre con el ícono del carrito (o al agregar un
// producto) sin sacar al cliente de la página donde está comprando.
// Cerrar = X o tocar el fondo oscuro. En móvil ocupa ~92% del ancho.
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, Ticket } from 'lucide-react'
import { getImageUrl } from '../lib/api'
import { loadCart, storeCart } from '../lib/cartStorage'
import { getAppliedCoupon } from '../lib/customer'

const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

export default function CartDrawer() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)   // controla la animación de entrada
  const [cart, setCart] = useState([])
  const [coupon, setCoupon] = useState(null)

  const refresh = useCallback(() => {
    setCart(loadCart())
    setCoupon(getAppliedCoupon())
  }, [])

  // Abrir desde cualquier parte: window.dispatchEvent(new Event('openCartDrawer'))
  useEffect(() => {
    const onOpen = () => { refresh(); setOpen(true); requestAnimationFrame(() => setVisible(true)) }
    const onCart = () => refresh()
    window.addEventListener('openCartDrawer', onOpen)
    window.addEventListener('cartUpdated', onCart)
    return () => {
      window.removeEventListener('openCartDrawer', onOpen)
      window.removeEventListener('cartUpdated', onCart)
    }
  }, [refresh])

  // Bloquear el scroll de la página de fondo mientras el panel está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => {
    setVisible(false)
    setTimeout(() => setOpen(false), 250)  // espera a que termine la animación
  }

  const updateQty = (key, delta) => {
    const next = cart.map(i => i.key === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    setCart(next); storeCart(next)
  }
  const remove = (key) => {
    const next = cart.filter(i => i.key !== key)
    setCart(next); storeCart(next)
  }

  const goCheckout = () => { close(); router.push('/checkout') }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = coupon ? Math.round(subtotal * coupon.percent) / 100 : 0
  const igv = (subtotal - discount) * 0.18
  const total = subtotal - discount + igv
  const count = cart.reduce((s, i) => s + i.quantity, 0)

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {/* Fondo oscuro: tocar = cerrar */}
      <div onClick={close} style={{
        position: 'absolute', inset: 0, background: 'rgba(30,26,26,0.5)',
        opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease', backdropFilter: 'blur(2px)',
      }} />

      {/* Panel lateral */}
      <aside style={{
        position: 'absolute', top: 0, right: 0, height: '100%',
        width: 'min(420px, 92vw)', background: '#FAF7F4',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease', boxShadow: '-8px 0 30px rgba(30,26,26,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #EDE8E4', background: '#fff' }}>
          <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 15, color: '#1E1A1A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Tu carrito {count > 0 && <span style={{ color: '#C49A8A' }}>({count})</span>}
          </div>
          <button onClick={close} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 6 }}>
            <X size={19} />
          </button>
        </div>

        {/* Items (zona con scroll propio) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 16px' }}>
              <ShoppingBag size={34} color="#EEC5C5" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#9CA3AF', marginBottom: 18 }}>Tu carrito está vacío</p>
              <button onClick={() => { close(); router.push('/catalog') }} style={{ background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 8, padding: '11px 24px', fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Ver catálogo
              </button>
            </div>
          ) : cart.map(item => (
            <div key={item.key} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #EDE8E4', marginBottom: 10 }}>
              <div style={{ width: 58, height: 58, borderRadius: 8, overflow: 'hidden', background: '#FDF0F0', flexShrink: 0 }}>
                {item.image
                  ? <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={16} color="#EEC5C5" /></div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 12, color: '#1E1A1A', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                {item.variant_color && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', marginTop: 2 }}>{item.variant_color}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(item.key, -1)} style={{ width: 24, height: 24, border: '1px solid #EDE8E4', borderRadius: 5, background: '#FAF7F4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E1A1A' }}><Minus size={10} /></button>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.key, 1)} style={{ width: 24, height: 24, border: '1px solid #EDE8E4', borderRadius: 5, background: '#FAF7F4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E1A1A' }}><Plus size={10} /></button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#1E1A1A' }}>{fmt(item.price * item.quantity)}</span>
                    <button onClick={() => remove(item.key)} aria-label="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C49A8A', display: 'flex' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer fijo: totales + pagar */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid #EDE8E4', background: '#fff', padding: '14px 18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#C49A8A', fontWeight: 500, marginBottom: 6 }}>
                <span><Ticket size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {coupon.code} ({coupon.percent}%)</span><span>−{fmt(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
              <span>IGV (18%)</span><span>{fmt(igv)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: '#1E1A1A', borderTop: '1px solid #EDE8E4', paddingTop: 10, marginBottom: 14 }}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
            <button onClick={goCheckout} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 10, padding: '14px 0',
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
              <CreditCard size={15} /> Proceder al pago
            </button>
            <Link href="/cart" onClick={close} style={{
              display: 'block', textAlign: 'center', marginTop: 10,
              fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              Ver carrito completo
            </Link>
          </div>
        )}
      </aside>
    </div>
  )
}
