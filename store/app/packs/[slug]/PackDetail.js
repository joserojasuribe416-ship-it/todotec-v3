'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Package, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react'
import { getImageUrl } from '../../../lib/api'
import { loadCart, storeCart } from '../../../lib/cartStorage'

const fmt = (n) => `S/ ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function ContentSection({ eyebrow, title, children }) {
  if (!children) return null
  return (
    <section style={{ padding: '32px 0', borderTop: '1px solid #EDE8E4' }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#C49A8A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 21, color: '#1E1A1A', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>{title}</h2>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.8, color: '#6B7280', fontWeight: 300, whiteSpace: 'pre-line' }}>{children}</div>
    </section>
  )
}

export default function PackDetail({ pack }) {
  const [added, setAdded] = useState(false)
  const [qty, setQty] = useState(1)
  const available = pack.available_stock > 0
  const discountFactor = 1 - Number(pack.discount_percent || 0) / 100

  const addToCart = () => {
    if (!available) return
    const cart = loadCart()
    for (const component of pack.items) {
      const key = `pack-${pack.id}-${component.id}`
      const quantity = component.quantity * qty
      const price = Math.round(component.unit_price * discountFactor * 100) / 100
      const index = cart.findIndex(item => item.key === key)
      if (index >= 0) {
        cart[index].quantity += quantity
        cart[index].pack_quantity = (cart[index].pack_quantity || 1) + qty
      } else {
        cart.push({
          key,
          id: component.product_id,
          name: component.product_name,
          price,
          regular_price: component.unit_price,
          quantity,
          image: component.image_url || pack.image_url || null,
          variant_id: component.variant_id,
          variant_color: component.variant_color,
          pack_id: pack.id,
          pack_slug: pack.slug,
          pack_name: pack.name,
          pack_group: `pack-${pack.id}`,
          pack_quantity: qty,
          pack_unit_quantity: component.quantity,
          pack_discount_percent: pack.discount_percent,
        })
      }
    }
    storeCart(cart)
    window.dispatchEvent(new Event('openCartDrawer'))
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      <div className="page-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px 64px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9CA3AF', textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 28 }}>
          <ArrowLeft size={13} /> Volver a la tienda
        </Link>

        <div className="pack-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(360px, 0.92fr)', gap: 54, alignItems: 'start' }}>
          <div>
            <div style={{ aspectRatio: '1/1', background: '#FDF0F0', overflow: 'hidden', borderRadius: 16, border: '1px solid #EDE8E4' }}>
              {pack.image_url ? (
                <img src={getImageUrl(pack.image_url)} alt={pack.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={72} color="#EEC5C5" /></div>
              )}
            </div>
          </div>

          <div style={{ paddingTop: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#C49A8A', fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>
              <Sparkles size={12} /> Pack especial
            </div>
            <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 100, color: '#1E1A1A', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 14 }}>{pack.name}</h1>
            {pack.subtitle && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#6B7280', lineHeight: 1.7, fontWeight: 300, marginBottom: 24 }}>{pack.subtitle}</p>}

            <div style={{ background: '#fff', border: '1px solid #EDE8E4', borderRadius: 12, padding: '22px', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 28, fontWeight: 500, color: '#1E1A1A' }}>{fmt(pack.pack_price)}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#9CA3AF', textDecoration: 'line-through' }}>{fmt(pack.regular_price)}</span>
                <span style={{ background: '#EEC5C5', color: '#1E1A1A', borderRadius: 5, padding: '4px 9px', fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600 }}>-{pack.discount_percent}%</span>
              </div>
              <div style={{ marginTop: 8, fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#5B7B53', fontWeight: 500 }}>Ahorras {fmt(pack.savings)} al comprar la rutina completa.</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Este pack contiene</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {pack.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #EDE8E4', borderRadius: 10, padding: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 7, overflow: 'hidden', background: '#FDF0F0', flexShrink: 0 }}>
                      {item.image_url
                        ? <img src={getImageUrl(item.image_url)} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} color="#EEC5C5" /></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: '#1E1A1A' }}>{item.product_name}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', marginTop: 2 }}>{item.variant_color} · × {item.quantity}</div>
                    </div>
                    <Check size={14} color="#B5C4B1" />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EDE8E4', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
                <button onClick={() => setQty(value => Math.max(1, value - 1))} style={{ width: 38, height: '100%', border: 'none', background: '#fff', cursor: 'pointer' }}>−</button>
                <span style={{ minWidth: 34, textAlign: 'center', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>{qty}</span>
                <button onClick={() => setQty(value => Math.min(pack.available_stock, value + 1))} style={{ width: 38, height: '100%', border: 'none', background: '#fff', cursor: 'pointer' }}>+</button>
              </div>
              <button onClick={addToCart} disabled={!available} style={{
                flex: 1, border: 'none', borderRadius: 9, padding: '15px 18px',
                background: added ? '#B5C4B1' : available ? '#1E1A1A' : '#EDE8E4',
                color: available ? '#EEC5C5' : '#9CA3AF', cursor: available ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {added ? <><Check size={15} /> Pack agregado</> : <><ShoppingBag size={15} /> Comprar el pack</>}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, fontFamily: "'Inter', sans-serif", fontSize: 11, color: available ? '#5B7B53' : '#C9888A' }}>
              <ShieldCheck size={14} /> {available ? `${pack.available_stock} packs disponibles con el stock actual` : 'Pack temporalmente agotado'}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 920, margin: '56px auto 0' }}>
          <ContentSection eyebrow="La propuesta" title="Acerca de esta rutina">{pack.description}</ContentSection>
          <ContentSection eyebrow="Perfil ideal" title="¿Para quién es este pack?">{pack.target_audience}</ContentSection>
          <ContentSection eyebrow="Resultados" title="Beneficios principales">{pack.benefits}</ContentSection>
          <ContentSection eyebrow="Paso a paso" title="Guía de uso">{pack.usage_guide}</ContentSection>
          <ContentSection eyebrow="Consejo Glowi" title="Recomendaciones">{pack.recommendations}</ContentSection>
        </div>
      </div>
    </div>
  )
}
