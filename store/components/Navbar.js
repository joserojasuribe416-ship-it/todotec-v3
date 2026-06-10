'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { loadCart } from '../lib/cartStorage'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ShoppingCart, Search, X, User, Phone } from 'lucide-react'
import { isLoggedIn, getCustomer } from '../lib/customer'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function NavbarInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [cartCount, setCartCount] = useState(0)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [customerName, setCustomerName] = useState(null)
  const activeCategory = searchParams.get('category') || ''

  useEffect(() => {
    const updateCustomer = () => {
      if (isLoggedIn()) {
        const c = getCustomer()
        setCustomerName(c?.nombre || 'Mi Perfil')
      } else {
        setCustomerName(null)
      }
    }
    updateCustomer()
    window.addEventListener('customerUpdated', updateCustomer)
    return () => window.removeEventListener('customerUpdated', updateCustomer)
  }, [])

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = loadCart()
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

  const handleSearch = (e) => {
    e.preventDefault()
    const qs = new URLSearchParams()
    if (search.trim()) qs.set('search', search.trim())
    router.push(`/catalog${qs.toString() ? '?' + qs.toString() : ''}`)
  }

  const isHome = pathname === '/'
  const isCatalog = pathname.startsWith('/catalog')

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>

      {/* ── Announcement bar ── */}
      <div style={{
        background: '#EEC5C5', textAlign: 'center', padding: '7px 16px',
        fontSize: 11, fontWeight: 500, color: '#1E1A1A', letterSpacing: '0.02em',
        fontFamily: "'Inter', sans-serif"
      }}>
        <em style={{ fontStyle: 'italic', fontWeight: 600 }}>Envío gratis</em>
        {' '}por compras desde S/200.{' '}
        <span style={{ opacity: 0.7, fontSize: 10 }}>Aplican T&C</span>
      </div>

      {/* ── Main header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EDE8E4' }}>
        <div className="nb-header-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 24, height: 64 }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1 }}>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 20, color: '#1E1A1A', letterSpacing: '9px', textTransform: 'uppercase', textIndent: '9px' }}>GLOWI</div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 7, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', textIndent: '4px', marginTop: 1 }}>SKIN</div>
          </Link>

          {/* Search — desktop */}
          <form className="nb-search-desktop" onSubmit={handleSearch} style={{ flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1.5px solid #EDE8E4', borderRadius: 50, background: '#FAF7F4',
              overflow: 'hidden', height: 40,
            }}>
              <div style={{ padding: '0 14px', color: '#C49A8A', display: 'flex', flexShrink: 0 }}>
                <Search size={15} />
              </div>
              <input
                className="tt-input"
                style={{ flex: 1, height: 40, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
                placeholder="Buscar serum, toner, moisturizer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} style={{ padding: '0 10px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
              <button type="submit" style={{
                height: 40, padding: '0 22px', background: '#1E1A1A', color: '#EEC5C5',
                border: 'none', cursor: 'pointer', fontWeight: 400, fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
                borderRadius: '0 50px 50px 0', flexShrink: 0
              }}>Buscar</button>
            </div>
          </form>

          {/* Search — mobile pill */}
          <form className="nb-search-mobile" onSubmit={handleSearch} style={{ alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FAF7F4', border: '1px solid #EDE8E4',
              borderRadius: 50, padding: '6px 14px', height: 36,
            }}>
              <Search size={13} color="#C49A8A" />
              <input
                className="tt-input"
                style={{ width: 110, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </form>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <Link href="/contact" className="nb-contact" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Phone size={18} color="#374151" strokeWidth={1.5} />
              <span style={{ fontSize: 9, color: '#6B7280', fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em' }}>Contacto</span>
            </Link>
            <Link href={customerName ? '/account' : '/login'} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <User size={18} color={customerName ? '#C49A8A' : '#374151'} strokeWidth={1.5} />
              <span style={{ fontSize: 9, color: customerName ? '#C49A8A' : '#6B7280', fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {customerName || 'Mi Perfil'}
              </span>
            </Link>
            <Link href="/cart" style={{ textDecoration: 'none', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={18} color="#374151" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -6, right: -6, width: 15, height: 15,
                    background: '#EEC5C5', color: '#1E1A1A', fontSize: 8, fontWeight: 700,
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Inter', sans-serif"
                  }}>{cartCount}</span>
                )}
              </div>
              <span className="nb-contact" style={{ fontSize: 9, color: '#6B7280', fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em' }}>Carrito</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ── Category bar ── */}
      <div className="nb-cat-bar" style={{ background: '#1E1A1A' }}>
        <div className="nb-cat-bar-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 40, overflowX: 'auto', gap: 0, scrollbarWidth: 'none' }}>
          <Link href="/" style={{
            padding: '0 14px', height: 40, display: 'flex', alignItems: 'center',
            fontWeight: isHome ? 600 : 400, fontSize: 11,
            color: isHome ? '#EEC5C5' : 'rgba(255,255,255,0.55)',
            textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
            borderBottom: isHome ? '2px solid #EEC5C5' : '2px solid transparent',
            transition: 'all 0.15s'
          }}>Inicio</Link>
          <Link href="/catalog" style={{
            padding: '0 14px', height: 40, display: 'flex', alignItems: 'center',
            fontWeight: isCatalog && !activeCategory ? 600 : 400, fontSize: 11,
            color: isCatalog && !activeCategory ? '#EEC5C5' : 'rgba(255,255,255,0.55)',
            textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
            borderBottom: isCatalog && !activeCategory ? '2px solid #EEC5C5' : '2px solid transparent',
            transition: 'all 0.15s'
          }}>Catálogo</Link>
          {categories.map(cat => (
            <Link key={cat} href={`/catalog?category=${encodeURIComponent(cat)}`} style={{
              padding: '0 14px', height: 40, display: 'flex', alignItems: 'center',
              fontWeight: activeCategory === cat ? 600 : 400, fontSize: 11,
              color: activeCategory === cat ? '#EEC5C5' : 'rgba(255,255,255,0.55)',
              textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
              borderBottom: activeCategory === cat ? '2px solid #EEC5C5' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>{cat}</Link>
          ))}
          <div style={{ flex: 1 }} />
          <Link href="/catalog?category=Descuentos" style={{
            padding: '0 14px', height: 40, display: 'flex', alignItems: 'center',
            fontSize: 11, fontWeight: 600, color: '#C49A8A',
            textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
          }}>Descuentos</Link>
        </div>
      </div>

    </header>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarInner />
    </Suspense>
  )
}
