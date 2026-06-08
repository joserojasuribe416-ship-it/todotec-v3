'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, ChevronDown, X } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Navbar({ companyName = 'Glowi Skin', logoUrl = '' }) {
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
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#FAF7F4', borderBottom: '1px solid #EDE8E4' }}>

      {/* ── Top bar ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 68 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8 }} />
            ) : (
              <div style={{
                width: 38, height: 38, background: '#1E1A1A', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid #EEC5C5', flexShrink: 0
              }}>
                <span style={{ color: '#EEC5C5', fontWeight: 300, fontSize: 12, letterSpacing: '2px', fontFamily: "'Josefin Sans', sans-serif" }}>
                  GS
                </span>
              </div>
            )}
            <div>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 18, color: '#1E1A1A', letterSpacing: '6px', textTransform: 'uppercase', lineHeight: 1 }}>
                {companyName.split(' ')[0] || 'GLOWI'}
              </div>
              {companyName.split(' ')[1] && (
                <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 9, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase' }}>
                  {companyName.split(' ').slice(1).join(' ')}
                </div>
              )}
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 600 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1.5px solid #EDE8E4', borderRadius: 8, overflow: 'hidden',
              background: '#fff', transition: 'border-color 0.2s'
            }}
              onFocus={() => {}}
            >
              <div style={{ padding: '0 14px', color: '#C49A8A' }}>
                <Search size={16} />
              </div>
              <input
                className="tt-input"
                style={{ flex: 1, height: 42, fontSize: 13, fontFamily: "'Inter', sans-serif" }}
                placeholder="Buscar serum, toner, moisturizer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} style={{ padding: '0 10px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
              <div ref={catRef} style={{ position: 'relative', borderLeft: '1px solid #EDE8E4' }}>
                <button
                  type="button"
                  onClick={() => setCatOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0 14px', height: 42, background: 'none', border: 'none',
                    cursor: 'pointer', fontWeight: 500, fontSize: 12, color: '#1E1A1A',
                    whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em'
                  }}
                >
                  {activeCat || 'Categoría'} <ChevronDown size={13} />
                </button>
                {catOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, width: 190,
                    background: '#fff', border: '1px solid #EDE8E4', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(30,26,26,0.10)', zIndex: 100, overflow: 'hidden'
                  }}>
                    <button onClick={() => selectCat('')} style={{
                      display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                      background: !activeCat ? '#FDF0F0' : 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: !activeCat ? 600 : 400, color: '#1E1A1A', fontFamily: "'Inter', sans-serif"
                    }}>Todos los productos</button>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => selectCat(cat)} style={{
                        display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                        background: activeCat === cat ? '#FDF0F0' : 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: activeCat === cat ? 600 : 400, color: '#374151', fontFamily: "'Inter', sans-serif"
                      }}>{cat}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" style={{
                height: 42, padding: '0 18px', background: '#1E1A1A', color: '#EEC5C5',
                border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 12,
                letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif",
                transition: 'background 0.15s'
              }}
                onMouseEnter={e => e.target.style.background = '#3A3434'}
                onMouseLeave={e => e.target.style.background = '#1E1A1A'}
              >Buscar</button>
            </div>
          </form>

          {/* Cart */}
          <Link href="/cart" className="cart-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '8px 0' }}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={20} color="#1E1A1A" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -7, right: -7, width: 17, height: 17,
                  background: '#EEC5C5', color: '#1E1A1A', fontSize: 9, fontWeight: 700,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{cartCount}</span>
              )}
            </div>
            <span style={{ fontWeight: 500, fontSize: 12, color: '#1E1A1A', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>
              Carrito
            </span>
          </Link>
        </div>
      </div>

      {/* ── Category nav ── */}
      <div style={{ borderTop: '1px solid #EDE8E4', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 2, height: 40, overflowX: 'auto' }}>
          <Link href="/catalog" style={{
            padding: '3px 12px', borderRadius: 6, fontWeight: 600, fontSize: 11,
            textDecoration: 'none', background: '#1E1A1A', color: '#EEC5C5',
            whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: "'Inter', sans-serif"
          }}>Todo</Link>
          {categories.map(cat => (
            <Link key={cat} href={`/catalog?category=${encodeURIComponent(cat)}`} style={{
              padding: '3px 12px', borderRadius: 6, fontWeight: 500, fontSize: 11,
              textDecoration: 'none', color: '#6B7280', whiteSpace: 'nowrap',
              letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s'
            }}
              onMouseEnter={e => { e.target.style.color = '#1E1A1A'; e.target.style.background = '#FDF0F0' }}
              onMouseLeave={e => { e.target.style.color = '#6B7280'; e.target.style.background = 'transparent' }}
            >{cat}</Link>
          ))}
          <div style={{ flex: 1 }} />
          <Link href="/contact" style={{
            padding: '3px 12px', fontSize: 11, fontWeight: 500, fontFamily: "'Inter', sans-serif",
            textDecoration: 'none', color: '#C49A8A', whiteSpace: 'nowrap', letterSpacing: '0.04em'
          }}>Contacto</Link>
        </div>
      </div>
    </header>
  )
}
