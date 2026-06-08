import { fetchProducts, fetchCategories } from '../../lib/api'
import ProductCard from '../../components/ProductCard'
import Link from 'next/link'

export default async function CatalogPage({ searchParams }) {
  const params = {
    store_only: 'true',
    ...(searchParams.category ? { category: searchParams.category } : {}),
    ...(searchParams.search   ? { search: searchParams.search }   : {}),
  }
  const [products, categories] = await Promise.all([fetchProducts(params), fetchCategories()])
  const activeCategory = searchParams.category || ''
  const activeSearch   = searchParams.search   || ''

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      {/* Header strip */}
      <div style={{ background: '#1E1A1A', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10 }}>
            {activeSearch ? `resultados para "${activeSearch}"` : activeCategory || 'catálogo completo'}
          </p>
          <h1 style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 100, color: '#FAF7F4',
            letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1
          }}>
            {activeCategory || 'Todos los\nproductos'}
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', marginTop: 10, fontWeight: 300 }}>
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 24px' }}>
        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
          <Link href="/catalog" style={{
            padding: '6px 18px', borderRadius: 30, fontSize: 11, fontWeight: 400,
            textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: "'Inter', sans-serif",
            background: !activeCategory ? '#1E1A1A' : 'transparent',
            color: !activeCategory ? '#EEC5C5' : '#6B7280',
            border: `1px solid ${!activeCategory ? '#1E1A1A' : '#EDE8E4'}`,
          }}>Todos</Link>
          {categories.map(cat => (
            <Link key={cat}
              href={`/catalog?category=${encodeURIComponent(cat)}${activeSearch ? `&search=${encodeURIComponent(activeSearch)}` : ''}`}
              style={{
                padding: '6px 18px', borderRadius: 30, fontSize: 11, fontWeight: 400,
                textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: "'Inter', sans-serif",
                background: activeCategory === cat ? '#EEC5C5' : 'transparent',
                color: activeCategory === cat ? '#1E1A1A' : '#6B7280',
                border: `1px solid ${activeCategory === cat ? '#EEC5C5' : '#EDE8E4'}`,
              }}
            >{cat}</Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 48, fontWeight: 100, color: '#EEC5C5', letterSpacing: '0.1em', marginBottom: 16 }}>✦</div>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 20, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Sin resultados</h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: '#9CA3AF', marginBottom: 28, fontWeight: 300, fontSize: 14 }}>Intenta con otra búsqueda o categoría</p>
            <Link href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#1E1A1A', color: '#EEC5C5', fontWeight: 400,
              padding: '12px 28px', borderRadius: 8, textDecoration: 'none',
              fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase'
            }}>Ver todo el catálogo</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
