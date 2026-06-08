'use client'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { getImageUrl } from '../lib/api'

export default function ProductCard({ product }) {
  const firstVariantImg = product.variants?.find(v => v.image_url && v.stock > 0)?.image_url
  const productImg = product.images?.find(i => i.is_primary)?.url || product.images?.[0]?.url
  const imgUrl = firstVariantImg || productImg || null
  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const inStock = product.total_stock > 0

  const hasDiscount = product.original_price && product.original_price > product.sale_price
  const discountPct = hasDiscount
    ? Math.round((1 - product.sale_price / product.original_price) * 100)
    : null

  const addToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
      const idx = cart.findIndex(i => i.id === product.id && !i.variant_id)
      if (idx >= 0) cart[idx].quantity += 1
      else cart.push({
        key: `${product.id}-none`,
        id: product.id,
        name: product.name,
        price: product.sale_price,
        quantity: 1,
        image: imgUrl || null,
        variant_id: null,
        variant_color: null,
      })
      sessionStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cartUpdated'))
      const btn = e.currentTarget
      const original = btn.innerHTML
      btn.style.background = '#B5C4B1'
      btn.style.color = '#fff'
      btn.innerHTML = '✓ Agregado'
      setTimeout(() => {
        btn.style.background = '#1E1A1A'
        btn.style.color = '#EEC5C5'
        btn.innerHTML = original
      }, 1200)
    } catch {}
  }

  return (
    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: '#fff', border: '1px solid #EDE8E4', borderRadius: 12,
        overflow: 'hidden', transition: 'box-shadow 0.2s, border-color 0.2s', cursor: 'pointer'
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,154,138,0.15)'; e.currentTarget.style.borderColor = '#EEC5C5' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#EDE8E4' }}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '1/1', background: '#FDF0F0', overflow: 'hidden' }}>
          {/* Heart */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation() }}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 2,
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#C49A8A'
            }}
          >♡</button>

          {/* Discount badge */}
          {hasDiscount && (
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 2,
              background: '#EEC5C5', color: '#1E1A1A', fontWeight: 600,
              fontSize: 9, padding: '2px 7px', borderRadius: 10,
              fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em'
            }}>-{discountPct}%</div>
          )}

          {imgUrl ? (
            <img
              src={getImageUrl(imgUrl)}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={32} color="#EEC5C5" />
            </div>
          )}

          {!inStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(250,247,244,0.80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{
                background: '#1E1A1A', color: '#FAF7F4', fontWeight: 500,
                padding: '5px 14px', borderRadius: 4, fontSize: 10,
                letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif"
              }}>AGOTADO</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px' }}>
          {product.category && (
            <div style={{ fontSize: 10, color: '#C49A8A', marginBottom: 3, fontWeight: 500, letterSpacing: '0.04em', fontFamily: "'Inter', sans-serif" }}>
              {product.category}
            </div>
          )}
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12, fontWeight: 500, color: '#1E1A1A',
            lineHeight: 1.4, marginBottom: 4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {product.name}
          </div>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1E1A1A', fontFamily: "'Inter', sans-serif" }}>
              {fmt(product.sale_price)}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through', fontFamily: "'Inter', sans-serif" }}>
                {fmt(product.original_price)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          {inStock && (
            <button
              onClick={addToCart}
              style={{
                width: '100%', height: 32, borderRadius: 7,
                background: '#1E1A1A', color: '#EEC5C5',
                border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 500, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#3A3434'}
              onMouseLeave={e => { if (e.currentTarget.innerHTML !== '✓ Agregado') e.currentTarget.style.background = '#1E1A1A' }}
            >
              🛒 Añadir
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
