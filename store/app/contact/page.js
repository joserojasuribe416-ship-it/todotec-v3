'use client'
import { MessageCircle, Mail, Instagram, Facebook } from 'lucide-react'

export default function ContactPage() {
  const whatsapp = '51904811639'

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1E1A1A', padding: '48px 24px 44px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#C49A8A', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10 }}>Estamos aquí</p>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF7F4', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
            Contacto
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", color: '#6B7280', fontSize: 13, marginTop: 12, fontWeight: 300, maxWidth: 400 }}>
            Cuéntanos qué necesitas para tu rutina y te ayudamos a encontrar los productos ideales.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>

          {/* Channels */}
          <div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 14, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>Canales de contacto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: MessageCircle, label: 'WhatsApp', value: '+51 904 811 639', href: `https://wa.me/${whatsapp}`, color: '#B5C4B1' },
                { icon: Mail, label: 'Email', value: 'hola@glowiskin.pe', href: 'mailto:hola@glowiskin.pe', color: '#EEC5C5' },
                { icon: Instagram, label: 'Instagram', value: '@glowiskin', href: 'https://instagram.com', color: '#C49A8A' },
                { icon: Facebook, label: 'Facebook', value: 'Glowi Skin', href: 'https://facebook.com', color: '#EEC5C5' },
              ].map(({ icon: Icon, label, value, href, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 18px', background: '#fff',
                  borderRadius: 12, border: '1px solid #EDE8E4',
                  textDecoration: 'none', transition: 'border-color 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#EEC5C5'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#EDE8E4'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FAF7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 400, color: '#1E1A1A' }}>{value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Mayoristas box */}
            <div style={{ marginTop: 24, background: '#EEC5C5', borderRadius: 14, padding: '24px 22px' }}>
              <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 14, color: '#1E1A1A', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                ¿Tienes un spa o clínica?
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#3A3434', fontWeight: 300, lineHeight: 1.7, marginBottom: 16 }}>
                Distribuimos a profesionales del skincare y centros de estética. Consúltanos por precios mayoristas.
              </p>
              <a href={`https://wa.me/${whatsapp}?text=Hola, me interesa precio mayorista para mi negocio`}
                target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#1E1A1A', color: '#EEC5C5',
                  padding: '10px 20px', borderRadius: 8, textDecoration: 'none',
                  fontFamily: "'Inter', sans-serif", fontSize: 11,
                  letterSpacing: '0.08em', textTransform: 'uppercase'
                }}>
                <MessageCircle size={13} /> Consultar mayoreo
              </a>
            </div>
          </div>

          {/* Form */}
          <div>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 14, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>Envíanos un mensaje</div>
            <form onSubmit={e => {
              e.preventDefault()
              const data = Object.fromEntries(new FormData(e.target))
              const msg = `Hola, me llamo ${data.name}.\n\n${data.message}\n\nEmail: ${data.email}\nTeléfono: ${data.phone}`
              window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
            }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Nombre', name: 'name', required: true, placeholder: 'Tu nombre', type: 'text' },
                { label: 'Email', name: 'email', required: false, placeholder: 'tu@email.com', type: 'email' },
                { label: 'Teléfono', name: 'phone', required: false, placeholder: '+51 999 999 999', type: 'text' },
              ].map(field => (
                <div key={field.name}>
                  <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {field.label}{field.required && ' *'}
                  </label>
                  <input name={field.name} required={field.required} type={field.type} placeholder={field.placeholder} style={{
                    width: '100%', border: '1px solid #EDE8E4', borderRadius: 8,
                    padding: '12px 14px', fontSize: 13, fontFamily: "'Inter', sans-serif",
                    background: '#fff', color: '#1E1A1A', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                    onFocus={e => e.target.style.borderColor = '#C49A8A'}
                    onBlur={e => e.target.style.borderColor = '#EDE8E4'}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Mensaje *
                </label>
                <textarea name="message" required rows={5} placeholder="¿Qué productos buscas? ¿Tienes alguna consulta sobre tu rutina?" style={{
                  width: '100%', border: '1px solid #EDE8E4', borderRadius: 8,
                  padding: '12px 14px', fontSize: 13, fontFamily: "'Inter', sans-serif",
                  background: '#fff', color: '#1E1A1A', outline: 'none',
                  resize: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                }}
                  onFocus={e => e.target.style.borderColor = '#C49A8A'}
                  onBlur={e => e.target.style.borderColor = '#EDE8E4'}
                />
              </div>
              <button type="submit" style={{
                width: '100%', background: '#1E1A1A', color: '#EEC5C5',
                border: 'none', borderRadius: 10, padding: '14px 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400,
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                transition: 'background 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#3A3434'}
                onMouseLeave={e => e.currentTarget.style.background = '#1E1A1A'}
              >
                <MessageCircle size={14} /> Enviar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
