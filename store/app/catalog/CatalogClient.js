'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProductCard from '../../components/ProductCard'
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'

const PRICE_RANGES = [
  { label: 'Hasta S/ 50',      min: 0,   max: 50 },
  { label: 'S/ 50 – S/ 100',   min: 50,  max: 100 },
  { label: 'S/ 100 – S/ 200',  min: 100, max: 200 },
  { label: 'Más de S/ 200',    min: 200, max: 99999 },
]

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Relevancia' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 18 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          paddingBottom: 10, borderBottom: '1px solid #EDE8E4',
          fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500, color: '#1E1A1A'
        }}
      >
        {title}
        {open ? <ChevronUp size={13} color="#9CA3AF" /> : <ChevronDown size={13} color="#9CA3AF" />}
      </button>
      {open && <div style={{ paddingTop: 10 }}>{children}</div>}
    </div>
  )
}

export default function CatalogClient({ products, categories, activeCategory, activeSearch }) {
  const router = useRouter()
  const [sort, setSort] = useState('relevance')
  const [priceRange, setPriceRange] = useState(null)

  const sorted = products
    .filter(p => {
      if (!priceRange) return true
      return p.sale_price >= priceRange.min && p.sale_price < priceRange.max
    })
    .sort((a, b) => {
      if (sort === 'price_asc')  return a.sale_price - b.sale_price
      if (sort === 'price_desc') return b.sale_price - a.sale_price
      return 0
    })

  const heading = activeSearch
    ? `Resultados para "${activeSearch}"`
    : activeCategory || 'Todos los productos'

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>

      {/* Breadcrumb + title strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EDE8E4', padding: '14px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>
            <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Inicio</Link>
            {' / '}
            <span style={{ color: '#1E1A1A', fontWeight: 500 }}>{activeCategory || 'Catálogo'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h1 style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: 22, fontWeight: 100, color: '#1E1A1A',
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>{heading}</h1>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                {sorted.length} resultado{sorted.length !== 1 ? 's' : ''}
              </p>
            </div>
            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={14} color="#9CA3AF" />
              <span style={{ fontSize: 11, color: '#6B7280', fontFamily: "'Inter', sans-serif" }}>Ordenar por:</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  border: '1px solid #EDE8E4', borderRadius: 7, padding: '5px 10px',
                  fontSize: 11, outline: 'none', background: '#fff',
                  fontFamily: "'Inter', sans-serif", color: '#1E1A1A', cursor: 'pointer'
                }}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── SIDEBAR ── */}
        <aside>
          <div style={{ background: '#fff', border: '1px solid #EDE8E4', borderRadius: 12, padding: '18px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
              Filtrar por
            </div>

            <FilterGroup title="Categoría">
              {[{ name: 'Todos', value: '' }, ...categories.map(c => ({ name: c, value: c }))].map(cat => (
                <div
                  key={cat.value}
                  onClick={() => router.push(cat.value ? `/catalog?category=${encodeURIComponent(cat.value)}` : '/catalog')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      border: activeCategory === cat.value ? 'none' : '1.5px solid #EDE8E4',
                      background: activeCategory === cat.value ? '#1E1A1A' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {activeCategory === cat.value && <span style={{ color: '#EEC5C5', fontSize: 9 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 11, color: '#374151', fontFamily: "'Inter', sans-serif" }}>{cat.name}</span>
                  </div>
                </div>
              ))}
            </FilterGroup>

            <FilterGroup title="Precio">
              {PRICE_RANGES.map((r) => (
                <div
                  key={r.label}
                  onClick={() => setPriceRange(priceRange?.label === r.label ? null : r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: priceRange?.label === r.label ? 'none' : '1.5px solid #EDE8E4',
                    background: priceRange?.label === r.label ? '#1E1A1A' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {priceRange?.label === r.label && <span style={{ color: '#EEC5C5', fontSize: 9 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 11, color: '#374151', fontFamily: "'Inter', sans-serif" }}>{r.label}</span>
                </div>
              ))}
            </FilterGroup>

          </div>
        </aside>

        {/* ── PRODUCT GRID ── */}
        <div>
          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 40, fontWeight: 100, color: '#EEC5C5', marginBottom: 12 }}>✦</div>
              <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 18, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Sin resultados</h2>
              <p style={{ color: '#9CA3AF', marginBottom: 24, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Intenta con otra búsqueda o categoría</p>
              <button
                onClick={() => router.push('/catalog')}
                style={{
                  background: '#1E1A1A', color: '#EEC5C5', fontWeight: 400,
                  padding: '11px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase'
                }}
              >Ver todo el catálogo</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {sorted.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
