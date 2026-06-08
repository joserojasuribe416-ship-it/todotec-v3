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
    fetch(`${API_BASE}/api/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data.map(c => c.name)))
      .catch(() => setCategories([]))
    return () => window.removeEventListener('cartUpdated', updateCart)
  }, [])

  useEffect(() => {
    const h = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
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
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, height: 72 }}>

          {/* Logo — solo texto */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1 }}>
            <div style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 100, fontSize: 22, color: '#1E1A1A',
              letterSpacing: '10px', textTransform: 'uppercase',
              textIndent: '10px'
            }}>GLOWI</div>
            <div style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 300, fontSize: 8, color: '#C49A8A',
              letterSpacing: '5px', textTransform: 'uppercase',
              textIndent: '5px', marginTop: 1
            }}>SKIN</div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 580 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1px solid #EDE8E4', borderRadius: 8, overflow: 'hidden',
              background: '#fff'
            }}>
              <div style={{ padding: '0 14px', color: '#C49A8A', display: 'flex' }}>
                <Search size={15} />
              </div>
              <input
                className="tt-input"
                style={{ flex: 1, height: 42, fontSize: 13, fontFamily: "'Inter', sans-serif" }}
                placeholder="Buscar serum, toner, moisturizer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} style={{ padding: '0 10px', color: '#C49A8A', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={13} />
                </button>
              )}
              <div ref={catRef} style={{ position: 'relative', borderLeft: '1px solid #EDE8E4' }}>
                <button type="button" onClick={() => setCatOpen(o => !o)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0 14px', height: 42, background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 400, fontSize: 12, color: '#1E1A1A',
                  whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em'
                }}>
                  {activeCat || 'Categoría'} <ChevronDown size={12} />
                </button>
                {catOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, width: 196,
                    background: '#fff', border: '1px solid #EDE8E4', borderRadius: 10,
                    boxShadow: '0 8px 32px rgba(30,26,26,0.10)', zIndex: 100, overflow: 'hidden'
                  }}>
                    <button onClick={() => selectCat('')} style={{
                      display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                      background: !activeCat ? '#FDF0F0' : 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: '#1E1A1A', fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em'
                    }}>Todos los productos</button>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => selectCat(cat)} style={{
                        display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                        background: activeCat === cat ? '#FDF0F0' : 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: '#374151', fontFamily: "'Inter', sans-serif"
                      }}>{cat}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" style={{
                height: 42, padding: '0 18px', background: '#1E1A1A', color: '#EEC5C5',
                border: 'none', cursor: 'pointer', fontWeight: 400, fontSize: 11,
                letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
              }}
                onMouseEnter={e => e.target.style.background = '#3A3434'}
                onMouseLeave={e => e.target.style.background = '#1E1A1A'}
              >Buscar</button>
            </div>
          </form>

          {/* Cart */}
          <Link href="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '8px 0' }}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={19} color="#1E1A1A" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -7, right: -7, width: 16, height: 16,
                  background: '#EEC5C5', color: '#1E1A1A', fontSize: 9, fontWeight: 600,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Inter', sans-serif"
                }}>{cartCount}</span>
              )}
            </div>
            <span style={{ fontWeight: 400, fontSize: 12, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
              Carrito
            </span>
          </Link>
        </div>
      </div>

      {/* Category bar */}
      <div style={{ borderTop: '1px solid #EDE8E4', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 2, height: 38, overflowX: 'auto' }}>
          <Link href="/catalog" style={{
            padding: '2px 12px', borderRadius: 4,
            fontWeight: 400, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            textDecoration: 'none', background: '#1E1A1A', color: '#EEC5C5',
            whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif"
          }}>Todo</Link>
          {categories.map(cat => (
            <Link key={cat} href={`/catalog?category=${encodeURIComponent(cat)}`} style={{
              padding: '2px 12px', borderRadius: 4,
              fontWeight: 400, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              textDecoration: 'none', color: '#6B7280', whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif", transition: 'all 0.15s'
            }}
              onMouseEnter={e => { e.target.style.color = '#1E1A1A'; e.target.style.background = '#FDF0F0' }}
              onMouseLeave={e => { e.target.style.color = '#6B7280'; e.target.style.background = 'transparent' }}
            >{cat}</Link>
          ))}
          <div style={{ flex: 1 }} />
          <Link href="/contact" style={{
            fontSize: 10, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase',
            textDecoration: 'none', color: '#C49A8A', fontFamily: "'Inter', sans-serif"
          }}>Contacto</Link>
        </div>
      </div>
    </header>
  )
}
