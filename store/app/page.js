import Link from 'next/link'
import { fetchProducts, fetchConfig } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const [products, config] = await Promise.all([
    fetchProducts({ store_only: 'true' }),
    fetchConfig().catch(() => null),
  ])
  const topSellers = products.slice(0, 10)
  const newArrivals = products.slice(0, 10)

  const bannerTitle    = config?.banner_title    || 'Tu rutina coreana,\nen un solo lugar.'
  const bannerSubtitle = config?.banner_subtitle || 'Korean skincare importado directamente desde Corea del Sur.'

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>

      {/* ── Banner Grid 3 cols ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

          {/* Banner 1 — Hero oscuro */}
          <div style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{
              background: '#1E1A1A', height: 220, padding: '28px 28px 24px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(238,197,197,0.06)' }} />
              <div style={{ position: 'absolute', right: 40, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(196,154,138,0.07)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: '#EEC5C5', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
                  Korean Skincare
                </div>
                <div style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: 26, fontWeight: 100, color: '#FAF7F4',
                  letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1,
                  whiteSpace: 'pre-line'
                }}>
                  {bannerTitle.split('\n')[0]}{'\n'}
                  <span style={{ color: '#EEC5C5' }}>{bannerTitle.split('\n')[1] || ''}</span>
                </div>
                <Link href="/catalog" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14,
                  background: '#EEC5C5', color: '#1E1A1A', fontWeight: 500,
                  fontSize: 10, padding: '7px 16px', borderRadius: 5, textDecoration: 'none',
                  letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif"
                }}>Ver catálogo <ArrowRight size={12} /></Link>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #EDE8E4', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1E1A1A', marginBottom: 2 }}>Catálogo completo</div>
              <Link href="/catalog" style={{ fontSize: 11, color: '#C49A8A', textDecoration: 'none' }}>¡Ver todos los productos!</Link>
            </div>
          </div>

          {/* Banner 2 — Blush */}
          <div style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{
              background: 'linear-gradient(135deg, #EEC5C5 30%, #C49A8A)',
              height: 220, padding: '28px 28px 24px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', left: -20, top: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(30,26,26,0.65)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
                  Ofertas especiales
                </div>
                <div style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: 26, fontWeight: 100, color: '#1E1A1A',
                  letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1
                }}>
                  Hasta<br />30% dscto.
                </div>
                <Link href="/catalog" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14,
                  background: '#1E1A1A', color: '#EEC5C5', fontWeight: 500,
                  fontSize: 10, padding: '7px 16px', borderRadius: 5, textDecoration: 'none',
                  letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif"
                }}>Ver ofertas <ArrowRight size={12} /></Link>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #EDE8E4', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1E1A1A', marginBottom: 2 }}>Descuentos en serums</div>
              <Link href="/catalog" style={{ fontSize: 11, color: '#C49A8A', textDecoration: 'none' }}>¡Compra Aquí!</Link>
            </div>
          </div>

          {/* Banner 3 — Sage */}
          <div style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{
              background: 'linear-gradient(135deg, #B5C4B1 30%, #8aa385)',
              height: 220, padding: '28px 28px 24px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(30,26,26,0.6)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
                  Protección solar
                </div>
                <div style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: 26, fontWeight: 100, color: '#fff',
                  letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1
                }}>
                  SPF Coreano<br />esencial
                </div>
                <Link href="/catalog?category=Protector%20Solar" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14,
                  background: '#fff', color: '#1E1A1A', fontWeight: 500,
                  fontSize: 10, padding: '7px 16px', borderRadius: 5, textDecoration: 'none',
                  letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif"
                }}>Ver SPF <ArrowRight size={12} /></Link>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #EDE8E4', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1E1A1A', marginBottom: 2 }}>Pack SPF Coreano</div>
              <Link href="/catalog?category=Protector%20Solar" style={{ fontSize: 11, color: '#C49A8A', textDecoration: 'none' }}>¡Compra Aquí!</Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Promo strip 2 cols ── */}
      <section style={{ maxWidth: 1280, margin: '14px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{
            background: '#1E1A1A', borderRadius: 14, padding: '22px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
          }}>
            <div>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 20, fontWeight: 100, color: '#FAF7F4', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                Retiro en<br />Lima Centro
              </div>
              <div style={{ fontSize: 11, fontWeight: 300, color: '#6B7280', marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                Coordinamos entrega directa
              </div>
            </div>
            <Link href="/contact" style={{
              flexShrink: 0, background: '#EEC5C5', color: '#1E1A1A',
              padding: '9px 18px', borderRadius: 7, textDecoration: 'none',
              fontSize: 10, fontWeight: 500, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: "'Inter', sans-serif"
            }}>Ver info</Link>
          </div>
          <div style={{
            background: '#EEC5C5', borderRadius: 14, padding: '22px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
          }}>
            <div>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 20, fontWeight: 100, color: '#1E1A1A', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                Compras al<br />por mayor
              </div>
              <div style={{ fontSize: 11, fontWeight: 300, color: '#7a5a50', marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                Spas, clínicas y distribuidores
              </div>
            </div>
            <Link href="/contact" style={{
              flexShrink: 0, background: '#1E1A1A', color: '#EEC5C5',
              padding: '9px 18px', borderRadius: 7, textDecoration: 'none',
              fontSize: 10, fontWeight: 500, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: "'Inter', sans-serif"
            }}>Consultar</Link>
          </div>
        </div>
      </section>

      {/* ── Top Sellers ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 500, color: '#C49A8A', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>✦ más vendidos</div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 22, fontWeight: 100, color: '#1E1A1A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Los favoritos</div>
          </div>
          <Link href="/catalog" style={{ fontSize: 11, fontWeight: 500, color: '#1E1A1A', textDecoration: 'none', paddingBottom: 2, borderBottom: '1px solid #EEC5C5' }}>Ver todos →</Link>
        </div>

        {topSellers.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ border: '1.5px dashed #EDE8E4', borderRadius: 12, aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EEC5C5', color: '#1E1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>{i + 1}</div>
                <span style={{ fontSize: 9, color: '#C49A8A', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Próximamente</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {topSellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── Lo más nuevo ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 500, color: '#C49A8A', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>✦ recién llegados</div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 22, fontWeight: 100, color: '#1E1A1A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Lo más nuevo</div>
          </div>
          <Link href="/catalog" style={{ fontSize: 11, fontWeight: 500, color: '#1E1A1A', textDecoration: 'none', paddingBottom: 2, borderBottom: '1px solid #EEC5C5' }}>Ver todos →</Link>
        </div>

        {newArrivals.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Agrega productos desde el panel de administración</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

    </div>
  )
}
