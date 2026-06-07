'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, ChevronDown, X } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Navbar() {
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const catRef = useRef(null)

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
        setCartCount(cart.reduce((s, i) => s + i.quantity, 0))
      } catch {}
    }
    updateCart()
    window.addEventListener('cartUpdated', updateCart)

    // Load categories from API
    fetch(`${API_BASE}/api/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data.map(c => c.name)))
      .catch(() => setCategories([]))

    return () => window.removeEventListener('cartUpdated', updateCart)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const qs = new URLSearchParams()
    if (search.trim()) qs.set('search', search.trim())
    if (activeCat) qs.set('category', activeCat)
    router.push(`/catalog${qs.toString() ? '?' + qs.toString() : ''}`)
  }

  const selectCat = (cat) => {
    setActiveCat(cat)
    setCatOpen(false)
    const qs = new URLSearchParams()
    if (search.trim()) qs.set('search', search.trim())
    if (cat) qs.set('category', cat)
    router.push(`/catalog${qs.toString() ? '?' + qs.toString() : ''}`)
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #E5E7EB' }}>

      {/* ── Top bar: Logo + Search + Cart ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 68 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, background: '#1E3A8A', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #FFD100'
            }}>
              <span style={{ color: '#FFD100', fontWeight: 900, fontSize: 15, letterSpacing: '-1px' }}>TT</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#1E3A8A', letterSpacing: '-0.5px' }}>TodoTec</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 640 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              border: '1.5px solid #1E3A8A', borderRadius: 8, overflow: 'hidden',
              background: '#F7F8FA'
            }}>
              <div style={{ padding: '0 14px', color: '#6B7280' }}>
                <Search size={17} />
              </div>
              <input
                className="tt-input"
                style={{ flex: 1, height: 44, fontSize: 14 }}
                placeholder="Buscar productos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} style={{ padding: '0 10px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={15} />
                </button>
              )}

              {/* Category dropdown */}
              <div ref={catRef} style={{ position: 'relative', borderLeft: '1.5px solid #1E3A8A' }}>
                <button
                  type="button"
                  onClick={() => setCatOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0 16px', height: 44, background: 'none', border: 'none',
                    cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#1E3A8A',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activeCat || 'Categoría'} <ChevronDown size={14} />
                </button>
                {catOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, width: 180,
                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => selectCat('')}
                      style={{
                        display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                        background: !activeCat ? '#EEF4FF' : 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: !activeCat ? 700 : 400, color: '#1E3A8A'
                      }}
                    >Todas las categorías</button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => selectCat(cat)}
                        style={{
                          display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                          background: activeCat === cat ? '#EEF4FF' : 'none', border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: activeCat === cat ? 700 : 400, color: '#374151'
                        }}
                      >{cat}</button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={{
                  height: 44, padding: '0 20px', background: '#1E3A8A', color: '#FFD100',
                  border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.target.style.background = '#0067B1'}
                onMouseLeave={e => e.target.style.background = '#1E3A8A'}
              >Buscar</button>
            </div>
          </form>

          {/* Cart */}
          <Link href="/cart" className="cart-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0A0A0A', padding: '8px 0' }}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={22} color="#1E3A8A" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -8, right: -8, width: 18, height: 18,
                  background: '#FFD100', color: '#1E3A8A', fontSize: 10, fontWeight: 900,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{cartCount}</span>
              )}
            </div>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1E3A8A', display: 'none' }} className="lg:block">
              Carrito
            </span>
          </Link>
        </div>
      </div>

      {/* ── Category nav bar ── */}
      <div style={{ borderTop: '1px solid #E5E7EB', background: '#F7F8FA' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 4, height: 42, overflowX: 'auto' }}>
          <Link href="/catalog" style={{
            padding: '4px 14px', borderRadius: 6, fontWeight: 700, fontSize: 12,
            textDecoration: 'none', color: '#1E3A8A', background: '#1E3A8A', color: '#FFD100',
            whiteSpace: 'nowrap', transition: 'all 0.15s'
          }}>Todos</Link>
          {categories.map(cat => (
            <Link
              key={cat}
              href={`/catalog?category=${encodeURIComponent(cat)}`}
              style={{
                padding: '4px 14px', borderRadius: 6, fontWeight: 600, fontSize: 12,
                textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.target.style.background = '#E5E7EB'; e.target.style.color = '#1E3A8A' }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#374151' }}
            >{cat}</Link>
          ))}
          <div style={{ flex: 1 }} />
          <Link href="/contact" style={{
            padding: '4px 14px', fontSize: 12, fontWeight: 600,
            textDecoration: 'none', color: '#6B7280', whiteSpace: 'nowrap'
          }}>Contacto</Link>
        </div>
      </div>
    </header>
  )
}
