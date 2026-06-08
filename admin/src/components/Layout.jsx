import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package, ShoppingCart, DollarSign,
  TrendingUp, Settings, Store, Menu, X, ChevronRight, Tag, Wallet, Bookmark
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/proveedores',   icon: Users,           label: 'Proveedores' },
  { to: '/inventario',    icon: Package,         label: 'Inventario' },
  { to: '/compras',       icon: ShoppingCart,    label: 'Compras' },
  { to: '/ventas',        icon: DollarSign,      label: 'Ventas' },
  { to: '/cobranzas',     icon: Wallet,          label: 'Cobranzas' },
  { to: '/contabilidad',  icon: TrendingUp,      label: 'Contabilidad' },
  { to: '/categorias',    icon: Tag,             label: 'Categorías' },
  { to: '/marcas',        icon: Bookmark,        label: 'Marcas' },
  { to: '/configuracion', icon: Settings,        label: 'Configuración' },
]

export default function Layout() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const { companyName, logoUrl } = useTheme()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F8FA', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, background: '#0A0A0A', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: open ? 'fixed' : 'relative',
        inset: open ? '0 auto 0 0' : 'auto',
        zIndex: open ? 40 : 'auto',
        transform: `translateX(${open ? '0' : '0'})`,
        transition: 'transform 0.2s',
      }} className={`${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8, flexShrink: 0, background: '#fff' }} />
          ) : (
            <div style={{ lineHeight: 1, flexShrink: 0 }}>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 18, color: '#fff', letterSpacing: '8px', textTransform: 'uppercase', textIndent: '8px' }}>GLOWI</div>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 7, color: '#EEC5C5', letterSpacing: '4px', textTransform: 'uppercase', textIndent: '4px', marginTop: 1 }}>SKIN</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 600, letterSpacing: '0.5px' }}>ADMIN PANEL</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }} className="lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? 'var(--brand-primary, #1E1A1A)' : 'transparent',
                  color: active ? 'var(--brand-secondary, #EEC5C5)' : '#9CA3AF',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' } }}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
              </Link>
            )
          })}
        </nav>

        {/* Store link */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a
            href="https://todotec-v3-jtnk.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
              fontSize: 13, fontWeight: 600, color: '#6B7280', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(238,197,197,0.15)'; e.currentTarget.style.color = '#EEC5C5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' }}
          >
            <Store size={16} />
            Ver tienda online
          </a>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
          className="lg:hidden"
        />
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 56, background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0
        }}>
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }} className="lg:hidden">
            <Menu size={20} />
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {/* Status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DCFCE7', padding: '4px 10px', borderRadius: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Sistema activo</span>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
