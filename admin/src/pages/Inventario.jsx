import { useEffect, useState } from 'react'
import { getProducts, updateProduct, deleteProduct, getCategories, getBrands, uploadProductImage, deleteProductImage, uploadVariantImage, deleteVariantImage, createProduct, addVariant } from '../api/client'
import { Search, Edit2, Trash2, X, Image, Eye, EyeOff, Camera, Plus, Boxes, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import PacksManager from '../components/PacksManager'

function NewProductModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', category: '', brand: '', necessity_id: null,
    description: '', usage_guide: '', skin_type: '', specifications: '',
    sale_price: '', ref_cost: '', show_in_store: true
  })
  const [variants, setVariants] = useState([{ color: '' }])
  const [categoryList, setCategoryList] = useState([])
  const [brandList, setBrandList] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    import('../api/client').then(m => m.default.get('/categories').then(r => setCategoryList(r.data)))
    getBrands().then(setBrandList)
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addVariantRow = () => setVariants(v => [...v, { color: '' }])
  const removeVariantRow = (i) => setVariants(v => v.filter((_, idx) => idx !== i))
  const setVariantColor = (i, val) => setVariants(v => v.map((r, idx) => idx === i ? { ...r, color: val } : r))

  const save = async () => {
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    if (variants.some(v => !v.color.trim())) return toast.error('Completa el nombre de todas las variantes')
    setSaving(true)
    try {
      const product = await createProduct({
        name: form.name.trim(),
        category: form.category,
        brand: form.brand,
        necessity_id: form.necessity_id || null,
        description: form.description,
        usage_guide: form.usage_guide,
        skin_type: form.skin_type,
        specifications: form.specifications,
        sale_price: parseFloat(form.sale_price) || 0,
        ref_cost: parseFloat(form.ref_cost) || 0,
        show_in_store: form.show_in_store,
      })
      // Variantes en paralelo: un solo "viaje" al servidor en vez de uno por color
      await Promise.all(variants.map(v => addVariant(product.id, { color: v.color.trim(), stock: 0 })))
      toast.success('Producto creado')
      onSaved()
      onClose()
    } catch { toast.error('Error al crear producto') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h3 className="font-bold text-lg">Nuevo producto</h3>
            <p className="text-xs text-gray-400 mt-0.5">El stock inicia en 0. Se actualiza al registrar una compra.</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre del producto *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: COSRX Snail Mucin 96%" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Sin categoría</option>
                {categoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Marca</label>
              <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
                <option value="">Sin marca</option>
                {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Precio de venta (S/)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Costo referencial (S/)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.ref_cost} onChange={e => set('ref_cost', e.target.value)} placeholder="0.00" />
              <p className="text-xs text-gray-400 mt-1">Estimado. El costo real se registra al hacer la compra.</p>
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Guía de Uso</label>
              <textarea className="input" rows={2} value={form.usage_guide} onChange={e => set('usage_guide', e.target.value)} placeholder="Ej: Aplicar en rostro limpio..." />
            </div>
            <div className="col-span-2">
              <label className="label">Tipo de Piel</label>
              <textarea className="input" rows={2} value={form.skin_type} onChange={e => set('skin_type', e.target.value)} placeholder="Ej: Ideal para todo tipo de piel..." />
            </div>
            <div className="col-span-2">
              <label className="label">Especificaciones</label>
              <textarea className="input" rows={2} value={form.specifications} onChange={e => set('specifications', e.target.value)} placeholder="Ej: Ingredientes clave, modo de uso, precauciones..." />
            </div>
          </div>

          {/* Variantes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Variantes / colores *</label>
              <button onClick={addVariantRow} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> Agregar variante
              </button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={v.color}
                    onChange={e => setVariantColor(i, e.target.value)}
                    placeholder={`Variante ${i + 1} (ej: 100ml, Negro, Único...)`}
                  />
                  {variants.length > 1 && (
                    <button onClick={() => removeVariantRow(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Si el producto no tiene variantes, pon "Único".</p>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="store_new" checked={form.show_in_store} onChange={e => set('show_in_store', e.target.checked)} className="w-4 h-4 accent-[#C49A8A]" />
            <label htmlFor="store_new" className="text-sm text-gray-700">Mostrar en tienda online</label>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save} disabled={saving}>
            {saving ? 'Creando...' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ product, onClose, onSaved }) {
  const [data, setData] = useState({
    name: product.name,
    category: product.category,
    brand: product.brand || '',
    necessity_id: product.necessity_id || null,
    description: product.description,
    usage_guide: product.usage_guide || '',
    skin_type: product.skin_type || '',
    specifications: product.specifications || '',
    sale_price: product.sale_price,
    show_in_store: product.show_in_store
  })
  const [uploading, setUploading] = useState(false)
  const [variantUploading, setVariantUploading] = useState({})
  const [categoryList, setCategoryList] = useState([])
  const [brandList, setBrandList] = useState([])

  useEffect(() => {
    import('../api/client').then(m => m.default.get('/categories').then(r => setCategoryList(r.data)))
    getBrands().then(setBrandList)
  }, [])

  const save = async () => {
    try {
      await updateProduct(product.id, data)
      toast.success('Producto actualizado')
      onSaved()
      onClose()
    } catch { toast.error('Error al actualizar') }
  }

  const uploadImg = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadProductImage(product.id, file)
      toast.success('Imagen subida')
      onSaved()
    } catch { toast.error('Error al subir imagen') }
    finally { setUploading(false) }
  }

  const delImg = async (imgId) => {
    await deleteProductImage(imgId)
    toast.success('Imagen eliminada')
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h3 className="font-bold text-lg">{product.name}</h3>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{product.sku}</span>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input className="input" value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={data.category} onChange={e => setData(d => ({ ...d, category: e.target.value }))}>
                <option value="">Sin categoría</option>
                {categoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Marca</label>
              <select className="input" value={data.brand} onChange={e => setData(d => ({ ...d, brand: e.target.value }))}>
                <option value="">Sin marca</option>
                {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Precio de venta (S/)</label>
            <input className="input" type="number" step="0.01" value={data.sale_price} onChange={e => setData(d => ({ ...d, sale_price: parseFloat(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={3} value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Guía de Uso</label>
            <textarea className="input" rows={3} value={data.usage_guide} onChange={e => setData(d => ({ ...d, usage_guide: e.target.value }))} placeholder="Ej: Aplicar en rostro limpio..." />
          </div>
          <div>
            <label className="label">Tipo de Piel</label>
            <textarea className="input" rows={3} value={data.skin_type} onChange={e => setData(d => ({ ...d, skin_type: e.target.value }))} placeholder="Ej: Ideal para todo tipo de piel..." />
          </div>
          <div>
            <label className="label">Especificaciones</label>
            <textarea className="input" rows={3} value={data.specifications} onChange={e => setData(d => ({ ...d, specifications: e.target.value }))} placeholder="Ej: Ingredientes clave, modo de uso..." />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="store" checked={data.show_in_store} onChange={e => setData(d => ({ ...d, show_in_store: e.target.checked }))} className="w-4 h-4 accent-[#C49A8A]" />
            <label htmlFor="store" className="text-sm text-gray-700">Mostrar en tienda online</label>
          </div>

          {/* Variants with per-color image upload */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Variantes de color / Stock / Foto</h4>
            <div className="space-y-2">
              {product.variants.map(v => (
                <div key={v.id} className="flex items-center gap-3 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100">
                  {/* Color image thumbnail */}
                  <div className="relative flex-shrink-0">
                    {v.image_url ? (
                      <div className="relative group w-12 h-12">
                        <img src={v.image_url} alt={v.color} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                        <button
                          onClick={async () => {
                            await deleteVariantImage(v.id)
                            toast.success('Foto eliminada')
                            onSaved()
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        ><X size={8} /></button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={variantUploading[v.id]}
                          onChange={async (e) => {
                            const file = e.target.files[0]
                            if (!file) return
                            setVariantUploading(u => ({ ...u, [v.id]: true }))
                            try {
                              await uploadVariantImage(v.id, file)
                              toast.success(`Foto de ${v.color} subida`)
                              onSaved()
                            } catch { toast.error('Error al subir foto') }
                            finally { setVariantUploading(u => ({ ...u, [v.id]: false })) }
                          }}
                        />
                        <div className="w-12 h-12 border-2 border-dashed border-gray-300 hover:border-[#EEC5C5] rounded-lg flex flex-col items-center justify-center transition-colors">
                          {variantUploading[v.id]
                            ? <div className="w-4 h-4 border-2 border-[#1E1A1A] border-t-transparent rounded-full animate-spin" />
                            : <Camera size={16} className="text-gray-400" />
                          }
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Color name + stock */}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{v.color}</span>
                      {!v.image_url && <p className="text-xs text-gray-400">Sin foto</p>}
                    </div>
                    <span className={`badge ${v.stock === 0 ? 'badge-red' : v.stock <= 3 ? 'badge-yellow' : 'badge-green'}`}>
                      {v.stock} unid.
                    </span>
                  </div>
                </div>
              ))}
              {product.variants.length === 0 && <div className="text-sm text-gray-400">Sin variantes registradas</div>}
            </div>
            <p className="text-xs text-gray-400 mt-2">💡 Haz clic en el ícono de cámara para subir la foto de cada color</p>
          </div>

          {/* Images */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Imágenes</h4>
            <div className="flex flex-wrap gap-3 mb-3">
              {product.images.map(img => (
                <div key={img.id} className="relative group w-20 h-20">
                  <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border" />
                  {img.is_primary && <span className="absolute top-0.5 left-0.5 badge badge-yellow text-[10px]">Principal</span>}
                  <button
                    onClick={() => delImg(img.id)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={uploadImg} disabled={uploading} />
              <div className="border-2 border-dashed border-gray-300 hover:border-[#EEC5C5] rounded-lg p-4 text-center transition-colors">
                <Image size={20} className="mx-auto mb-1 text-gray-400" />
                <span className="text-sm text-gray-500">{uploading ? 'Subiendo...' : 'Haz clic para subir imagen'}</span>
              </div>
            </label>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save}>Guardar cambios</button>
        </div>
      </div>
    </div>
  )
}

export default function Inventario() {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = () => getProducts({ search: search || undefined, category: cat || undefined }).then(setProducts)

  useEffect(() => {
    load()
    getCategories().then(setCategories)
  }, [])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [search, cat])

  const del = async (p) => {
    if (!confirm(`¿Eliminar "${p.name}"? Esto eliminará todas sus variantes e imágenes.`)) return
    await deleteProduct(p.id)
    toast.success('Producto eliminado')
    load()
  }

  const toggleStore = async (p) => {
    await updateProduct(p.id, { show_in_store: !p.show_in_store })
    toast.success(p.show_in_store ? 'Oculto de la tienda' : 'Visible en la tienda')
    load()
  }

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort()
  const displayProducts = products
    .filter(p => {
      if (brandFilter && p.brand !== brandFilter) return false
      if (stockFilter === 'con_stock' && p.total_stock === 0) return false
      if (stockFilter === 'sin_stock' && p.total_stock > 0) return false
      if (activeFilter === 'active' && !p.is_active) return false
      if (activeFilter === 'inactive' && p.is_active) return false
      if (storeFilter === 'visible' && !p.show_in_store) return false
      if (storeFilter === 'hidden' && p.show_in_store) return false
      return true
    })
    .sort((a, b) => {
      const ma = a.unit_cost > 0 ? (a.sale_price - a.unit_cost) / a.unit_cost : 0
      const mb = b.unit_cost > 0 ? (b.sale_price - b.unit_cost) / b.unit_cost : 0
      switch (sortBy) {
        case 'name_asc':    return a.name.localeCompare(b.name, 'es')
        case 'name_desc':   return b.name.localeCompare(a.name, 'es')
        case 'price_asc':   return a.sale_price - b.sale_price
        case 'price_desc':  return b.sale_price - a.sale_price
        case 'stock_asc':   return a.total_stock - b.total_stock
        case 'stock_desc':  return b.total_stock - a.total_stock
        case 'margin_asc':  return ma - mb
        case 'margin_desc': return mb - ma
        default: return 0
      }
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500">Productos físicos y packs promocionales</p>
        </div>
        {tab === 'products' && <button className="btn-blue flex items-center gap-2" onClick={() => setCreating(true)}>
          <Plus size={15} /> Nuevo producto
        </button>}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-7">
          <button onClick={() => setTab('products')} className={`pb-3 px-1 border-b-2 font-semibold flex items-center gap-2 ${tab === 'products' ? 'border-[#1E1A1A] text-[#1E1A1A]' : 'border-transparent text-gray-500'}`}>
            <Package size={16} /> Productos
          </button>
          <button onClick={() => setTab('packs')} className={`pb-3 px-1 border-b-2 font-semibold flex items-center gap-2 ${tab === 'packs' ? 'border-[#1E1A1A] text-[#1E1A1A]' : 'border-transparent text-gray-500'}`}>
            <Boxes size={16} /> Packs
          </button>
        </div>
      </div>

      {tab === 'packs' ? <PacksManager /> : <>
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 w-56" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {brands.length > 0 && (
          <select className="input w-40" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        <select className="input w-40" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          <option value="">Todo el stock</option>
          <option value="con_stock">Con stock</option>
          <option value="sin_stock">Sin stock</option>
        </select>
        <select className="input w-36" value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
          <option value="">Activo / Inactivo</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
        <select className="input w-40" value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
          <option value="">Visibilidad tienda</option>
          <option value="visible">Visible en tienda</option>
          <option value="hidden">Ocultos</option>
        </select>
        <select className="input w-44" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="">Ordenar por...</option>
          <option value="name_asc">Nombre A→Z</option>
          <option value="name_desc">Nombre Z→A</option>
          <option value="price_desc">Precio mayor</option>
          <option value="price_asc">Precio menor</option>
          <option value="stock_desc">Mayor stock</option>
          <option value="stock_asc">Menor stock</option>
          <option value="margin_desc">Mayor margen</option>
          <option value="margin_asc">Menor margen</option>
        </select>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayProducts.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            {products.length === 0
              ? 'Sin productos. Usa "Nuevo producto" para agregar o registra una compra.'
              : 'Sin resultados con los filtros aplicados.'}
          </div>
        )}
        {displayProducts.map(p => {
          const margin = p.unit_cost > 0 ? ((p.sale_price - p.unit_cost) / p.unit_cost * 100) : 0
          const primaryImg = p.images.find(i => i.is_primary) || p.images[0]
          return (
            <div key={p.id} className="card p-0 overflow-hidden group">
              {/* Image */}
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                {primaryImg ? (
                  <img src={primaryImg.url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Image size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                <div className="text-xs text-gray-400 font-mono mb-1">{p.sku}</div>
                <div className="flex gap-1 flex-wrap mb-2">
                  {p.category && <span className="badge badge-blue">{p.category}</span>}
                  {p.brand && <span className="badge badge-gray">{p.brand}</span>}
                  {p.benefit && <span className="badge" style={{background:'#F0FDF4',color:'#166534'}}>{p.benefit}</span>}
                </div>

                {/* Stock variants */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.variants.map(v => (
                    <span key={v.id} className={`badge ${v.stock === 0 ? 'badge-red' : v.stock <= 3 ? 'badge-yellow' : 'badge-green'}`}>
                      {v.color}: {v.stock}
                    </span>
                  ))}
                  {p.variants.length === 0 && <span className="badge badge-red">Sin stock</span>}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div>
                    <div className="font-bold text-[#1E1A1A]">{fmt(p.sale_price)}</div>
                    {p.unit_cost > 0
                      ? <div className="text-xs text-gray-400">Costo: {fmt(p.unit_cost)}</div>
                      : <div className="text-xs text-amber-500">Ref: {fmt(p.ref_cost)}</div>
                    }
                  </div>
                  <div className={`text-sm font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {margin.toFixed(1)}%
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button onClick={() => setEditing(p)} className="flex-1 btn-blue text-xs py-1.5">
                    <Edit2 size={13} className="inline mr-1" /> Editar
                  </button>
                  <button onClick={() => toggleStore(p)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={p.show_in_store ? 'Ocultar de tienda' : 'Mostrar en tienda'}>
                    {p.show_in_store ? <Eye size={15} className="text-blue-500" /> : <EyeOff size={15} className="text-gray-400" />}
                  </button>
                  <button onClick={() => del(p)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {creating && (
        <NewProductModal onClose={() => setCreating(false)} onSaved={load} />
      )}

      {editing && (
        <EditModal product={editing} onClose={() => setEditing(null)} onSaved={() => {
          getProducts({ search: search || undefined, category: cat || undefined }).then(prods => {
            setProducts(prods)
            const updated = prods.find(p => p.id === editing.id)
            if (updated) setEditing(updated)
          })
        }} />
      )}
      </>}
    </div>
  )
}
