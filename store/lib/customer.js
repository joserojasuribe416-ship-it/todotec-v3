'use client'
// Sesión del cliente de la tienda (separada del admin).
// Token y datos viven en localStorage; el carrito se sincroniza al servidor si hay sesión.

const TOKEN_KEY = 'glowi_token'
const CUSTOMER_KEY = 'glowi_customer'
const COUPON_KEY = 'glowi_coupon'

const isBrowser = () => typeof window !== 'undefined'

// ── Sesión ────────────────────────────────────────────────────────────
export const getToken = () => (isBrowser() ? localStorage.getItem(TOKEN_KEY) : null)
export const isLoggedIn = () => !!getToken()

export const getCustomer = () => {
  if (!isBrowser()) return null
  try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null') } catch { return null }
}

export const saveSession = (token, customer) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer))
  window.dispatchEvent(new Event('customerUpdated'))
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_KEY)
  localStorage.removeItem(COUPON_KEY)
  window.dispatchEvent(new Event('customerUpdated'))
}

const authHeaders = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// ── API ───────────────────────────────────────────────────────────────
const jfetch = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || 'Error de conexión')
  return data
}

export const apiRegister = (payload) => jfetch('/api/customers/register', { method: 'POST', body: JSON.stringify(payload) })
export const apiLogin = (email, password) => jfetch('/api/customers/login', { method: 'POST', body: JSON.stringify({ email, password }) })
export const apiMe = () => jfetch('/api/customers/me')
export const apiUpdateMe = (payload) => jfetch('/api/customers/me', { method: 'PUT', body: JSON.stringify(payload) })
export const apiChangePassword = (current_password, new_password) => jfetch('/api/customers/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) })
export const apiMyCoupons = () => jfetch('/api/customers/me/coupons')
export const apiCheckCoupon = (code, subtotal) => jfetch('/api/customers/check-coupon', { method: 'POST', body: JSON.stringify({ code, subtotal }) })
export const apiGetServerCart = () => jfetch('/api/customers/me/cart')
export const apiSaveServerCart = (cart) => jfetch('/api/customers/me/cart', { method: 'PUT', body: JSON.stringify({ cart }) })

// ── Cupón aplicado en el carrito ──────────────────────────────────────
export const getAppliedCoupon = () => {
  if (!isBrowser()) return null
  try { return JSON.parse(localStorage.getItem(COUPON_KEY) || 'null') } catch { return null }
}
export const saveAppliedCoupon = (coupon) => {
  localStorage.setItem(COUPON_KEY, JSON.stringify(coupon))
  window.dispatchEvent(new Event('cartUpdated'))
}
export const clearAppliedCoupon = () => {
  localStorage.removeItem(COUPON_KEY)
  if (isBrowser()) window.dispatchEvent(new Event('cartUpdated'))
}
