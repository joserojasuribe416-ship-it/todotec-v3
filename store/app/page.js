import Link from 'next/link'
import { fetchProducts, fetchConfig } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'

export default async function HomePage() {
  const [products, config] = await Promise.all([
    fetchProducts({ store_only: 'true' }),
    fetchConfig().catch(() => null),
  ])
  const topSellers = products.slice(0, 8)
  const bannerTitle    = config?.banner_title    || 'Tu rutina coreana,\nen un solo lugar.'
  const bannerSubtitle = config?.banner_subtitle || 'Korean skincare importado directamente desde Corea del Sur. Rutinas reales, resultados visibles.'

  return (
    <>
      {/* ── Hero ── */}
      <section style={{
        background: '#1E1A1A',
        minHeight: 500,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles — blush tone */}
        <div style={{ position: 'absolute', right: -80, top: -80, width: 520, height: 520, borderRadius: '50%', background: 'rgba(238,197,197,0.05)' }} />
        <div style={{ position: 'absolute', right: 120, bottom: -100, width: 340, height: 340, borderRadius: '50%', background: 'rgba(196,154,138,0.06)' }} />
        <div style={{ position: 'absolute', left: -60, bottom: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(181,196,177,0.04)' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', width: '100%' }}>
          <div style={{ maxWidth: 560 }}>
            <span className="fade-up fade-up-1" style={{
              display: 'inline-block', background: 'rgba(238,197,197,0.12)',
              color: '#EEC5C5', fontWeight: 400, fontSize: 10,
              letterSpacing: '4px', padding: '5px 14px', borderRadius: 4, marginBottom: 28,
              textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
              border: '1px solid rgba(238,197,197,0.2)'
            }}>Korean Skincare · Lima, Perú</span>

            <h1 className="fade-up fade-up-2" style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              fontWeight: 100, color: '#FAF7F4',
              lineHeight: 1.05, marginBottom: 24,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              whiteSpace: 'pre-line'
            }}>
              {bannerTitle.includes('\n') ? (
                <>
                  {bannerTitle.split('\n')[0]}<br />
                  <span style={{ color: '#EEC5C5' }}>{bannerTitle.split('\n')[1]}</span>
                </>
              ) : (
                <span style={{ color: '#EEC5C5' }}>{bannerTitle}</span>
              )}
            </h1>

            <p className="fade-up fade-up-3" style={{
              color: '#9CA3AF', fontSize: 15, lineHeight: 1.8,
              marginBottom: 40, maxWidth: 460, fontWeight: 300,
              fontFamily: "'Inter', sans-serif"
            }}>
              {bannerSubtitle}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/catalog" className="hero-cta-yellow fade-up fade-up-3" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#EEC5C5', color: '#1E1A1A',
                fontWeight: 500, fontSize: 13, padding: '14px 28px',
                borderRadius: 8, textDecoration: 'none',
                letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif"
              }}>
                Ver catálogo <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="hero-cta-outline fade-up fade-up-4" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1px solid rgba(255,255,255,0.2)', color: '#FAF7F4',
                fontWeight: 400, fontSize: 13, padding: '14px 28px',
                borderRadius: 8, textDecoration: 'none',
                letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif"
              }}>
                Precio mayorista
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #EDE8E4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              { label: 'Importado desde Corea', sub: 'Productos auténticos K-beauty' },
              { label: 'Envíos gratis desde S/ 200', sub: 'A todo Lima en pedidos calificados' },
              { label: 'Entrega en Lima', sub: 'Envío rápido a todo el país' },
            ].map((item, i) => (
              <div key={i} className="trust-item" style={{
                padding: '20px 24px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid #EDE8E4' : 'none'
              }}>
                <div style={{ fontWeight: 500, fontSize: 13, color: '#1E1A1A', letterSpacing: '0.02em', fontFamily: "'Inter', sans-serif" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, fontFamily: "'Inter', sans-serif" }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Sellers ── */}
      <section style={{ padding: '72px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 44 }}>
          <div>
            <p style={{
              fontSize: 10, fontWeight: 500, color: '#C49A8A',
              letterSpacing: '4px', marginBottom: 10, textTransform: 'uppercase',
              fontFamily: "'Inter', sans-serif"
            }}>
              ✦ más vendidos
            </p>
            <h2 style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 100, color: '#1E1A1A', lineHeight: 1.1,
              letterSpacing: '0.05em', textTransform: 'uppercase'
            }}>
              Los favoritos
            </h2>
          </div>
          <Link href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 500, color: '#1E1A1A',
            textDecoration: 'none', paddingBottom: 4,
            borderBottom: '1px solid #EEC5C5', letterSpacing: '0.05em',
            fontFamily: "'Inter', sans-serif"
          }}>
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {topSellers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  border: '1.5px dashed #EDE8E4', borderRadius: 16,
                  aspectRatio: '3/4', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#FAF7F4'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#EEC5C5', color: '#1E1A1A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 500, fontSize: 12, fontFamily: "'Inter', sans-serif"
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 10, color: '#C49A8A', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Próximamente</span>
                </div>
              ))}
            </div>
            <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Agrega productos desde el panel de administración</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const product = topSellers[i]
              if (product) return <ProductCard key={product.id} product={product} rank={i + 1} />
              return (
                <div key={`empty-${i}`} style={{
                  border: '1.5px dashed #EDE8E4', borderRadius: 16,
                  aspectRatio: '3/4', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#FAF7F4'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#EDE8E4', color: '#9CA3AF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 500, fontSize: 11
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 10, color: '#C49A8A', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Próximamente</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Skincare CTA ── */}
      <section style={{
        margin: '0 24px 72px', maxWidth: 1232, marginLeft: 'auto', marginRight: 'auto',
        background: '#EEC5C5', borderRadius: 20, padding: '52px 56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 24
      }}>
        <div>
          <p style={{
            color: '#C49A8A', fontWeight: 500, fontSize: 10,
            letterSpacing: '4px', marginBottom: 10, textTransform: 'uppercase',
            fontFamily: "'Inter', sans-serif"
          }}>SPAS · CLÍNICAS · DISTRIBUIDORES</p>
          <h3 style={{
            fontFamily: "'Josefin Sans', sans-serif",
            color: '#1E1A1A', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 100, lineHeight: 1.15, letterSpacing: '0.04em', textTransform: 'uppercase'
          }}>
            ¿Compras en volumen?<br />Tenemos precio mayorista.
          </h3>
        </div>
        <Link href="/contact" className="wholesale-cta" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#1E1A1A', color: '#EEC5C5',
          fontWeight: 500, fontSize: 13, padding: '14px 28px',
          borderRadius: 10, textDecoration: 'none', flexShrink: 0,
          letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif"
        }}>
          Consultar ahora <ArrowRight size={16} />
        </Link>
      </section>
    </>
  )
}
