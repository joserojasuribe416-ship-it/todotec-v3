import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package, ShoppingCart, DollarSign,
  TrendingUp, Settings, Store, Menu, X, ChevronRight, Tag, Wallet, Bookmark, Palette, RefreshCw, ClipboardList,
  LogOut, Shield, UserCircle, Crown
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import api from '../api/client'

const NAV_BASE = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/proveedores',   icon: Users,           label: 'Proveedores' },
  { to: '/inventario',    icon: Package,         label: 'Inventario' },
  { to: '/compras',       icon: ShoppingCart,    label: 'Compras' },
  { to: '/ventas',        icon: DollarSign,      label: 'Ventas' },
  { to: '/cobranzas',     icon: Wallet,          label: 'Cobranzas' },
  { to: '/contabilidad',  icon: TrendingUp,      label: 'Contabilidad' },
  { to: '/categorias',    icon: Tag,             label: 'Categorías' },
  { to: '/marcas',        icon: Bookmark,        label: 'Marcas' },
  { to: '/apariencia',    icon: Palette,         label: 'Apariencia' },
  { to: '/pedidos',       icon: ClipboardList,   label: 'Pedidos' },
  { to: '/configuracion', icon: Settings,        label: 'Configuración' },
]
const NAV_MASTER = { to: '/usuarios', icon: Shield, label: 'Usuarios' }

export default function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const { companyName, logoUrl } = useTheme()
  const { user, logout } = useAuth()

  const NAV = ['master', 'owner'].includes(user?.role) ? [...NAV_BASE, NAV_MASTER] : NAV_BASE

  const publishStore = async () => {
    setPublishing(true)
    try {
      await api.post('/revalidate-store')
      toast.success('¡Tienda actualizada!')
    } catch {
      toast.error('Error al actualizar la tienda')
    } finally {
      setPublishing(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F8FA', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, background: '#0A0A0A', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: open ? 'fixed' : 'relative',
        inset: open ? '0 auto 0 0' : 'auto',
        zIndex: open ? 40 : 'auto',
        transition: 'transform 0.2s',
      }} className={`${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ lineHeight: 1, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 18, color: '#fff', letterSpacing: '8px', textTransform: 'uppercase', textIndent: '8px' }}>GLOWI</div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 7, color: '#EEC5C5', letterSpacing: '4px', textTransform: 'uppercase', textIndent: '4px', marginTop: 1 }}>SKIN</div>
          </div>
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
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: active ? '#ffffff' : '#9CA3AF',
                  borderLeft: active ? '2px solid #EEC5C5' : '2px solid transparent',
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

        {/* User info + logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Store link */}
          <a
            href="https://glowi-skin.vercel.app"
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

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

          {/* Current user row */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 2 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: ['master', 'owner'].includes(user.role) ? '#1E1A1A' : '#1F2937', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {user.role === 'owner' ? <Crown size={13} color="#EFC368" />
                  : user.role === 'master' ? <Shield size={13} color="#EEC5C5" />
                  : <UserCircle size={13} color="#9CA3AF" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || user.username}</div>
                <div style={{ fontSize: 10, color: user.role === 'owner' ? '#EFC368' : user.role === 'master' ? '#EEC5C5' : '#6B7280', marginTop: 1 }}>
                  {user.role === 'owner' ? 'Owner' : user.role === 'master' ? 'Master' : 'Standard'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'none' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
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
          {/* Publish button */}
          <button
            onClick={publishStore}
            disabled={publishing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: publishing ? '#F3F4F6' : '#1E1A1A',
              color: publishing ? '#9CA3AF' : '#EEC5C5',
              border: 'none', borderRadius: 7, padding: '6px 14px',
              fontSize: 12, fontWeight: 600, cursor: publishing ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em', transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={13} className={publishing ? 'spin' : ''} />
            {publishing ? 'Actualizando...' : 'Actualizar Tienda'}
          </button>

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
