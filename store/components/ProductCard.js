'use client'
import Link from 'next/link'
import { ShoppingCart, Package } from 'lucide-react'
import { getImageUrl } from '../lib/api'

export default function ProductCard({ product, rank }) {
  // Prioridad: foto del primer color con stock → foto principal del producto → primera foto
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
      btn.style.background = '#16a34a'
      btn.innerHTML = '✓'
      setTimeout(() => {
        btn.style.background = '#FFD100'
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'
      }, 1200)
    } catch {}
  }

  return (
    <Link href={`/product/${product.id}`} className="product-card group" style={{ textDecoration: 'none', display: 'block' }}>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '1/1', background: '#F7F8FA', overflow: 'hidden' }}>
        {rank && (
          <div style={{
            position: 'absolute', top: 10, left: 10, zIndex: 2,
            width: 28, height: 28, borderRadius: '50%',
            background: '#1E3A8A', color: '#FFD100',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 12
          }}>{rank}</div>
        )}
        {product.category && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 2,
            background: '#FFD100', color: '#1E3A8A',
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.5px'
          }}>{product.category.toUpperCase()}</div>
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
            <Package size={40} color="#D1D5DB" />
          </div>
        )}
        {!inStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ background: '#374151', color: '#fff', fontWeight: 700, padding: '6px 16px', borderRadius: 4, fontSize: 12, letterSpacing: '1px' }}>
              AGOTADO
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px 16px 14px' }}>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, letterSpacing: '0.3px' }}>
          {product.variants?.filter(v => v.stock > 0).map(v => v.color).join(' · ') || 'Sin variantes'}
        </p>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.3, marginBottom: 10, minHeight: 36 }} className="line-clamp-2">
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#1E3A8A' }}>{fmt(product.sale_price)}</span>
          {inStock && (
            <button
              onClick={addToCart}
              title="Agregar al carrito"
              className="add-cart-btn"
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: '#FFD100', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1E3A8A'
              }}
            >
              <ShoppingCart size={15} />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
