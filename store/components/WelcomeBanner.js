'use client'
// Banner de bienvenida: 30% de descuento por crear cuenta.
// Se muestra una sola vez por navegador y nunca a clientes con sesión.
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { isLoggedIn } from '../lib/customer'

const SEEN_KEY = 'glowi_welcome_seen'

export default function WelcomeBanner() {
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY) && !isLoggedIn()) setShow(true)
    } catch {}
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    setShow(false)
  }

  const accept = () => {
    dismiss()
    router.push('/register')
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,26,26,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: '#FAF7F4', borderRadius: 20, maxWidth: 420, width: '100%',
        padding: '36px 28px', textAlign: 'center', border: '1.5px solid #EEC5C5',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#EEC5C5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
        }}>
          <Sparkles size={26} color="#1E1A1A" />
        </div>
        <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 34, color: '#1E1A1A', letterSpacing: '0.04em', lineHeight: 1 }}>
          30% DCTO
        </div>
        <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 14, color: '#C49A8A', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>
          por crear tu cuenta
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: '#6B7280', lineHeight: 1.7, fontWeight: 300, margin: '16px 0 24px' }}>
          Regístrate gratis y recibe un cupón de 30% de descuento para tu primera compra.
          Además tu carrito se guarda para cuando vuelvas.
        </p>
        <button onClick={accept} style={{
          width: '100%', background: '#1E1A1A', color: '#EEC5C5', border: 'none',
          borderRadius: 10, padding: '14px 0', fontFamily: "'Inter', sans-serif",
          fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          cursor: 'pointer', marginBottom: 10,
        }}>
          Sí, quiero el descuento
        </button>
        <button onClick={dismiss} style={{
          width: '100%', background: 'none', color: '#9CA3AF', border: '1px solid #EDE8E4',
          borderRadius: 10, padding: '12px 0', fontFamily: "'Inter', sans-serif",
          fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          No quiero el descuento
        </button>
      </div>
    </div>
  )
}
