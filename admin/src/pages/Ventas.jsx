import { useEffect, useState, useRef } from 'react'
import { getSales, createSale, deleteSale, getProducts } from '../api/client'
import { Plus, Trash2, X, ShoppingBag, ChevronDown, ChevronUp, Printer, Search } from 'lucide-react'
import toast from 'react-hot-toast'

function InvoiceModal({ sale, onClose }) {
  const ref = useRef()
  const fmt = (n) => `S/ ${(n || 0).toFixed(2)}`
  const print = () => {
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>Factura ${sale.invoice_number}</title>
    <style>body{font-family:sans-serif;padding:20px;max-width:600px;margin:0 auto}
    .header{text-align:center;border-bottom:2px solid #1E1A1A;padding-bottom:16px;margin-bottom:16px}
    .logo{font-size:28px;font-weight:900;color:#1E1A1A}table{width:100%;border-collapse:collapse}
    th{background:#1E1A1A;color:white;padding:8px;text-align:left;font-size:12px}
    td{padding:8px;border-bottom:1px solid #eee;font-size:13px}.total{font-weight:bold;font-size:16px;color:#1E1A1A}
    .totals td{border-bottom:none}</style></head><body>`)
    w.document.write(ref.current.innerHTML)
    w.document.write('</body></html>')
    w.document.close()
    w.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="font-bold">Comprobante de Venta</h3>
          <div className="flex gap-2">
            <button className="btn-blue flex items-center gap-2 text-sm" onClick={print}>
              <Printer size={15} /> Imprimir
            </button>
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>
        </div>
        <div ref={ref} className="p-8">
          <div className="header text-center border-b-2 border-[#1E1A1A] pb-4 mb-6">
            <div className="text-3xl font-black text-[#1E1A1A]">Glowi Skin</div>
            <div className="text-sm text-gray-500">Korean Skincare · Lima, Perú</div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <div className="font-semibold text-gray-700 mb-1">Datos del comprobante</div>
              <div><span className="text-gray-500">N°:</span> <strong>{sale.invoice_number}</strong></div>
              <div><span className="text-gray-500">Fecha:</span> {new Date(sale.sale_date).toLocaleDateString('es-PE')}</div>
              <div><span className="text-gray-500">Tipo:</span> {sale.sale_type === 'retail' ? 'Retail' : 'Mayorista'}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">Cliente</div>
              <div>{sale.customer_name}</div>
              {sale.customer_email && <div className="text-gray-500">{sale.customer_email}</div>}
              {sale.customer_phone && <div className="text-gray-500">{sale.customer_phone}</div>}
              {sale.customer_address && <div className="text-gray-500">{sale.customer_address}</div>}
            </div>
          </div>
          <table className="w-full mb-4">
            <thead>
              <tr className="bg-[#1E1A1A] text-white text-xs">
                <th className="text-left p-2">Producto</th>
                <th className="text-center p-2">Qty</th>
                <th className="text-right p-2">P. Unit.</th>
                <th className="text-right p-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((it, i) => (
                <tr key={i} className="border-b text-sm">
                  <td className="p-2">
                    {it.product?.name || 'Producto'}
                    {it.variant && <span className="text-gray-400 text-xs ml-1">({it.variant.color})</span>}
                  </td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right">{fmt(it.sale_price)}</td>
                  <td className="p-2 text-right">{fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{fmt(sale.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">IGV (18%):</span><span>{fmt(sale.tax_amount)}</span></div>
              <div className="flex justify-between font-bold text-[#1E1A1A] text-lg border-t pt-1">
                <span>Total:</span><span>{fmt(sale.total)}</span>
              </div>
            </div>
          </div>
          {sale.notes && <p className="text-xs text-gray-500 mt-4">Nota: {sale.notes}</p>}
          <div className="text-center text-xs text-gray-400 mt-6 pt-4 border-t">¡Gracias por tu compra en Glowi Skin!</div>
        </div>
      </div>
    </div>
  )
}

function SaleForm({ products, onSave, onClose }) {
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState({ name: 'Cliente', email: '', phone: '', address: '', sale_type: 'retail', is_credit: false, credit_days: 30, notes: '' })
  const [selProduct, setSelProduct] = useState(null)
  const [selVariant, setSelVariant] = useState('')
  const [qty, setQty] = useState(1)

  const addToCart = () => {
    if (!selProduct) return
    const product = products.find(p => p.id === parseInt(selProduct))
    if (!product) return
    const variant = selVariant ? product.variants.find(v => v.id === parseInt(selVariant)) : null
    const existing = cart.findIndex(c => c.product_id === product.id && c.variant_id === (variant?.id || null))
    if (existing >= 0) {
      const newCart = [...cart]
      newCart[existing].quantity += parseInt(qty)
      newCart[existing].subtotal = newCart[existing].quantity * newCart[existing].sale_price
      setCart(newCart)
    } else {
      setCart(c => [...c, {
        product_id: product.id,
        product_name: product.name,
        variant_id: variant?.id || null,
        variant_color: variant?.color || null,
        quantity: parseInt(qty),
        catalog_price: product.sale_price,
        sale_price: product.sale_price,
        subtotal: product.sale_price * parseInt(qty),
        max_stock: variant ? variant.stock : product.total_stock,
      }])
    }
    setSelProduct(null)
    setSelVariant('')
    setQty(1)
  }

  const updatePrice = (i, price) => {
    const newCart = [...cart]
    newCart[i].sale_price = parseFloat(price)
    newCart[i].subtotal = newCart[i].quantity * parseFloat(price)
    setCart(newCart)
  }

  const removeCart = (i) => setCart(c => c.filter((_, idx) => idx !== i))

  const subtotal = cart.reduce((s, c) => s + c.subtotal, 0)
  const tax = subtotal * 0.18
  const total = subtotal + tax

  const save = async () => {
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return }
    try {
      const payload = {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_address: customer.address,
        is_credit: customer.is_credit,
        credit_days: customer.credit_days || 0,
        notes: customer.notes,
        sale_type: customer.sale_type,
        items: cart.map(c => ({
          product_id: c.product_id,
          variant_id: c.variant_id,
          quantity: c.quantity,
          catalog_price: c.catalog_price,
          sale_price: c.sale_price,
        }))
      }
      await createSale(payload)
      toast.success('Venta registrada')
      onSave()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    }
  }

  const selectedProduct = products.find(p => p.id === parseInt(selProduct))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg">Nueva Venta</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Customer */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Datos del cliente</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tipo de venta</label>
                <select className="input" value={customer.sale_type} onChange={e => setCustomer(c => ({ ...c, sale_type: e.target.value }))}>
                  <option value="retail">Retail (minorista)</option>
                  <option value="wholesale">Wholesale (mayorista)</option>
                </select>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Celular</label>
                <input className="input" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Dirección</label>
                <input className="input" value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={customer.is_credit} onChange={e => setCustomer(c => ({ ...c, is_credit: e.target.checked }))} className="w-4 h-4 accent-[#C49A8A]" />
                <span className="text-sm text-gray-700">Venta a crédito</span>
              </label>
              {customer.is_credit && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Días de crédito:</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    style={{ width: 80 }}
                    value={customer.credit_days}
                    onChange={e => setCustomer(c => ({ ...c, credit_days: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Add product */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Agregar producto al carrito</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="label">Producto</label>
                <select className="input" value={selProduct || ''} onChange={e => { setSelProduct(e.target.value); setSelVariant('') }}>
                  <option value="">Seleccionar...</option>
                  {products.filter(p => p.total_stock > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.total_stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Color / Variante</label>
                <select className="input" value={selVariant} onChange={e => setSelVariant(e.target.value)} disabled={!selectedProduct}>
                  <option value="">Cualquier variante</option>
                  {selectedProduct?.variants.filter(v => v.stock > 0).map(v => (
                    <option key={v.id} value={v.id}>{v.color} ({v.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cantidad</label>
                <div className="flex gap-2">
                  <input className="input" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
                  <button className="btn-primary" onClick={addToCart} disabled={!selProduct}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Carrito ({cart.length} ítem{cart.length !== 1 ? 's' : ''})</h4>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 rounded">
                    <th className="table-th">Producto</th>
                    <th className="table-th text-right">Qty</th>
                    <th className="table-th text-right">Precio</th>
                    <th className="table-th text-right">Subtotal</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="table-td">
                        <div className="font-medium">{c.product_name}</div>
                        {c.variant_color && <div className="text-xs text-gray-400">{c.variant_color}</div>}
                      </td>
                      <td className="table-td text-right">{c.quantity}</td>
                      <td className="table-td text-right">
                        <input
                          className="input w-24 text-right"
                          type="number" step="0.01"
                          value={c.sale_price}
                          onChange={e => updatePrice(i, e.target.value)}
                        />
                      </td>
                      <td className="table-td text-right font-semibold">S/ {c.subtotal.toFixed(2)}</td>
                      <td className="table-td">
                        <button onClick={() => removeCart(i)} className="text-red-400"><X size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="bg-[#1E1A1A] text-white rounded-xl p-4 mt-4 space-y-1">
                <div className="flex justify-between text-sm"><span>Subtotal:</span><span>S/ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>IGV (18%):</span><span>S/ {tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-[#EEC5C5] text-lg pt-2 border-t border-blue-600">
                  <span>Total:</span><span>S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label">Notas</label>
            <input className="input" value={customer.notes} onChange={e => setCustomer(c => ({ ...c, notes: e.target.value }))} placeholder="Notas opcionales..." />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save} disabled={cart.length === 0}>Registrar Venta</button>
        </div>
      </div>
    </div>
  )
}

export default function Ventas() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')

  const load = () => getSales().then(setSales)

  useEffect(() => {
    load()
    getProducts().then(setProducts)
  }, [])

  const del = async (id) => {
    if (!confirm('¿Eliminar esta venta? Se revertirá el stock.')) return
    await deleteSale(id)
    toast.success('Venta eliminada')
    load()
  }

  const fmt = (n) => `S/ ${(n || 0).toFixed(2)}`

  const displaySales = sales
    .filter(s => {
      if (statusFilter && s.status !== statusFilter) return false
      if (typeFilter && s.sale_type !== typeFilter) return false
      if (dateFrom && new Date(s.sale_date) < new Date(dateFrom)) return false
      if (dateTo && new Date(s.sale_date) > new Date(dateTo + 'T23:59:59')) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.customer_name?.toLowerCase().includes(q) && !s.invoice_number?.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date_asc')   return new Date(a.sale_date) - new Date(b.sale_date)
      if (sortBy === 'date_desc')  return new Date(b.sale_date) - new Date(a.sale_date)
      if (sortBy === 'total_asc')  return a.total - b.total
      if (sortBy === 'total_desc') return b.total - a.total
      return 0
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500">{displaySales.length} venta{displaySales.length !== 1 ? 's' : ''} registrada{displaySales.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nueva Venta
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 w-52" placeholder="Buscar cliente o comprobante..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="cobrado">Cobrado</option>
          <option value="credito">Crédito</option>
          <option value="parcial">Parcial</option>
        </select>
        <select className="input w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
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
        {displaySales.length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            {sales.length === 0 ? 'Sin ventas registradas.' : 'Sin resultados con los filtros aplicados.'}
          </div>
        )}
        {displaySales.map(s => (
          <div key={s.id} className="card p-0 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={18} className="text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold">{s.invoice_number}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(s.sale_date).toLocaleDateString('es-PE')} · {s.customer_name}
                    · <span className="capitalize">{s.sale_type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge ${s.status === 'cobrado' ? 'badge-green' : 'badge-yellow'}`}>{s.status}</span>
                <div className="text-right">
                  <div className="font-bold text-[#1E1A1A]">{fmt(s.total)}</div>
                  <div className="text-xs text-gray-400">{s.items.length} ítem{s.items.length !== 1 ? 's' : ''}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setInvoice(s) }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500" title="Ver comprobante">
                  <Printer size={15} />
                </button>
                <button onClick={e => { e.stopPropagation(); del(s.id) }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                  <Trash2 size={15} />
                </button>
                {expanded === s.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {expanded === s.id && (
              <div className="border-t px-4 pb-4">
                <table className="w-full mt-3">
                  <thead>
                    <tr>
                      <th className="table-th">Producto</th>
                      <th className="table-th">Variante</th>
                      <th className="table-th text-right">Qty</th>
                      <th className="table-th text-right">P. Catálogo</th>
                      <th className="table-th text-right">P. Venta</th>
                      <th className="table-th text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.items.map(it => (
                      <tr key={it.id} className="border-t">
                        <td className="table-td font-medium">{it.product?.name || '—'}</td>
                        <td className="table-td">{it.variant?.color || '—'}</td>
                        <td className="table-td text-right">{it.quantity}</td>
                        <td className="table-td text-right">{fmt(it.catalog_price)}</td>
                        <td className="table-td text-right">{fmt(it.sale_price)}</td>
                        <td className="table-td text-right font-semibold">{fmt(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && <SaleForm products={products} onSave={load} onClose={() => setShowForm(false)} />}
      {invoice && <InvoiceModal sale={invoice} onClose={() => setInvoice(null)} />}
    </div>
  )
}
