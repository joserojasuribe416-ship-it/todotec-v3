'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Package, ChevronLeft, Check } from 'lucide-react'
import { getImageUrl } from '../../../lib/api'

export default function ProductDetail({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const imgs = product.images || []
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.total_stock > 0

  // Imagen activa: primero foto del color seleccionado, luego galería del producto
  const variantImg = selectedVariant?.image_url || null
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0)
  const activeImage = variantImg || imgs[selectedGalleryIdx]?.url || null

  // Al cambiar de variante, resetear galería
  const handleVariantChange = (v) => {
    setSelectedVariant(v)
    setSelectedGalleryIdx(0)
  }

  const addToCart = () => {
    try {
      const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
      const key = `${product.id}-${selectedVariant?.id || 'none'}`
      const idx = cart.findIndex(i => i.key === key)
      const item = {
        key,
        id: product.id,
        name: product.name,
        variant_id: selectedVariant?.id || null,
        variant_color: selectedVariant?.color || null,
        price: product.sale_price,
        quantity: qty,
        image: variantImg || imgs[0]?.url || null,
      }
      if (idx >= 0) cart[idx].quantity += qty
      else cart.push(item)
      sessionStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cartUpdated'))
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {}
  }

  return (
    <div>
      <Link href="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280', textDecoration: 'none', marginBottom: 24 }}>
        <ChevronLeft size={16} /> Volver al catálogo
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="lg:grid-cols-2 grid-cols-1">

        {/* ── Images column ── */}
        <div>
          {/* Main image */}
          <div style={{ aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', background: '#F7F8FA', marginBottom: 12, position: 'relative' }}>
            {activeImage ? (
              <img
                src={getImageUrl(activeImage)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
                key={activeImage}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={80} color="#D1D5DB" />
              </div>
            )}
            {selectedVariant?.color && (
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                backdropFilter: 'blur(4px)'
              }}>{selectedVariant.color}</div>
            )}
          </div>

          {/* Thumbnails: variant images + product gallery */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Variant thumbnails (colors with images) */}
            {product.variants?.filter(v => v.image_url).map(v => (
              <button
                key={`v-${v.id}`}
                onClick={() => handleVariantChange(v)}
                title={v.color}
                style={{
                  width: 60, height: 60, borderRadius: 10, overflow: 'hidden', padding: 0,
                  border: selectedVariant?.id === v.id && variantImg
                    ? '2.5px solid #FFD100'
                    : '2px solid #E5E7EB',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                  position: 'relative'
                }}
              >
                <img src={getImageUrl(v.image_url)} alt={v.color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {v.stock === 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)' }} />
                )}
              </button>
            ))}

            {/* Product general gallery */}
            {imgs.map((img, i) => (
              <button
                key={`g-${img.id}`}
                onClick={() => { setSelectedGalleryIdx(i); setSelectedVariant(null) }}
                style={{
                  width: 60, height: 60, borderRadius: 10, overflow: 'hidden', padding: 0,
                  border: !variantImg && selectedGalleryIdx === i
                    ? '2.5px solid #1E3A8A'
                    : '2px solid #E5E7EB',
                  cursor: 'pointer', transition: 'border-color 0.2s'
                }}
              >
                <img src={getImageUrl(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Info column ── */}
        <div>
          {product.category && (
            <span style={{ display: 'inline-block', background: '#1E3A8A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, marginBottom: 12, letterSpacing: '0.5px' }}>
              {product.category}
            </span>
          )}
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: '#0A0A0A', marginBottom: 8, lineHeight: 1.1 }}>{product.name}</h1>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#1E3A8A', marginBottom: 20 }}>{fmt(product.sale_price)}</div>

          {product.description && (
            <p style={{ color: '#6B7280', marginBottom: 24, lineHeight: 1.7, fontSize: 15 }}>{product.description}</p>
          )}

          {/* Color selector */}
          {product.variants?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Color — <span style={{ color: '#1E3A8A' }}>{selectedVariant?.color || 'Selecciona'}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVariantChange(v)}
                    disabled={v.stock === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 10, border: '2px solid',
                      borderColor: selectedVariant?.id === v.id ? '#FFD100' : '#E5E7EB',
                      background: selectedVariant?.id === v.id ? '#FFFBEA' : '#fff',
                      cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                      opacity: v.stock === 0 ? 0.45 : 1,
                      transition: 'all 0.2s', fontSize: 13, fontWeight: 600, color: '#374151'
                    }}
                  >
                    {/* Mini foto del color */}
                    {v.image_url && (
                      <img
                        src={getImageUrl(v.image_url)}
                        alt={v.color}
                        style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'cover', border: '1px solid #E5E7EB' }}
                      />
                    )}
                    {v.color}
                    {v.stock === 0 && <span style={{ fontSize: 10, color: '#9CA3AF' }}> (agotado)</span>}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                  Stock disponible: <strong style={{ color: '#374151' }}>{selectedVariant.stock} unidades</strong>
                </p>
              )}
            </div>
          )}

          {/* Qty */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cantidad</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ width: 36, height: 36, border: '2px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#374151', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#1E3A8A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
              >−</button>
              <span style={{ fontWeight: 900, fontSize: 18, minWidth: 32, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                style={{ width: 36, height: 36, border: '2px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#374151', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#1E3A8A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
              >+</button>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={addToCart}
              disabled={!inStock}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontWeight: 800, fontSize: 15, padding: '14px 24px', borderRadius: 10, border: 'none',
                cursor: inStock ? 'pointer' : 'not-allowed',
                background: added ? '#16a34a' : inStock ? '#FFD100' : '#E5E7EB',
                color: added ? '#fff' : inStock ? '#1E3A8A' : '#9CA3AF',
                transition: 'background 0.3s, color 0.3s'
              }}
            >
              {added ? <><Check size={18} /> Agregado</> : <><ShoppingCart size={18} /> Agregar al carrito</>}
            </button>
            <Link href="/cart" style={{
              display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14,
              padding: '14px 20px', borderRadius: 10, textDecoration: 'none',
              background: '#1E3A8A', color: '#fff', transition: 'background 0.3s'
            }}>
              Ver carrito
            </Link>
          </div>

          {!inStock && (
            <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>Este producto está agotado.</p>
          )}
        </div>
      </div>
    </div>
  )
}
