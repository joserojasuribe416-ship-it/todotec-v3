'use client'
// Precarga silenciosa: tras la carga inicial (y cuando el navegador está
// ocioso), descarga las páginas principales y calienta los datos del
// catálogo. La primera visita paga unos KB extra; el resto de la
// navegación se siente instantánea.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const ROUTES = ['/catalog', '/cart', '/login', '/register', '/contact', '/checkout']

export default function Prefetcher() {
  const router = useRouter()

  useEffect(() => {
    const warm = () => {
      // 1. Precargar las rutas principales (código + payload de la página)
      ROUTES.forEach(r => { try { router.prefetch(r) } catch {} })
      // 2. Calentar los datos que usa el catálogo y la home
      fetch('/api/products?store_only=true').catch(() => {})
      fetch('/api/categories').catch(() => {})
    }
    // Esperar a que la página actual termine y el navegador esté libre
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(warm, { timeout: 4000 })
      return () => cancelIdleCallback(id)
    }
    const t = setTimeout(warm, 2500)
    return () => clearTimeout(t)
  }, [router])

  return null
}
