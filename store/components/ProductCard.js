'use client'
import Link from 'next/link'
import { ShoppingCart, Package } from 'lucide-react'
import { getImageUrl } from '../lib/api'

export default function ProductCard({ product, rank }) {
  const firstVariantImg = product.variants?.find(v => v.image_url && v.stock > 0)?.image_url
  const productImg = product.images?.find(i => i.is_primary)?.url || product.images?.[0]?.url
  const imgUrl = firstVariantImg || productImg || null
  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const inStock = product.total_stock > 0

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
      btn.style.background = '#B5C4B1'
      btn.style.color = '#1E1A1A'
      btn.innerHTML = '✓'
      setTimeout(() => {
        btn.style.background = '#EEC5C5'
        btn.style.color = '#1E1A1A'
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'
      }, 1200)
    } catch {}
  }

  return (
    <Link href={`/product/${product.id}`} className="product-card group" style={{ textDecoration: 'none', display: 'block' }}>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '1/1', background: '#FDF0F0', overflow: 'hidden' }}>
        {rank && rank <= 3 && (
          <div style={{
            position: 'absolute', top: 10, left: 10, zIndex: 2,
            width: 26, height: 26, borderRadius: '50%',
            background: '#1E1A1A', color: '#EEC5C5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 500, fontSize: 11, fontFamily: "'Inter', sans-serif"
          }}>{rank}</div>
        )}
        {product.category && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 2,
            background: 'rgba(250,247,244,0.92)', color: '#C49A8A',
            padding: '2px 9px', borderRadius: 20, fontSize: 9, fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: "'Inter', sans-serif"
          }}>{product.category}</div>
        )}
        {imgUrl ? (
          <img
            src={getImageUrl(imgUrl)}
            alt={product.name}
            className="card-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={36} color="#EEC5C5" />
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
      <div style={{ padding: '14px 16px 14px', background: '#fff' }}>
        <p style={{ fontSize: 11, color: '#C49A8A', marginBottom: 4, letterSpacing: '0.04em', fontFamily: "'Inter', sans-serif" }}>
          {product.variants?.filter(v => v.stock > 0).map(v => v.color).join(' · ') || ''}
        </p>
        <h3 style={{
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: 13, fontWeight: 300, color: '#1E1A1A',
          lineHeight: 1.4, marginBottom: 12, minHeight: 36,
          letterSpacing: '0.03em', textTransform: 'uppercase'
        }} className="line-clamp-2">
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16, fontWeight: 400, color: '#1E1A1A', letterSpacing: '0.02em'
          }}>{fmt(product.sale_price)}</span>
          {inStock && (
            <button
              onClick={addToCart}
              title="Agregar al carrito"
              className="add-cart-btn"
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#EEC5C5', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1E1A1A'
              }}
            >
              <ShoppingCart size={14} />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
