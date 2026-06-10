'use client'
// Carrito unificado: vive en localStorage (sobrevive cerrar el navegador)
// y se sincroniza al servidor cuando el cliente tiene sesión iniciada.
import { isLoggedIn, apiSaveServerCart, apiGetServerCart } from './customer'

const CART_KEY = 'cart'

export const loadCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]') } catch { return [] }
}

export const storeCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
  if (isLoggedIn()) apiSaveServerCart(cart).catch(() => {})
}

export const clearCart = () => storeCart([])

/** Al iniciar sesión: une el carrito local con el guardado en la cuenta. */
export const mergeServerCart = async () => {
  try {
    const { cart: serverCart } = await apiGetServerCart()
    const local = loadCart()
    const merged = [...local]
    for (const item of serverCart || []) {
      const idx = merged.findIndex(i => i.key === item.key)
      if (idx === -1) merged.push(item)
    }
    storeCart(merged)
  } catch {}
}
