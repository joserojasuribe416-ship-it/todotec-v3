import { fetchProducts, fetchCategories } from '../../lib/api'
import ProductCard from '../../components/ProductCard'
import Link from 'next/link'

export default async function CatalogPage({ searchParams }) {
  const params = {
    store_only: 'true',
    ...(searchParams.category ? { category: searchParams.category } : {}),
    ...(searchParams.search   ? { search: searchParams.search }   : {}),
  }

  const [products, categories] = await Promise.all([
    fetchProducts(params),
    fetchCategories(),
  ])

  const activeCategory = searchParams.category || ''
  const activeSearch   = searchParams.search   || ''

  return (
    <>
      <style>{`
        .cat-pill { transition: all 0.15s; }
        .cat-pill:hover { opacity: 0.8; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#0A0A0A', marginBottom: 6 }}>
            {activeCategory || 'Catálogo'}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
            {activeSearch && <> para &ldquo;<strong>{activeSearch}</strong>&rdquo;</>}
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          <Link href="/catalog" className="cat-pill" style={{
            padding: '6px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13,
            textDecoration: 'none',
            background: !activeCategory ? '#1E3A8A' : '#F7F8FA',
            color:      !activeCategory ? '#FFD100' : '#374151',
            border: `1.5px solid ${!activeCategory ? '#1E3A8A' : '#E5E7EB'}`,
          }}>Todos</Link>

          {categories.map(cat => (
            <Link
              key={cat}
              href={`/catalog?category=${encodeURIComponent(cat)}${activeSearch ? `&search=${encodeURIComponent(activeSearch)}` : ''}`}
              className="cat-pill"
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 13,
                fontWeight: activeCategory === cat ? 700 : 500,
                textDecoration: 'none',
                background: activeCategory === cat ? '#FFD100' : '#F7F8FA',
                color:      activeCategory === cat ? '#1E3A8A' : '#374151',
                border: `1.5px solid ${activeCategory === cat ? '#FFD100' : '#E5E7EB'}`,
              }}
            >{cat}</Link>
          ))}
        </div>

        {/* Grid */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#374151', marginBottom: 8 }}>Sin resultados</h2>
            <p style={{ color: '#6B7280', marginBottom: 24 }}>Intenta con otra búsqueda o categoría</p>
            <Link href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#1E3A8A', color: '#FFD100', fontWeight: 700,
              padding: '10px 24px', borderRadius: 8, textDecoration: 'none',
            }}>Ver todos los productos</Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </>
  )
}
