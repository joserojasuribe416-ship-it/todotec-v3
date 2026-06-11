import Link from 'next/link'
import { fetchProducts, fetchConfig, fetchSections, fetchBanners } from '../lib/api'
import ProductCard from '../components/ProductCard'
import BannerCarousel from '../components/BannerCarousel'

export default async function HomePage() {
  const [products, config, sections, banners] = await Promise.all([
    fetchProducts({ store_only: 'true' }),
    fetchConfig().catch(() => null),
    fetchSections().catch(() => []),
    fetchBanners().catch(() => []),
  ])

  // Build a map for quick lookup
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

  // Get section data; fall back to first/last 10 products if no selections made
  const favSection  = sections.find(s => s.key === 'favoritos') || {}
  const newSection  = sections.find(s => s.key === 'nuevos')    || {}

  const favIds  = favSection.product_ids  || []
  const newIds  = newSection.product_ids  || []
  const favMax  = favSection.max_items    || 10
  const newMax  = newSection.max_items    || 10

  const favTitle    = favSection.title    || 'Los favoritos'
  const favSubtitle = favSection.subtitle || '✦ más vendidos'
  const newTitle    = newSection.title    || 'Lo más nuevo'
  const newSubtitle = newSection.subtitle || '✦ recién llegados'

  // If admin hasn't picked products yet, fall back to all products
  const topSellers  = (favIds.length > 0
    ? favIds.map(id => productMap[id]).filter(Boolean)
    : products).slice(0, favMax)

  const newArrivals = (newIds.length > 0
    ? newIds.map(id => productMap[id]).filter(Boolean)
    : products).slice(0, newMax)

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>

      {/* ── Banner Carousel ── */}
      <section className="banner-section" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0' }}>
        <BannerCarousel banners={banners} />
      </section>

      {/* ── Promo strip 2 cols ── */}
      <section style={{ maxWidth: 1280, margin: '14px auto 0', padding: '0 24px' }}>
        <div className="promo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{
            background: '#1E1A1A', borderRadius: 14, padding: '22px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
          }}>
            <div>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 20, fontWeight: 100, color: '#FAF7F4', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                Puntos para<br />recojo gratis
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
      <section className="sec-pad-top" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 500, color: '#C49A8A', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{favSubtitle}</div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 22, fontWeight: 100, color: '#1E1A1A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{favTitle}</div>
          </div>
          <Link href="/catalog" style={{ fontSize: 11, fontWeight: 500, color: '#1E1A1A', textDecoration: 'none', paddingBottom: 2, borderBottom: '1px solid #EEC5C5' }}>Ver todos →</Link>
        </div>

        {topSellers.length === 0 ? (
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ border: '1.5px dashed #EDE8E4', borderRadius: 12, aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EEC5C5', color: '#1E1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>{i + 1}</div>
                <span style={{ fontSize: 9, color: '#C49A8A', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Próximamente</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {topSellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── Lo más nuevo ── */}
      <section className="sec-pad-bottom" style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 500, color: '#C49A8A', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{newSubtitle}</div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 22, fontWeight: 100, color: '#1E1A1A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{newTitle}</div>
          </div>
          <Link href="/catalog" style={{ fontSize: 11, fontWeight: 500, color: '#1E1A1A', textDecoration: 'none', paddingBottom: 2, borderBottom: '1px solid #EEC5C5' }}>Ver todos →</Link>
        </div>

        {newArrivals.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Agrega productos desde el panel de administración</p>
        ) : (
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

    </div>
  )
}
