'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const VISIBLE = 3

export default function BannerCarousel() {
  const [banners, setBanners] = useState([])
  const [offset, setOffset] = useState(0)
  const intervalRef = useRef(null)
  const touchStartX = useRef(null)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${base}/api/appearance/banners`)
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const total = banners.length
  const maxOffset = Math.max(0, total - VISIBLE)

  const next = () => setOffset(o => Math.min(o + 1, maxOffset))
  const prev = () => setOffset(o => Math.max(o - 1, 0))

  const resetInterval = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setOffset(o => o >= maxOffset ? 0 : o + 1)
    }, 4500)
  }

  useEffect(() => {
    if (total === 0) return
    intervalRef.current = setInterval(() => {
      setOffset(o => o >= maxOffset ? 0 : o + 1)
    }, 4500)
    return () => clearInterval(intervalRef.current)
  }, [total, maxOffset])

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetInterval() }
    touchStartX.current = null
  }

  if (banners.length === 0) return null

  return (
    <div style={{ position: 'relative' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* Track */}
      <div style={{ overflow: 'hidden', borderRadius: 16 }}>
        <div style={{
          display: 'flex',
          gap: 12,
          transform: `translateX(calc(-${offset} * (100% / ${VISIBLE} + 4px)))`,
          transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {banners.map((b, i) => (
            <div key={b.id ?? i} style={{
              flexShrink: 0,
              width: `calc(${100 / VISIBLE}% - ${12 * (VISIBLE - 1) / VISIBLE}px)`,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}>
              {/* Image zone */}
              <div style={{
                background: b.bg,
                height: 200,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}>
                {b.image_url ? (
                  <img
                    src={b.image_url}
                    alt={b.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: `${b.accent}12` }} />
                    <div style={{ position: 'absolute', left: -20, bottom: -30, width: 130, height: 130, borderRadius: '50%', background: `${b.accent}09` }} />
                    {/* Bottle placeholders */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: 10, paddingBottom: 0 }}>
                      <div style={{ width: 36, height: 110, borderRadius: '18px 18px 8px 8px', background: `${b.accent}20`, border: `1px solid ${b.accent}25` }} />
                      <div style={{ width: 46, height: 140, borderRadius: '16px 16px 10px 10px', background: `${b.accent}18`, border: `1px solid ${b.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${b.accent}35` }} />
                      </div>
                      <div style={{ width: 30, height: 90, borderRadius: '15px 15px 7px 7px', background: `${b.accent}15`, border: `1px solid ${b.accent}20` }} />
                    </div>
                  </>
                )}
              </div>

              {/* Text zone */}
              <div style={{ background: b.text_bg, padding: '16px 18px 18px' }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: b.tag_color, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5, fontFamily: "'Inter', sans-serif" }}>
                  {b.tag}
                </div>
                <div style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontSize: 18, fontWeight: 100, color: b.text_color,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  lineHeight: 1.15, whiteSpace: 'pre-line', marginBottom: 8,
                }}>
                  {b.title}
                </div>
                <div style={{ fontSize: 11, color: b.text_color, opacity: 0.55, marginBottom: 14, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
                  {b.subtitle}
                </div>
                <Link href={b.href || '/catalog'} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: b.cta_bg, color: b.cta_color,
                  fontSize: 9, fontWeight: 600, padding: '8px 16px',
                  borderRadius: 5, textDecoration: 'none',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {b.cta} <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow prev */}
      {offset > 0 && (
        <button onClick={() => { prev(); resetInterval() }} style={{
          position: 'absolute', left: -14, top: 100, transform: 'translateY(-50%)',
          width: 32, height: 32, borderRadius: '50%',
          background: '#fff', border: '1px solid #EDE8E4', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 4,
        }}>
          <ChevronLeft size={16} color="#1E1A1A" />
        </button>
      )}

      {/* Arrow next */}
      {offset < maxOffset && (
        <button onClick={() => { next(); resetInterval() }} style={{
          position: 'absolute', right: -14, top: 100, transform: 'translateY(-50%)',
          width: 32, height: 32, borderRadius: '50%',
          background: '#fff', border: '1px solid #EDE8E4', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 4,
        }}>
          <ChevronRight size={16} color="#1E1A1A" />
        </button>
      )}

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14 }}>
        {Array.from({ length: maxOffset + 1 }).map((_, i) => (
          <button key={i} onClick={() => { setOffset(i); resetInterval() }} style={{
            width: i === offset ? 18 : 6, height: 6, borderRadius: 3, padding: 0,
            background: i === offset ? '#1E1A1A' : '#EDE8E4',
            border: 'none', cursor: 'pointer',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  )
}
