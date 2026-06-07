import Link from 'next/link'
import { fetchProducts, fetchConfig } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { ArrowRight, ChevronRight } from 'lucide-react'

export default async function HomePage() {
  const [products, config] = await Promise.all([
    fetchProducts({ store_only: 'true' }),
    fetchConfig().catch(() => null),
  ])
  const topSellers = products.slice(0, 8)
  const bannerTitle    = config?.banner_title    || 'Todo lo que necesitas,\nen un solo lugar.'
  const bannerSubtitle = config?.banner_subtitle || 'Importamos directamente los mejores productos tecnológicos. Precios justos, calidad garantizada.'

  return (
    <>
      {/* ── Hero Banner ─────────────────────────────────── */}
      <section style={{
        background: 'var(--brand-primary, #1E3A8A)',
        minHeight: 480,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative shapes */}
        <div style={{
          position: 'absolute', right: -60, top: -60,
          width: 480, height: 480, borderRadius: '50%',
          background: 'rgba(255,209,0,0.06)'
        }} />
        <div style={{
          position: 'absolute', right: 80, bottom: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'rgba(255,209,0,0.04)'
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', width: '100%' }}>
          <div style={{ maxWidth: 600 }}>
            <span className="fade-up fade-up-1" style={{
              display: 'inline-block', background: 'var(--brand-secondary, #FFD100)', color: 'var(--brand-primary, #1E3A8A)',
              fontWeight: 800, fontSize: 11, letterSpacing: '1.5px',
              padding: '4px 12px', borderRadius: 4, marginBottom: 24
            }}>TECNOLOGÍA DE VANGUARDIA</span>

            <h1 className="fade-up fade-up-2" style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 900, color: '#FFFFFF',
              lineHeight: 1.0, marginBottom: 24, letterSpacing: '-1px',
              whiteSpace: 'pre-line'
            }}>
              {bannerTitle.includes('\n') ? (
                <>
                  {bannerTitle.split('\n')[0]}<br />
                  <span style={{ color: 'var(--brand-secondary, #FFD100)' }}>{bannerTitle.split('\n')[1]}</span>
                </>
              ) : (
                <span style={{ color: 'var(--brand-secondary, #FFD100)' }}>{bannerTitle}</span>
              )}
            </h1>

            <p className="fade-up fade-up-3" style={{ color: '#93C5FD', fontSize: 17, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              {bannerSubtitle}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/catalog" className="hero-cta-yellow fade-up fade-up-3" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--brand-secondary, #FFD100)', color: 'var(--brand-primary, #1E3A8A)',
                fontWeight: 800, fontSize: 15, padding: '14px 28px',
                borderRadius: 8, textDecoration: 'none',
              }}>
                Ver catálogo completo <ArrowRight size={18} />
              </Link>
              <Link href="/contact" className="hero-cta-outline fade-up fade-up-4" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
                fontWeight: 700, fontSize: 15, padding: '14px 28px',
                borderRadius: 8, textDecoration: 'none',
              }}>
                Precio mayorista
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ───────────────────────────────────── */}
      <section style={{ background: '#F7F8FA', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              { label: 'Importación directa', sub: 'Sin intermediarios' },
              { label: 'Garantía incluida', sub: 'En todos los productos' },
              { label: 'Soporte dedicado', sub: 'Atención personalizada' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '20px 24px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid #E5E7EB' : 'none'
              }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand-primary, #1E3A8A)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Sellers ─────────────────────────────────── */}
      <section style={{ padding: '64px 24px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-secondary, #FFD100)', letterSpacing: '2px', marginBottom: 8 }}>
              ★ TOP SELLERS
            </p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0A0A0A', lineHeight: 1.1 }}>
              Los más vendidos
            </h2>
          </div>
          <Link href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 700, color: 'var(--brand-primary, #1E3A8A)',
            textDecoration: 'none', paddingBottom: 4, borderBottom: '2px solid #FFD100'
          }}>
            Ver todos <ChevronRight size={15} />
          </Link>
        </div>

        {/* 8 slots grid */}
        {topSellers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            {/* Empty state: 8 placeholder slots */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20, marginBottom: 32
            }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  border: '2px dashed #E5E7EB', borderRadius: 12,
                  aspectRatio: '3/4', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#F7F8FA'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--brand-primary, #1E3A8A)', color: 'var(--brand-secondary, #FFD100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 13
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Slot disponible</span>
                </div>
              ))}
            </div>
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Agrega productos desde el panel de administración</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20
          }}>
            {/* Fill up to 8 slots */}
            {Array.from({ length: 8 }).map((_, i) => {
              const product = topSellers[i]
              if (product) return <ProductCard key={product.id} product={product} rank={i + 1} />
              // Empty slot
              return (
                <div key={`empty-${i}`} style={{
                  border: '2px dashed #E5E7EB', borderRadius: 12,
                  aspectRatio: '3/4', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#F7F8FA'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#E5E7EB', color: '#9CA3AF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 12
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>Próximamente</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Wholesale CTA ───────────────────────────────── */}
      <section style={{
        margin: '0 24px 64px', maxWidth: 1232, marginLeft: 'auto', marginRight: 'auto',
        background: '#0A0A0A', borderRadius: 16, padding: '48px 56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 24
      }}>
        <div>
          <p style={{ color: 'var(--brand-secondary, #FFD100)', fontWeight: 700, fontSize: 12, letterSpacing: '2px', marginBottom: 8 }}>DISTRIBUIDORES Y EMPRESAS</p>
          <h3 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, lineHeight: 1.1 }}>
            ¿Compras en volumen?<br />Tenemos precio mayorista.
          </h3>
        </div>
        <Link href="/contact" className="wholesale-cta" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--brand-secondary, #FFD100)', color: 'var(--brand-primary, #1E3A8A)',
          fontWeight: 800, fontSize: 15, padding: '14px 28px',
          borderRadius: 8, textDecoration: 'none', flexShrink: 0
        }}>
          Consultar ahora <ArrowRight size={18} />
        </Link>
      </section>
    </>
  )
}
