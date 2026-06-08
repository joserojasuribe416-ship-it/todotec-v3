'use client'
import { MessageCircle, Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react'

export default function ContactPage() {
  const whatsapp = '51904811639'

  return (
    <div>
      {/* Hero */}
      <section className="bg-secondary py-16 text-center text-white">
        <h1 className="text-4xl font-black mb-3">Contáctanos</h1>
        <p className="text-blue-200 max-w-md mx-auto">Estamos aquí para ayudarte. Cuéntanos lo que necesitas.</p>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-secondary">Canales de contacto</h2>
            {[
              { icon: MessageCircle, label: 'WhatsApp', value: '+51 904 811 639', href: `https://wa.me/${whatsapp}`, color: 'text-green-500' },
              { icon: Mail, label: 'Email', value: 'info@todotec.pe', href: 'mailto:info@todotec.pe', color: 'text-blue-500' },
              { icon: Instagram, label: 'Instagram', value: '@todotec', href: 'https://instagram.com', color: 'text-pink-500' },
              { icon: Facebook, label: 'Facebook', value: 'Glowi Skin', href: 'https://facebook.com', color: 'text-blue-600' },
            ].map(({ icon: Icon, label, value, href, color }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase">{label}</div>
                  <div className="font-bold text-secondary">{value}</div>
                </div>
              </a>
            ))}

            <div className="bg-primary rounded-2xl p-6">
              <h3 className="font-black text-secondary mb-2">¿Buscas precio al por mayor?</h3>
              <p className="text-secondary/70 text-sm mb-4">Somos distribuidores. Contáctanos para cotizaciones personalizadas.</p>
              <a
                href={`https://wa.me/${whatsapp}?text=Hola, me interesa precio mayorista`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                <MessageCircle size={15} /> Consultar mayoreo
              </a>
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-2xl font-black text-secondary mb-6">Envíanos un mensaje</h2>
            <form
              onSubmit={e => {
                e.preventDefault()
                const data = Object.fromEntries(new FormData(e.target))
                const msg = `Hola, me llamo ${data.name}.\n\n${data.message}\n\nEmail: ${data.email}\nTeléfono: ${data.phone}`
                window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
                <input name="name" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Tu nombre" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                  <input name="phone" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+51 999 999 999" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mensaje *</label>
                <textarea name="message" required rows={5} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="¿En qué podemos ayudarte?" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center text-base py-4">
                <MessageCircle size={18} /> Enviar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
