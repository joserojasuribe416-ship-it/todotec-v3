'use client'
import Link from 'next/link'
import { Instagram, Facebook, MessageCircle } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ background: '#0A0A0A', color: '#fff', marginTop: 0 }}>
      {/* Main footer */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, background: '#1E3A8A', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #FFD100'
              }}>
                <span style={{ color: '#FFD100', fontWeight: 900, fontSize: 15, letterSpacing: '-1px' }}>TT</span>
              </div>
              <span style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-0.5px' }}>TodoTec</span>
            </div>
            <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>
              Importamos directamente los mejores productos tecnológicos. Calidad garantizada, precios justos.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Facebook, label: 'Facebook' },
                { icon: MessageCircle, label: 'WhatsApp' },
              ].map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="social-icon"
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9CA3AF', textDecoration: 'none'
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 style={{ fontWeight: 800, fontSize: 13, color: '#FFD100', letterSpacing: '1px', marginBottom: 16 }}>TIENDA</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Catálogo', 'Monitores', 'Gadgets', 'Accesorios', 'Gaming'].map(l => (
                <Link key={l} href={l === 'Catálogo' ? '/catalog' : `/catalog?category=${l}`}
                  style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#6B7280'}
                >{l}</Link>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 style={{ fontWeight: 800, fontSize: 13, color: '#FFD100', letterSpacing: '1px', marginBottom: 16 }}>EMPRESA</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Contacto', href: '/contact' },
                { label: 'Mayoristas', href: '/contact' },
                { label: 'Mi carrito', href: '/cart' },
              ].map(({ label, href }) => (
                <Link key={label} href={href}
                  style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#6B7280'}
                >{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ color: '#4B5563', fontSize: 12 }}>© {new Date().getFullYear()} TodoTec. Todos los derechos reservados.</p>
          <p style={{ color: '#4B5563', fontSize: 12 }}>Hecho con ❤️ en Perú</p>
        </div>
      </div>
    </footer>
  )
}
