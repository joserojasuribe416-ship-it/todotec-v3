'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const BANNERS = [
  {
    tag: 'Korean Skincare',
    title: 'Tu rutina coreana',
    subtitle: 'Importado directamente desde Corea del Sur.',
    cta: 'Ver catálogo',
    href: '/catalog',
    imageBg: '#1E1A1A',
    imageAccent: '#EEC5C5',
    textBg: '#1E1A1A',
    textColor: '#FAF7F4',
    tagColor: '#EEC5C5',
    ctaBg: '#EEC5C5',
    ctaColor: '#1E1A1A',
  },
  {
    tag: 'Ofertas especiales',
    title: 'Hasta 30% de descuento',
    subtitle: 'Descuentos en serums, toners y más productos seleccionados.',
    cta: 'Ver ofertas',
    href: '/catalog',
    imageBg: 'linear-gradient(135deg, #EEC5C5 0%, #C49A8A 100%)',
    imageAccent: '#fff',
    textBg: '#fff',
    textColor: '#1E1A1A',
    tagColor: '#C49A8A',
    ctaBg: '#1E1A1A',
    ctaColor: '#EEC5C5',
  },
  {
    tag: 'Protección solar',
    title: 'SPF Coreano esencial',
    subtitle: 'Protege tu piel todos los días con las mejores fórmulas coreanas.',
    cta: 'Ver SPF',
    href: '/catalog',
    imageBg: 'linear-gradient(135deg, #B5C4B1 0%, #8aa385 100%)',
    imageAccent: '#fff',
    textBg: '#F4F7F4',
    textColor: '#1E1A1A',
    tagColor: '#8aa385',
    ctaBg: '#1E1A1A',
    ctaColor: '#fff',
  },
  {
    tag: 'Recién llegados',
    title: 'Nuevos productos',
    subtitle: 'Las últimas novedades en skincare coreano acaban de llegar.',
    cta: 'Descubrir',
    href: '/catalog',
    imageBg: 'linear-gradient(135deg, #C49A8A 0%, #a07060 100%)',
    imageAccent: '#FAF7F4',
    textBg: '#FAF7F4',
    textColor: '#1E1A1A',
    tagColor: '#C49A8A',
    ctaBg: '#1E1A1A',
    ctaColor: '#FAF7F4',
  },
  {
    tag: 'Serums & Esencias',
    title: 'Hidratación profunda',
    subtitle: 'Activos coreanos de alta concentración para una piel radiante.',
    cta: 'Ver serums',
    href: '/catalog',
    imageBg: 'linear-gradient(135deg, #EDE8E4 0%, #EEC5C5 100%)',
    imageAccent: '#C49A8A',
    textBg: '#fff',
    textColor: '#1E1A1A',
    tagColor: '#C49A8A',
    ctaBg: '#1E1A1A',
    ctaColor: '#EEC5C5',
  },
  {
    tag: 'Cuidado nocturno',
    title: 'Repara mientras duermes',
    subtitle: 'Rutina de noche para despertar con una piel transformada.',
    cta: 'Ver noche',
    href: '/catalog',
    imageBg: 'linear-gradient(135deg, #2D2040 0%, #1E1A1A 100%)',
    imageAccent: '#EEC5C5',
    textBg: '#2D2040',
    textColor: '#FAF7F4',
    tagColor: '#EEC5C5',
    ctaBg: '#EEC5C5',
    ctaColor: '#1E1A1A',
  },
]

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const intervalRef = useRef(null)
  const touchStartX = useRef(null)

  const goTo = (index) => {
    setFading(true)
    setTimeout(() => {
      setCurrent((index + BANNERS.length) % BANNERS.length)
      setFading(false)
    }, 220)
  }

  const next = () => goTo(current + 1)
  const prev = () => goTo(current - 1)

  const resetInterval = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => setCurrent(c => (c + 1) % BANNERS.length), 5000)
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => setCurrent(c => (c + 1) % BANNERS.length), 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetInterval() }
    touchStartX.current = null
  }

  const b = BANNERS[current]

  return (
    <div
      style={{ borderRadius: 20, overflow: 'hidden', userSelect: 'none', position: 'relative', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Image area ── */}
      <div style={{
        background: b.imageBg,
        height: 320,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.4s ease',
        opacity: fading ? 0 : 1,
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', right: -80, top: -80, width: 360, height: 360, borderRadius: '50%', background: `${b.imageAccent}10` }} />
        <div style={{ position: 'absolute', left: -40, bottom: -60, width: 240, height: 240, borderRadius: '50%', background: `${b.imageAccent}08` }} />
        <div style={{ position: 'absolute', right: 120, bottom: -30, width: 160, height: 160, borderRadius: '50%', background: `${b.imageAccent}06` }} />

        {/* Placeholder product visual */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 32, height: '100%', paddingBottom: 0 }}>
          {/* Tall bottle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingBottom: 0 }}>
            <div style={{
              width: 64, height: 190, borderRadius: '32px 32px 12px 12px',
              background: `${b.imageAccent}22`, border: `1.5px solid ${b.imageAccent}30`,
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16
            }}>
              <div style={{ width: 28, height: 6, borderRadius: 3, background: `${b.imageAccent}60` }} />
            </div>
          </div>
          {/* Medium bottle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingBottom: 0 }}>
            <div style={{
              width: 80, height: 220, borderRadius: '20px 20px 16px 16px',
              background: `${b.imageAccent}18`, border: `1.5px solid ${b.imageAccent}28`,
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${b.imageAccent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${b.imageAccent}70` }} />
              </div>
            </div>
          </div>
          {/* Small bottle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingBottom: 0 }}>
            <div style={{
              width: 52, height: 150, borderRadius: '26px 26px 10px 10px',
              background: `${b.imageAccent}15`, border: `1.5px solid ${b.imageAccent}25`,
              backdropFilter: 'blur(4px)',
            }} />
          </div>
        </div>

        {/* Slide counter */}
        <div style={{
          position: 'absolute', top: 16, right: 20,
          fontSize: 10, fontWeight: 500, color: `${b.imageAccent}90`,
          fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em', zIndex: 3,
        }}>
          {String(current + 1).padStart(2, '0')} / {String(BANNERS.length).padStart(2, '0')}
        </div>
      </div>

      {/* ── Text area ── */}
      <div style={{
        background: b.textBg,
        padding: '24px 32px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        transition: 'background 0.4s ease',
        opacity: fading ? 0 : 1,
      }}>
        <div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: b.tagColor,
            letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6,
            fontFamily: "'Inter', sans-serif",
          }}>
            {b.tag}
          </div>
          <div style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: 28, fontWeight: 100, color: b.textColor,
            letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1,
          }}>
            {b.title}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 300, color: b.textColor, opacity: 0.65,
            marginTop: 6, fontFamily: "'Inter', sans-serif", maxWidth: 500,
          }}>
            {b.subtitle}
          </div>
        </div>
        <Link href={b.href} style={{
          flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: b.ctaBg, color: b.ctaColor,
          fontWeight: 500, fontSize: 10, padding: '12px 24px',
          borderRadius: 7, textDecoration: 'none',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
        }}>
          {b.cta} <ArrowRight size={13} />
        </Link>
      </div>

      {/* Arrow prev */}
      <button
        onClick={() => { prev(); resetInterval() }}
        style={{
          position: 'absolute', left: 14, top: 160, transform: 'translateY(-50%)',
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,255,255,0.88)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 4,
        }}
      >
        <ChevronLeft size={17} color="#1E1A1A" />
      </button>

      {/* Arrow next */}
      <button
        onClick={() => { next(); resetInterval() }}
        style={{
          position: 'absolute', right: 14, top: 160, transform: 'translateY(-50%)',
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,255,255,0.88)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 4,
        }}
      >
        <ChevronRight size={17} color="#1E1A1A" />
      </button>

      {/* Dots */}
      <div style={{
        position: 'absolute', bottom: 94, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 5, zIndex: 4,
      }}>
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetInterval() }}
            style={{
              width: i === current ? 20 : 6, height: 6, borderRadius: 3,
              background: i === current ? `${b.imageAccent}ee` : `${b.imageAccent}44`,
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
