'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Trash2, ArrowLeft, MessageCircle, Plus, Minus } from 'lucide-react'
import { getImageUrl } from '../../lib/api'

export default function CartPage() {
  const [cart, setCart] = useState([])

  useEffect(() => {
    try {
      setCart(JSON.parse(sessionStorage.getItem('cart') || '[]'))
    } catch { setCart([]) }
  }, [])

  const updateCart = (newCart) => {
    setCart(newCart)
    sessionStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const updateQty = (key, delta) => {
    const newCart = cart.map(i => i.key === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    updateCart(newCart)
  }

  const remove = (key) => updateCart(cart.filter(i => i.key !== key))
  const clear = () => updateCart([])

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const whatsappMsg = () => {
    if (cart.length === 0) return
    const lines = cart.map(i => `• ${i.name}${i.variant_color ? ` (${i.variant_color})` : ''} x${i.quantity} = ${fmt(i.price * i.quantity)}`)
    const msg = `Hola, quisiera hacer un pedido:\n\n${lines.join('\n')}\n\nTotal: ${fmt(total)}`
    window.open(`https://wa.me/51904811639?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart size={28} className="text-secondary" />
        <h1 className="text-2xl font-black text-secondary">Mi Carrito</h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart size={64} className="mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-bold text-gray-500 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-400 mb-6">Explora nuestro catálogo y agrega productos</p>
          <Link href="/catalog" className="btn-secondary">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.key} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <ShoppingCart size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{item.name}</div>
                  {item.variant_color && <div className="text-xs text-gray-400">{item.variant_color}</div>}
                  <div className="text-secondary font-bold mt-1">{fmt(item.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.key, -1)} className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.key, 1)} className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-right w-24">
                  <div className="font-bold text-secondary">{fmt(item.price * item.quantity)}</div>
                  <button onClick={() => remove(item.key)} className="text-red-400 hover:text-red-600 mt-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={clear} className="text-sm text-red-400 hover:text-red-600 flex items-center gap-1">
              <Trash2 size={14} /> Vaciar carrito
            </button>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-black text-lg text-secondary mb-4">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">IGV (18%)</span><span>{fmt(igv)}</span></div>
                <div className="flex justify-between font-black text-lg text-secondary border-t pt-3 mt-2">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <button
                  onClick={whatsappMsg}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={18} /> Pedir por WhatsApp
                </button>
                <Link href="/catalog" className="w-full flex items-center justify-center gap-2 text-secondary font-semibold text-sm hover:underline">
                  <ArrowLeft size={15} /> Seguir comprando
                </Link>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Al hacer clic en "Pedir por WhatsApp" enviaremos tu pedido directamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
