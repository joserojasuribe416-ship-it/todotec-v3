import { useEffect, useState } from 'react'
import { getPurchases, createPurchase, deletePurchase, getSuppliers, getProducts } from '../api/client'
import { Plus, Trash2, X, ChevronDown, ChevronUp, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_ITEM = { product_id: null, product_name: '', category: '', description: '', sale_price: 0, quantity: 1, unit_cost: 0, variants: [] }

function PurchaseForm({ suppliers, products, categoryList, onSave, onClose }) {
  const [form, setForm] = useState({
    supplier_id: '',
    shipping_cost: 0,
    taxes: 0,
    notes: '',
    is_credit: false,
    items: [{ ...EMPTY_ITEM }]
  })

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const setItem = (i, key, val) => setForm(f => {
    const items = [...f.items]
    items[i] = { ...items[i], [key]: val }
    return { ...f, items }
  })

  const addVariant = (i) => {
    const items = [...form.items]
    items[i] = { ...items[i], variants: [...items[i].variants, { color: '', qty: 0 }] }
    setForm(f => ({ ...f, items }))
  }

  const setVariant = (i, vi, key, val) => {
    const items = [...form.items]
    const variants = [...items[i].variants]
    variants[vi] = { ...variants[vi], [key]: val }
    items[i] = { ...items[i], variants }
    setForm(f => ({ ...f, items }))
  }

  const removeVariant = (i, vi) => {
    const items = [...form.items]
    items[i] = { ...items[i], variants: items[i].variants.filter((_, idx) => idx !== vi) }
    setForm(f => ({ ...f, items }))
  }

  const totalProducts = form.items.reduce((s, it) => s + (it.unit_cost * it.quantity), 0)
  const totalCost = totalProducts + parseFloat(form.shipping_cost || 0) + parseFloat(form.taxes || 0)

  const save = async () => {
    if (form.items.some(i => !i.product_name && !i.product_id)) {
      toast.error('Completa el nombre del producto en todos los ítems')
      return
    }
    try {
      const payload = {
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        shipping_cost: parseFloat(form.shipping_cost || 0),
        taxes: parseFloat(form.taxes || 0),
        notes: form.notes,
        is_credit: form.is_credit,
        items: form.items.map(it => ({
          product_id: it.product_id ? parseInt(it.product_id) : null,
          product_name: it.product_name,
          category: it.category,
          description: it.description,
          sale_price: parseFloat(it.sale_price || 0),
          quantity: parseInt(it.quantity),
          unit_cost: parseFloat(it.unit_cost),
          variants: it.variants.map(v => ({ color: v.color, qty: parseInt(v.qty || 0) })).filter(v => v.color && v.qty > 0),
        }))
      }
      await createPurchase(payload)
      toast.success('Compra registrada')
      onSave()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg">Nueva Compra</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Proveedor</label>
              <select className="input" value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">Sin proveedor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notas</label>
              <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas opcionales..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Costo de envío (S/)</label>
              <input className="input" type="number" step="0.01" value={form.shipping_cost} onChange={e => setForm(f => ({ ...f, shipping_cost: e.target.value }))} />
            </div>
            <div>
              <label className="label">Impuestos (S/)</label>
              <input className="input" type="number" step="0.01" value={form.taxes} onChange={e => setForm(f => ({ ...f, taxes: e.target.value }))} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_credit} onChange={e => setForm(f => ({ ...f, is_credit: e.target.checked }))} className="w-4 h-4 accent-[#FFD100]" />
                <span className="text-sm text-gray-700">Compra a crédito</span>
              </label>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Productos</h4>
              <button className="btn-primary text-xs py-1.5" onClick={addItem}><Plus size={14} className="inline mr-1" />Agregar producto</button>
            </div>
            <div className="space-y-4">
              {form.items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Producto {i + 1}</span>
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nombre del producto *</label>
                      <input className="input" value={item.product_name} onChange={e => setItem(i, 'product_name', e.target.value)} placeholder="Ej: Monitor 27 pulgadas" />
                    </div>
                    <div>
                      <label className="label">Categoría</label>
                      <select className="input" value={item.category} onChange={e => setItem(i, 'category', e.target.value)}>
                        <option value="">Sin categoría</option>
                        {categoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Cantidad total</label>
                      <input className="input" type="number" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Costo unitario (S/)</label>
                      <input className="input" type="number" step="0.01" value={item.unit_cost} onChange={e => setItem(i, 'unit_cost', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Precio de venta (S/)</label>
                      <input className="input" type="number" step="0.01" value={item.sale_price} onChange={e => setItem(i, 'sale_price', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Descripción</label>
                    <input className="input" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Descripción del producto..." />
                  </div>

                  {/* Variants */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Variantes de color</label>
                      <button className="text-xs text-[#1E3A8A] hover:underline" onClick={() => addVariant(i)}>+ Agregar color</button>
                    </div>
                    {item.variants.length === 0 && (
                      <p className="text-xs text-gray-400">Sin variantes — todo el stock irá a "Estándar"</p>
                    )}
                    <div className="space-y-2">
                      {item.variants.map((v, vi) => (
                        <div key={vi} className="flex gap-2 items-center">
                          <input className="input flex-1" placeholder="Color (ej: Negro)" value={v.color} onChange={e => setVariant(i, vi, 'color', e.target.value)} />
                          <input className="input w-24" type="number" min="0" placeholder="Qty" value={v.qty} onChange={e => setVariant(i, vi, 'qty', e.target.value)} />
                          <button onClick={() => removeVariant(i, vi)} className="text-red-400"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    Subtotal: <span className="font-semibold text-gray-800">S/ {(item.unit_cost * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#1E3A8A] text-white rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm"><span>Productos:</span><span>S/ {totalProducts.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Envío:</span><span>S/ {parseFloat(form.shipping_cost || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Impuestos:</span><span>S/ {parseFloat(form.taxes || 0).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-[#FFD100] text-lg pt-2 border-t border-blue-600">
              <span>Total:</span><span>S/ {totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save}>Registrar Compra</button>
        </div>
      </div>
    </div>
  )
}

export default function Compras() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const load = () => getPurchases().then(setPurchases)

  useEffect(() => {
    load()
    getSuppliers().then(setSuppliers)
    getProducts().then(setProducts)
    import('../api/client').then(m => m.default.get('/categories').then(r => setCategoryList(r.data)))
  }, [])

  const del = async (id) => {
    if (!confirm('¿Eliminar esta compra? Se revertirá el stock.')) return
    await deletePurchase(id)
    toast.success('Compra eliminada')
    load()
  }

  const fmt = (n) => `S/ ${(n || 0).toFixed(2)}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500">{purchases.length} compra{purchases.length !== 1 ? 's' : ''} registrada{purchases.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nueva Compra
        </button>
      </div>

      <div className="space-y-3">
        {purchases.length === 0 && (
          <div className="card text-center py-12 text-gray-400">Sin compras registradas. Agrega tu primera compra.</div>
        )}
        {purchases.map(p => (
          <div key={p.id} className="card p-0 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package size={18} className="text-[#1E3A8A]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Compra #{p.id}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(p.purchase_date).toLocaleDateString('es-PE')}
                    {p.supplier && ` · ${p.supplier.name}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge ${p.status === 'pagado' ? 'badge-green' : 'badge-yellow'}`}>{p.status}</span>
                <div className="text-right">
                  <div className="font-bold text-[#1E3A8A]">{fmt(p.total_cost)}</div>
                  <div className="text-xs text-gray-400">{p.items.length} ítem{p.items.length !== 1 ? 's' : ''}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); del(p.id) }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                  <Trash2 size={15} />
                </button>
                {expanded === p.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {expanded === p.id && (
              <div className="border-t px-4 pb-4">
                <table className="w-full mt-3">
                  <thead>
                    <tr>
                      <th className="table-th">Producto</th>
                      <th className="table-th">SKU</th>
                      <th className="table-th">Variantes</th>
                      <th className="table-th text-right">Qty</th>
                      <th className="table-th text-right">Costo Unit.</th>
                      <th className="table-th text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map(it => (
                      <tr key={it.id} className="border-t">
                        <td className="table-td font-medium">{it.product?.name || '—'}</td>
                        <td className="table-td font-mono text-xs">{it.product?.sku || '—'}</td>
                        <td className="table-td">
                          {(it.variants_data || []).map((v, vi) => (
                            <span key={vi} className="badge badge-blue mr-1">{v.color}: {v.qty}</span>
                          ))}
                        </td>
                        <td className="table-td text-right">{it.quantity}</td>
                        <td className="table-td text-right">{fmt(it.unit_cost)}</td>
                        <td className="table-td text-right font-semibold">{fmt(it.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="border-t bg-gray-50">
                      <td colSpan={4} className="table-td text-right text-xs text-gray-500">Envío: {fmt(p.shipping_cost)} · Impuestos: {fmt(p.taxes)}</td>
                      <td className="table-td text-right font-bold text-[#1E3A8A]">Total:</td>
                      <td className="table-td text-right font-bold text-[#1E3A8A]">{fmt(p.total_cost)}</td>
                    </tr>
                  </tbody>
                </table>
                {p.notes && <p className="text-xs text-gray-500 mt-2">Nota: {p.notes}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <PurchaseForm
          suppliers={suppliers}
          products={products}
          categoryList={categoryList}
          onSave={load}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
