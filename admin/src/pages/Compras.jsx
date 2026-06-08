import { useEffect, useState, useRef } from 'react'
import { getPurchases, createPurchase, deletePurchase, rectifyPurchase, getSuppliers, getProducts, getBrands } from '../api/client'
import api from '../api/client'
import { Plus, Trash2, X, ChevronDown, ChevronUp, Package, Edit2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtN = (n) => (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Numeric input with thousand-separator formatting
function NumInput({ value, onChange, placeholder = '0', className = 'input', integer = false, ...rest }) {
  const [focused, setFocused] = useState(false)
  const raw = value === '' || value === null || value === undefined ? '' : String(value)
  const display = focused
    ? raw
    : raw === ''
      ? ''
      : integer
        ? Number(raw).toLocaleString('es-PE')
        : Number(raw).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <input
      {...rest}
      className={className}
      value={display}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={e => {
        const cleaned = e.target.value.replace(/[^0-9.]/g, '')
        onChange(cleaned)
      }}
    />
  )
}

// Searchable product dropdown
function ProductSearch({ products, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = products.find(p => p.id === value)
  const filtered = products.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="input flex items-center justify-between cursor-pointer"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'} style={{ fontSize: 13 }}>
          {selected ? `${selected.name} — ${selected.sku}` : 'Buscar producto existente...'}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} className="text-gray-400" />
            <input
              autoFocus
              className="tt-input"
              style={{ flex: 1, fontSize: 13, height: 30, border: 'none', outline: 'none' }}
              placeholder="Nombre o SKU..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF' }}>Sin resultados</div>}
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { onChange(p); setOpen(false); setQ('') }}
                style={{
                  display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left',
                  background: value === p.id ? '#EFF6FF' : 'none', border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid #F9FAFB'
                }}
                onMouseEnter={e => { if (value !== p.id) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (value !== p.id) e.currentTarget.style.background = 'none' }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{p.sku} · Stock: {p.total_stock}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── New Purchase Form ────────────────────────────────────────────────────────
const EMPTY_ITEM = {
  is_new: true,
  product_id: null,
  product_name: '', category: '', brand: '', benefit: '', description: '', sale_price: '',
  quantity: '',
  costo_base: '', flete: '', impuestos: '', otros: '',
  unit_cost: 0,
  variants: []
}

function calcUnitCost(item) {
  const qty = parseFloat(item.quantity) || 1
  const total = (parseFloat(item.costo_base) || 0) + (parseFloat(item.flete) || 0) +
    (parseFloat(item.impuestos) || 0) + (parseFloat(item.otros) || 0)
  return qty > 0 ? total / qty : 0
}

function variantTotal(item) {
  return item.variants.reduce((s, v) => s + (parseInt(v.qty) || 0), 0)
}

function PurchaseForm({ suppliers, products, categoryList, brandList, onSave, onClose }) {
  const [form, setForm] = useState({
    supplier_id: '', notes: '', is_credit: false,
    items: [{ ...EMPTY_ITEM }]
  })

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const setItem = (i, key, val) => setForm(f => {
    const items = [...f.items]
    items[i] = { ...items[i], [key]: val }
    items[i].unit_cost = calcUnitCost(items[i])
    return { ...f, items }
  })

  const selectExistingProduct = (i, p) => {
    setForm(f => {
      const items = [...f.items]
      items[i] = {
        ...items[i],
        product_id: p.id,
        product_name: p.name,
        category: p.category,
        brand: p.brand || '',
        benefit: p.benefit || '',
        description: p.description,
        sale_price: p.sale_price,
      }
      return { ...f, items }
    })
  }

  const addVariant = (i) => {
    const items = [...form.items]
    items[i] = { ...items[i], variants: [...items[i].variants, { color: '', qty: '' }] }
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

  const totalCost = form.items.reduce((s, it) => s + (it.unit_cost * (parseFloat(it.quantity) || 0)), 0)

  const save = async () => {
    // Validaciones
    for (const [i, item] of form.items.entries()) {
      if (!item.product_name && !item.product_id) {
        toast.error(`Producto ${i + 1}: falta nombre o selección`)
        return
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        toast.error(`Producto ${i + 1}: la cantidad debe ser mayor a 0`)
        return
      }
      // Variantes: suma no puede superar cantidad total
      if (item.variants.length > 0) {
        const sumVariants = variantTotal(item)
        const qty = parseInt(item.quantity) || 0
        if (sumVariants > qty) {
          toast.error(`Producto ${i + 1}: la suma de variantes (${sumVariants}) supera la cantidad total (${qty})`)
          return
        }
        if (sumVariants < qty) {
          toast.error(`Producto ${i + 1}: la suma de variantes (${sumVariants}) no llega a la cantidad total (${qty}). Ajusta las cantidades.`)
          return
        }
      }
    }

    try {
      const payload = {
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        shipping_cost: 0,
        taxes: 0,
        notes: form.notes,
        is_credit: form.is_credit,
        credit_days: form.credit_days || 0,
        items: form.items.map(it => ({
          product_id: it.product_id ? parseInt(it.product_id) : null,
          product_name: it.product_name,
          category: it.category || '',
          brand: it.brand || '',
          benefit: it.benefit || '',
          description: it.description || '',
          sale_price: parseFloat(it.sale_price) || 0,
          quantity: parseInt(it.quantity),
          unit_cost: parseFloat(it.unit_cost) || 0,
          variants: it.variants.map(v => ({ color: v.color, qty: parseInt(v.qty) || 0 })).filter(v => v.color && v.qty > 0),
        }))
      }
      await createPurchase(payload)
      toast.success('Compra registrada')
      onSave(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg">Nueva Compra</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-5">
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
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_credit} onChange={e => setForm(f => ({ ...f, is_credit: e.target.checked }))} className="w-4 h-4 accent-[#C49A8A]" />
              <span className="text-sm text-gray-700">Compra a crédito</span>
            </label>
            {form.is_credit && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Días de crédito:</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  style={{ width: 80 }}
                  value={form.credit_days}
                  onChange={e => setForm(f => ({ ...f, credit_days: parseInt(e.target.value) || 30 }))}
                />
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Productos</h4>
              <button className="btn-primary text-xs py-1.5" onClick={addItem}><Plus size={14} className="inline mr-1" />Agregar producto</button>
            </div>
            <div className="space-y-4">
              {form.items.map((item, i) => {
                const unitCost = calcUnitCost(item)
                const qty = parseFloat(item.quantity) || 0
                const subtotal = unitCost * qty
                const sumVar = variantTotal(item)
                const varError = item.variants.length > 0 && sumVar !== qty && qty > 0

                return (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Producto {i + 1}</span>
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                      )}
                    </div>

                    {/* Nuevo vs Existente toggle */}
                    <div className="flex gap-2">
                      <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${item.is_new ? 'bg-[#1E1A1A] text-white border-[#1E1A1A]' : 'bg-white text-gray-600 border-gray-200'}`}
                        onClick={() => setItem(i, 'is_new', true)}
                      >Producto nuevo</button>
                      <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${!item.is_new ? 'bg-[#1E1A1A] text-white border-[#1E1A1A]' : 'bg-white text-gray-600 border-gray-200'}`}
                        onClick={() => setItem(i, 'is_new', false)}
                      >Producto existente</button>
                    </div>

                    {/* Product selection */}
                    {item.is_new ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Nombre del producto *</label>
                          <input className="input" value={item.product_name} onChange={e => setItem(i, 'product_name', e.target.value)} placeholder="Ej: Snail Mucin Essence" />
                        </div>
                        <div>
                          <label className="label">Categoría</label>
                          <select className="input" value={item.category} onChange={e => setItem(i, 'category', e.target.value)}>
                            <option value="">Sin categoría</option>
                            {categoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Marca</label>
                          <select className="input" value={item.brand} onChange={e => setItem(i, 'brand', e.target.value)}>
                            <option value="">Sin marca</option>
                            {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Beneficio</label>
                          <input className="input" value={item.benefit} onChange={e => setItem(i, 'benefit', e.target.value)} placeholder="Ej: Hidratación, Anti-acné..." />
                        </div>
                        <div className="col-span-2">
                          <label className="label">Descripción</label>
                          <input className="input" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Descripción del producto..." />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="label">Seleccionar producto existente *</label>
                        <ProductSearch
                          products={products}
                          value={item.product_id}
                          onChange={(p) => selectExistingProduct(i, p)}
                        />
                        {item.product_id && (
                          <p className="text-xs text-gray-400 mt-1">Seleccionado: <span className="font-medium text-gray-700">{item.product_name}</span></p>
                        )}
                      </div>
                    )}

                    {/* Precio de venta */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Precio de venta (S/)</label>
                        <NumInput value={item.sale_price} onChange={v => setItem(i, 'sale_price', v)} placeholder="0.00" />
                      </div>
                      <div>
                        <label className="label">Cantidad total de unidades *</label>
                        <NumInput value={item.quantity} onChange={v => setItem(i, 'quantity', v)} placeholder="0" integer />
                      </div>
                    </div>

                    {/* Costos */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Desglose de costos</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Costo base (S/)</label>
                          <NumInput value={item.costo_base} onChange={v => setItem(i, 'costo_base', v)} placeholder="0.00" />
                        </div>
                        <div>
                          <label className="label">Flete (S/)</label>
                          <NumInput value={item.flete} onChange={v => setItem(i, 'flete', v)} placeholder="0.00" />
                        </div>
                        <div>
                          <label className="label">Impuestos (S/)</label>
                          <NumInput value={item.impuestos} onChange={v => setItem(i, 'impuestos', v)} placeholder="0.00" />
                        </div>
                        <div>
                          <label className="label">Otros costos (S/)</label>
                          <NumInput value={item.otros} onChange={v => setItem(i, 'otros', v)} placeholder="0.00" />
                        </div>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200 text-sm">
                        <span className="text-gray-500">Costo total: <span className="font-semibold text-gray-800">S/ {fmtN((parseFloat(item.costo_base)||0)+(parseFloat(item.flete)||0)+(parseFloat(item.impuestos)||0)+(parseFloat(item.otros)||0))}</span></span>
                        <span className="text-gray-500">Costo unitario: <span className="font-bold text-[#1E1A1A]">S/ {fmtN(unitCost)}</span></span>
                      </div>
                    </div>

                    {/* Variantes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="label mb-0">Variantes de color</label>
                        <button className="text-xs text-[#1E1A1A] hover:underline" onClick={() => addVariant(i)}>+ Agregar color</button>
                      </div>
                      {item.variants.length === 0 && (
                        <p className="text-xs text-gray-400">Sin variantes — todo el stock irá a "Estándar"</p>
                      )}
                      <div className="space-y-2">
                        {item.variants.map((v, vi) => (
                          <div key={vi} className="flex gap-2 items-center">
                            <input className="input flex-1" placeholder="Color (ej: Negro)" value={v.color} onChange={e => setVariant(i, vi, 'color', e.target.value)} />
                            <NumInput
                              className={`input w-28 ${varError ? 'border-red-400' : ''}`}
                              placeholder="Qty"
                              value={v.qty}
                              onChange={val => setVariant(i, vi, 'qty', val)}
                              integer
                            />
                            <button onClick={() => removeVariant(i, vi)} className="text-red-400"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                      {item.variants.length > 0 && qty > 0 && (
                        <div className={`text-xs mt-1.5 flex items-center gap-1 ${varError ? 'text-red-500' : 'text-green-600'}`}>
                          {varError
                            ? `⚠ Suma de variantes: ${sumVar} / ${qty} — deben ser iguales`
                            : `✓ Variantes OK: ${sumVar} / ${qty}`
                          }
                        </div>
                      )}
                    </div>

                    <div className="text-right text-sm text-gray-500 pt-1 border-t border-gray-100">
                      Subtotal: <span className="font-semibold text-gray-800">S/ {fmtN(subtotal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#1E1A1A] text-white rounded-xl p-4">
            <div className="flex justify-between font-bold text-[#EEC5C5] text-lg">
              <span>Total compra:</span><span>S/ {fmtN(totalCost)}</span>
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

// ── Rectify Modal ────────────────────────────────────────────────────────────
function RectifyForm({ purchase, onSave, onClose }) {
  const [items, setItems] = useState(
    purchase.items.map(it => ({
      purchase_item_id: it.id,
      name: it.product?.name || '—',
      sku: it.product?.sku || '',
      new_quantity: it.quantity,
      new_unit_cost: it.unit_cost,
      variants_data: it.variants_data || [],
    }))
  )
  const [notes, setNotes] = useState(purchase.notes || '')

  const setRow = (i, key, val) => setItems(prev => {
    const next = [...prev]
    next[i] = { ...next[i], [key]: val }
    return next
  })

  const save = async () => {
    try {
      await rectifyPurchase(purchase.id, {
        items: items.map(it => ({
          purchase_item_id: it.purchase_item_id,
          new_quantity: parseInt(it.new_quantity) || 0,
          new_unit_cost: parseFloat(it.new_unit_cost) || 0,
        })),
        notes,
      })
      toast.success('Compra rectificada')
      onSave(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al rectificar')
    }
  }

  const newTotal = items.reduce((s, it) => s + (parseFloat(it.new_unit_cost) || 0) * (parseInt(it.new_quantity) || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-lg">Rectificar Compra #{purchase.id}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ajusta cantidades y costos. El inventario y la contabilidad se actualizarán automáticamente.</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {items.map((it, i) => (
            <div key={it.purchase_item_id} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-gray-900">{it.name}</div>
                  <div className="text-xs font-mono text-gray-400">{it.sku}</div>
                </div>
                <div className="text-xs text-gray-400">
                  Original: {it.new_quantity} u. · S/ {fmtN(it.new_unit_cost)} c/u
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nueva cantidad</label>
                  <NumInput
                    value={it.new_quantity}
                    onChange={v => setRow(i, 'new_quantity', v)}
                    integer
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Nuevo costo unitario (S/)</label>
                  <NumInput
                    value={it.new_unit_cost}
                    onChange={v => setRow(i, 'new_unit_cost', v)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                Nuevo subtotal: <span className="font-semibold text-gray-800">
                  S/ {fmtN((parseFloat(it.new_unit_cost)||0) * (parseInt(it.new_quantity)||0))}
                </span>
              </div>
            </div>
          ))}

          <div>
            <label className="label">Nota de rectificación</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motivo de la rectificación..." />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-amber-800">Nuevo total de compra:</span>
            <span className="text-lg font-bold text-amber-900">S/ {fmtN(newTotal)}</span>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save}>Confirmar Rectificación</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Compras() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [brandList, setBrandList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [rectify, setRectify] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')

  const load = () => getPurchases().then(setPurchases)

  useEffect(() => {
    load()
    getSuppliers().then(setSuppliers)
    getProducts().then(setProducts)
    api.get('/categories').then(r => setCategoryList(r.data))
    getBrands().then(setBrandList)
  }, [])

  const del = async (id) => {
    if (!confirm('¿Eliminar esta compra? Se revertirá el stock.')) return
    await deletePurchase(id)
    toast.success('Compra eliminada')
    load()
  }

  const displayPurchases = purchases
    .filter(p => {
      if (statusFilter && p.status !== statusFilter) return false
      if (supplierFilter && String(p.supplier_id) !== supplierFilter) return false
      if (dateFrom && new Date(p.purchase_date) < new Date(dateFrom)) return false
      if (dateTo && new Date(p.purchase_date) > new Date(dateTo + 'T23:59:59')) return false
      if (search) {
        const q = search.toLowerCase()
        const matchSupplier = p.supplier?.name?.toLowerCase().includes(q)
        const matchId = String(p.id).includes(q)
        const matchItem = p.items.some(it => it.product?.name?.toLowerCase().includes(q))
        if (!matchSupplier && !matchId && !matchItem) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date_asc')   return new Date(a.purchase_date) - new Date(b.purchase_date)
      if (sortBy === 'date_desc')  return new Date(b.purchase_date) - new Date(a.purchase_date)
      if (sortBy === 'total_asc')  return a.total_cost - b.total_cost
      if (sortBy === 'total_desc') return b.total_cost - a.total_cost
      return 0
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500">{displayPurchases.length} compra{displayPurchases.length !== 1 ? 's' : ''} registrada{displayPurchases.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nueva Compra
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 w-52" placeholder="Buscar proveedor o producto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="credito">Crédito</option>
          <option value="parcial">Parcial</option>
        </select>
        <select className="input w-44" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="">Todos los proveedores</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Desde</label>
          <input className="input w-36" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Hasta</label>
          <input className="input w-36" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <select className="input w-44" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date_desc">Más reciente</option>
          <option value="date_asc">Más antiguo</option>
          <option value="total_desc">Mayor total</option>
          <option value="total_asc">Menor total</option>
        </select>
      </div>

      <div className="space-y-3">
        {displayPurchases.length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            {purchases.length === 0 ? 'Sin compras registradas. Agrega tu primera compra.' : 'Sin resultados con los filtros aplicados.'}
          </div>
        )}
        {displayPurchases.map(p => (
          <div key={p.id} className="card p-0 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package size={18} className="text-[#1E1A1A]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Compra #{p.id}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(p.purchase_date).toLocaleDateString('es-PE')}
                    {p.supplier && ` · ${p.supplier.name}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${p.status === 'pagado' ? 'badge-green' : 'badge-yellow'}`}>{p.status}</span>
                <div className="text-right">
                  <div className="font-bold text-[#1E1A1A]">{fmt(p.total_cost)}</div>
                  <div className="text-xs text-gray-400">{p.items.length} ítem{p.items.length !== 1 ? 's' : ''}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setRectify(p) }}
                  className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500"
                  title="Rectificar compra"
                >
                  <Edit2 size={15} />
                </button>
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
                        <td className="table-td text-right">{(it.quantity || 0).toLocaleString('es-PE')}</td>
                        <td className="table-td text-right">{fmt(it.unit_cost)}</td>
                        <td className="table-td text-right font-semibold">{fmt(it.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="border-t bg-gray-50">
                      <td colSpan={4} className="table-td text-right text-xs text-gray-500"></td>
                      <td className="table-td text-right font-bold text-[#1E1A1A]">Total:</td>
                      <td className="table-td text-right font-bold text-[#1E1A1A]">{fmt(p.total_cost)}</td>
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
          brandList={brandList}
          onSave={load}
          onClose={() => setShowForm(false)}
        />
      )}

      {rectify && (
        <RectifyForm
          purchase={rectify}
          onSave={load}
          onClose={() => setRectify(null)}
        />
      )}
    </div>
  )
}
