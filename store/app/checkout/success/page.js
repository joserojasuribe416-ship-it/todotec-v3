'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, XCircle, ShoppingBag } from 'lucide-react'

function SuccessContent() {
  const params = useSearchParams()
  const paymentId    = params.get('payment_id')
  const status       = params.get('status')         // approved | pending | failure
  const orderId      = params.get('external_reference')
  const isQR         = params.get('qr') === '1'
  const qrOrderId    = params.get('order_id')
  const qrOrderNum   = params.get('order_number')
  const [order, setOrder] = useState(null)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (isQR) { setVerified(true); return }
    if (!orderId) return
    fetch(`/api/orders/${orderId}/verify${paymentId ? `?payment_id=${paymentId}` : ''}`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setOrder(d); setVerified(true) })
      .catch(() => setVerified(true))
  }, [orderId, paymentId, isQR])

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  // QR flow — always "pending confirmation"
  if (isQR) {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
        <div style={{ background: '#1E1A1A', padding: '40px 24px 36px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10 }}>Estado del pedido</p>
            <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#FAF7F4', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
              Pedido recibido
            </h1>
          </div>
        </div>
        <div className="page-pad" style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #EDE8E4', padding: '40px 32px', textAlign: 'center', marginBottom: 28 }}>
            <div style={{ marginBottom: 20 }}><Clock size={52} color="#C49A8A" /></div>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E1A1A', marginBottom: 10 }}>
              Pendiente de confirmación
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 20px' }}>
              Tu pedido ha sido recibido. Nos comunicaremos contigo por WhatsApp una vez que confirmemos la recepción de tu pago.
            </p>
            <div style={{ background: '#FAF7F4', borderRadius: 10, padding: '10px 20px', display: 'inline-block' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pedido #</span>
              <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: 18, color: '#1E1A1A', marginLeft: 6, letterSpacing: '0.06em' }}>
                {qrOrderNum || qrOrderId}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <Link href="/" style={btnPrimary}>Volver al inicio</Link>
            <Link href="/catalog" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', textDecoration: 'none', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShoppingBag size={12} /> Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isApproved = status === 'approved' || order?.status === 'paid'
  const isPending  = status === 'pending'  && order?.status !== 'paid'
  const isFailed   = status === 'failure'  || status === 'rejected'

  const icon = isFailed  ? <XCircle size={52} color="#C49A8A" />
             : isPending ? <Clock size={52} color="#C49A8A" />
             : <CheckCircle size={52} color="#B5C4B1" />

  const title = isFailed  ? 'Pago no completado'
              : isPending ? 'Pago en proceso'
              : '¡Pedido confirmado!'

  const subtitle = isFailed
    ? 'Hubo un problema con el pago. Puedes intentarlo nuevamente.'
    : isPending
    ? 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.'
    : 'Tu pago fue recibido. Pronto nos pondremos en contacto contigo.'

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1E1A1A', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10 }}>Estado del pedido</p>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#FAF7F4', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
            {title}
          </h1>
        </div>
      </div>

      <div className="page-pad" style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {/* Status card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #EDE8E4', padding: '40px 32px', textAlign: 'center', marginBottom: 28 }}>
          <div style={{ marginBottom: 20 }}>{icon}</div>
          <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E1A1A', marginBottom: 10 }}>
            {title}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6B7280', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 20px' }}>
            {subtitle}
          </p>
          {orderId && (
            <div style={{ background: '#FAF7F4', borderRadius: 10, padding: '10px 20px', display: 'inline-block' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pedido #</span>
              <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: 18, color: '#1E1A1A', marginLeft: 6, letterSpacing: '0.06em' }}>
                {order?.order_number || (10000 + parseInt(orderId))}
              </span>
            </div>
          )}
        </div>

        {/* Order detail (if loaded) */}
        {verified && order && isApproved && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE8E4', overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #F3EEE9' }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E1A1A' }}>Detalle del pedido</p>
            </div>

            {/* Items */}
            <div style={{ padding: '6px 0' }}>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderBottom: '1px solid #F9F5F2' }}>
                  <div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A' }}>{item.name}</span>
                    {item.variant_color && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#C49A8A', marginLeft: 8 }}>{item.variant_color}</span>}
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>x{item.quantity}</span>
                  </div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A' }}>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Delivery */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #F3EEE9', background: '#FDFBFA' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Entrega</div>
              {order.delivery_type === 'pickup' ? (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A' }}>
                  Recojo en {order.delivery_data?.point_name} — {order.delivery_data?.point_address}
                </p>
              ) : (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1E1A1A' }}>
                  {order.delivery_data?.address}, {order.delivery_data?.district}, {order.delivery_data?.province}, {order.delivery_data?.department}
                </p>
              )}
            </div>

            {/* Total */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #F3EEE9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#1E1A1A' }}>Total pagado</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#1E1A1A' }}>{fmt(order.total)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {isFailed ? (
            <Link href="/checkout" style={btnPrimary}>Intentar nuevamente</Link>
          ) : (
            <Link href="/" style={btnPrimary}>Volver al inicio</Link>
          )}
          <Link href="/catalog" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', textDecoration: 'none', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShoppingBag size={12} /> Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#FAF7F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", color: '#9CA3AF' }}>Verificando pago...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

const btnPrimary = {
  background: '#1E1A1A', color: '#EEC5C5', border: 'none', borderRadius: 10,
  padding: '13px 36px', fontFamily: "'Inter', sans-serif", fontSize: 12,
  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  textDecoration: 'none', display: 'inline-block',
}
