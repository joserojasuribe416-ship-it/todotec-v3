'use client'
import Link from 'next/link'
import { Instagram, Facebook, MessageCircle } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ background: '#1E1A1A', color: '#fff', marginTop: 0 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 44px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100,
                fontSize: 28, color: '#EEC5C5', letterSpacing: '10px',
                textTransform: 'uppercase', lineHeight: 1, textIndent: '10px'
              }}>GLOWI</div>
              <div style={{
                fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300,
                fontSize: 10, color: '#C49A8A', letterSpacing: '6px',
                textTransform: 'uppercase', textIndent: '6px'
              }}>SKIN</div>
            </div>
            <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.8, maxWidth: 260, marginBottom: 24, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
              Korean skincare importado directamente desde Corea del Sur. Rutinas reales, resultados visibles.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Facebook, label: 'Facebook' },
                { icon: MessageCircle, label: 'WhatsApp' },
              ].map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label} className="social-icon" style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(238,197,197,0.08)',
                  border: '1px solid rgba(238,197,197,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6B7280', textDecoration: 'none'
                }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Productos */}
          <div>
            <h4 style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 10,
              color: '#EEC5C5', letterSpacing: '3px', marginBottom: 20, textTransform: 'uppercase'
            }}>Productos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Catálogo', 'Serum', 'Toner', 'Moisturizer', 'Protector Solar'].map(l => (
                <Link key={l} href={l === 'Catálogo' ? '/catalog' : `/catalog?category=${l}`}
                  style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 300, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#EEC5C5'}
                  onMouseLeave={e => e.target.style.color = '#6B7280'}
                >{l}</Link>
              ))}
            </div>
          </div>

          {/* Empresa */}
          <div>
            <h4 style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 10,
              color: '#EEC5C5', letterSpacing: '3px', marginBottom: 20, textTransform: 'uppercase'
            }}>Empresa</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Contacto', href: '/contact' },
                { label: 'Mayoristas', href: '/contact' },
                { label: 'Mi carrito', href: '/cart' },
              ].map(({ label, href }) => (
                <Link key={label} href={href}
                  style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontWeight: 300, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#EEC5C5'}
                  onMouseLeave={e => e.target.style.color = '#6B7280'}
                >{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(238,197,197,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ color: '#4B5563', fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '0.03em' }}>© {new Date().getFullYear()} Glowi Skin. Todos los derechos reservados.</p>
          <p style={{ color: '#4B5563', fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>Hecho con ♡ en Lima, Perú</p>
        </div>
      </div>
    </footer>
  )
}
