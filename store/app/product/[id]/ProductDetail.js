'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Package, ChevronLeft, Check, ChevronDown } from 'lucide-react'
import { getImageUrl } from '../../../lib/api'
import { loadCart, storeCart } from '../../../lib/cartStorage'

function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: '1px solid #EDE8E4' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 300,
          color: '#1E1A1A', letterSpacing: '0.05em', textTransform: 'uppercase'
        }}
      >
        {title}
        <ChevronDown
          size={16}
          style={{
            color: '#9CA3AF', transition: 'transform 0.3s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>
      {open && (
        <div style={{
          paddingBottom: 16,
          fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#6B7280',
          lineHeight: 1.8, fontWeight: 300
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function ProductDetail({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0)

  // Analítica propia (sin cookies): registra la vista del producto
  useEffect(() => {
    fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(() => {})
  }, [product.id])

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const imgs = product.images || []
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.total_stock > 0
  const variantImg = selectedVariant?.image_url || null
  const activeImage = variantImg || imgs[selectedGalleryIdx]?.url || null

  const handleVariantChange = (v) => { setSelectedVariant(v); setSelectedGalleryIdx(0) }

  const addToCart = () => {
    try {
      const cart = loadCart()
      const key = `${product.id}-${selectedVariant?.id || 'none'}`
      const idx = cart.findIndex(i => i.key === key)
      const item = { key, id: product.id, name: product.name, variant_id: selectedVariant?.id || null, variant_color: selectedVariant?.color || null, price: product.sale_price, quantity: qty, image: variantImg || imgs[0]?.url || null }
      if (idx >= 0) cart[idx].quantity += qty
      else cart.push(item)
      storeCart(cart)
      window.dispatchEvent(new Event('openCartDrawer'))
      window.dispatchEvent(new Event('cartUpdated'))
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {}
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/catalog" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32,
          fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF',
          textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase'
        }}>
          <ChevronLeft size={14} /> Volver al catálogo
        </Link>

        <div className="pd-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>

          {/* Images */}
          <div>
            <div style={{ aspectRatio: '1/1', borderRadius: 20, overflow: 'hidden', background: '#FDF0F0', marginBottom: 14, position: 'relative' }}>
              {activeImage ? (
                <img src={getImageUrl(activeImage)} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} key={activeImage} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={72} color="#EEC5C5" />
                </div>
              )}
              {selectedVariant?.color && (
                <div style={{
                  position: 'absolute', bottom: 14, left: 14,
                  background: 'rgba(30,26,26,0.6)', color: '#EEC5C5',
                  fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400,
                  padding: '4px 12px', borderRadius: 20, letterSpacing: '0.06em',
                  backdropFilter: 'blur(4px)'
                }}>{selectedVariant.color}</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.variants?.filter(v => v.image_url).map(v => (
                <button key={`v-${v.id}`} onClick={() => handleVariantChange(v)} title={v.color} style={{
                  width: 58, height: 58, borderRadius: 10, overflow: 'hidden', padding: 0,
                  border: selectedVariant?.id === v.id && variantImg ? '2px solid #1E1A1A' : '1.5px solid #EDE8E4',
                  cursor: 'pointer', position: 'relative', background: 'none'
                }}>
                  <img src={getImageUrl(v.image_url)} alt={v.color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {v.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)' }} />}
                </button>
              ))}
              {imgs.map((img, i) => (
                <button key={`g-${img.id}`} onClick={() => { setSelectedGalleryIdx(i); setSelectedVariant(null) }} style={{
                  width: 58, height: 58, borderRadius: 10, overflow: 'hidden', padding: 0,
                  border: !variantImg && selectedGalleryIdx === i ? '2px solid #1E1A1A' : '1.5px solid #EDE8E4',
                  cursor: 'pointer', background: 'none'
                }}>
                  <img src={getImageUrl(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Info - Reorganizado */}
          <div style={{ paddingTop: 8 }}>
            {/* Categoría */}
            {product.category && (
              <span style={{
                display: 'inline-block', fontFamily: "'Inter', sans-serif",
                fontSize: 9, fontWeight: 400, color: '#C49A8A',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                marginBottom: 16, borderBottom: '1px solid #EEC5C5', paddingBottom: 2
              }}>{product.category}</span>
            )}

            {/* Nombre */}
            <h1 style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              fontWeight: 100, color: '#1E1A1A',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              lineHeight: 1.1, marginBottom: 20
            }}>{product.name}</h1>

            {/* Precio */}
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 28, fontWeight: 300, color: '#1E1A1A', marginBottom: 24, letterSpacing: '0.02em'
            }}>{fmt(product.sale_price)}</div>

            {/* Color - Variants */}
            {product.variants?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Color — <span style={{ color: '#C49A8A' }}>{selectedVariant?.color || 'Selecciona'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.variants.map(v => (
                    <button key={v.id} onClick={() => handleVariantChange(v)} disabled={v.stock === 0} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px', borderRadius: 8, border: '1px solid',
                      borderColor: selectedVariant?.id === v.id ? '#1E1A1A' : '#EDE8E4',
                      background: selectedVariant?.id === v.id ? '#FAF7F4' : '#fff',
                      cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                      opacity: v.stock === 0 ? 0.4 : 1, transition: 'all 0.2s',
                      fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 400, color: '#1E1A1A'
                    }}>
                      {v.image_url && <img src={getImageUrl(v.image_url)} alt={v.color} style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', border: '1px solid #EDE8E4' }} />}
                      {v.color}
                      {v.stock === 0 && <span style={{ fontSize: 10, color: '#C49A8A' }}> agotado</span>}
                    </button>
                  ))}
                </div>
                {selectedVariant && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9CA3AF', marginTop: 8, fontWeight: 300 }}>
                    {selectedVariant.stock} unidades disponibles
                  </p>
                )}
              </div>
            )}

            {/* Cantidad */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Cantidad</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 'fit-content', border: '1px solid #EDE8E4', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                  width: 40, height: 40, background: '#FAF7F4', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: '#1E1A1A', borderRight: '1px solid #EDE8E4'
                }}>−</button>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, minWidth: 44, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{
                  width: 40, height: 40, background: '#FAF7F4', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: '#1E1A1A', borderLeft: '1px solid #EDE8E4'
                }}>+</button>
              </div>
            </div>

            {/* Botón de compra */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
              <button onClick={addToCart} disabled={!inStock} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '14px 24px', borderRadius: 10, border: 'none',
                cursor: inStock ? 'pointer' : 'not-allowed',
                background: added ? '#B5C4B1' : inStock ? '#EEC5C5' : '#EDE8E4',
                color: '#1E1A1A', transition: 'background 0.3s'
              }}>
                {added ? <><Check size={15} /> Agregado</> : <><ShoppingBag size={15} /> Agregar al carrito</>}
              </button>
              <Link href="/cart" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '14px 20px', borderRadius: 10, textDecoration: 'none',
                background: '#1E1A1A', color: '#EEC5C5'
              }}>Ver carrito</Link>
            </div>

            {!inStock && (
              <p style={{ fontFamily: "'Inter', sans-serif", color: '#C49A8A', fontSize: 12, marginBottom: 24, fontWeight: 300, letterSpacing: '0.04em' }}>
                Este producto está agotado.
              </p>
            )}

            {/* Acordeones - Panales */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #EDE8E4' }}>
              <AccordionSection title="Descripción" defaultOpen={true}>
                {product.description}
              </AccordionSection>

              {product.usage_guide && (
                <AccordionSection title="Guía de Uso" defaultOpen={false}>
                  <p>{product.usage_guide}</p>
                </AccordionSection>
              )}

              {product.skin_type && (
                <AccordionSection title="Tipo de Piel" defaultOpen={false}>
                  <p>{product.skin_type}</p>
                </AccordionSection>
              )}

              {product.specifications && (
                <AccordionSection title="Especificaciones" defaultOpen={false}>
                  <div style={{ whiteSpace: 'pre-line' }}>{product.specifications}</div>
                </AccordionSection>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
