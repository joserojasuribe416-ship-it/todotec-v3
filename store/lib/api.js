const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function fetchProducts(params = {}) {
  const qs = new URLSearchParams({ store_only: 'true', ...params }).toString()
  const res = await fetch(`${API_BASE}/api/products?${qs}`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export async function fetchProduct(id) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/api/categories`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return data.map(c => c.name)
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/api/config`, { cache: 'no-store' })
  if (!res.ok) return { company_name: 'TodoTec', whatsapp: '', email: '' }
  return res.json()
}

export function getImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}
