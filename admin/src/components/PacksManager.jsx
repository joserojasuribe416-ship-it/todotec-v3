import { useEffect, useState } from 'react'
import { Boxes, Camera, Edit2, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createPack, deletePack, deletePackImage, getPacks, getProducts,
  updatePack, uploadPackImage,
} from '../api/client'

const EMPTY = {
  name: '', slug: '', subtitle: '', description: '', target_audience: '',
  benefits: '', usage_guide: '', recommendations: '', discount_percent: 10,
  is_active: true, show_in_store: true, items: [],
}

const fmt = (n) => `S/ ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const packPayload = (pack, overrides = {}) => ({
  name: pack.name,
  slug: pack.slug || '',
  subtitle: pack.subtitle || '',
  description: pack.description || '',
  target_audience: pack.target_audience || '',
  benefits: pack.benefits || '',
  usage_guide: pack.usage_guide || '',
  recommendations: pack.recommendations || '',
  discount_percent: Number(pack.discount_percent) || 0,
  is_active: Boolean(pack.is_active),
  show_in_store: Boolean(pack.show_in_store),
  items: pack.items.map(item => ({
    product_id: Number(item.product_id),
    variant_id: Number(item.variant_id),
    quantity: Math.max(1, Number(item.quantity) || 1),
  })),
  ...overrides,
})

function PackModal({ pack, products, onClose, onSaved }) {
  const [form, setForm] = useState(pack ? {
    ...pack,
    items: pack.items.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
    })),
  } : { ...EMPTY })
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const selectedProduct = products.find(product => product.id === Number(selectedProductId))
  const detailRows = form.items.map(item => {
    const product = products.find(row => row.id === Number(item.product_id))
    const variant = product?.variants.find(row => row.id === Number(item.variant_id))
    return { ...item, product, variant }
  })
  const regularPrice = detailRows.reduce((sum, row) => sum + (Number(row.product?.sale_price) || 0) * row.quantity, 0)
  const discountFactor = 1 - (Number(form.discount_percent) || 0) / 100
  const packPrice = detailRows.reduce((sum, row) => {
    const discountedUnit = Math.round((Number(row.product?.sale_price) || 0) * discountFactor * 100) / 100
    return sum + discountedUnit * row.quantity
  }, 0)
  const stock = detailRows.length
    ? Math.min(...detailRows.map(row => Math.floor((row.variant?.stock || 0) / row.quantity)))
    : 0

  const set = (field, value) => setForm(current => ({ ...current, [field]: value }))

  const addItem = () => {
    if (!selectedProduct || !selectedVariantId) return toast.error('Selecciona producto y variante')
    const variantId = Number(selectedVariantId)
    if (form.items.some(item => item.variant_id === variantId)) return toast.error('Esa variante ya está incluida')
    set('items', [...form.items, { product_id: selectedProduct.id, variant_id: variantId, quantity: 1 }])
    setSelectedProductId('')
    setSelectedVariantId('')
  }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Ingresa un nombre')
    if (form.items.length === 0) return toast.error('Agrega al menos un producto')
    setSaving(true)
    try {
      const payload = packPayload({ ...form, name: form.name.trim() })
      const saved = pack ? await updatePack(pack.id, payload) : await createPack(payload)
      toast.success(pack ? 'Pack actualizado' : 'Pack creado')
      onSaved(saved)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el pack')
    } finally {
      setSaving(false)
    }
  }

  const uploadImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !pack) return
    setUploading(true)
    try {
      await uploadPackImage(pack.id, file)
      toast.success('Imagen del pack actualizada')
      onSaved()
    } catch {
      toast.error('No se pudo subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-lg">{pack ? 'Editar pack' : 'Nuevo pack'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">El stock se calcula desde las variantes incluidas.</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-6">
          {pack && (
            <div>
              <label className="label">Imagen principal</label>
              {pack.image_url ? (
                <div className="relative h-48 rounded-lg overflow-hidden border group">
                  <img src={pack.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={async () => {
                      await deletePackImage(pack.id)
                      toast.success('Imagen eliminada')
                      onSaved()
                    }}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100"
                    title="Eliminar imagen"
                  ><Trash2 size={15} /></button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-300 hover:border-[#C49A8A] rounded-lg p-8 text-center cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
                  <Camera size={22} className="mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">{uploading ? 'Subiendo...' : 'Subir imagen del pack'}</span>
                </label>
              )}
              {pack.image_url && (
                <label className="inline-flex items-center gap-2 mt-3 text-xs text-blue-600 cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
                  <Camera size={13} /> Reemplazar imagen
                </label>
              )}
            </div>
          )}

          {!pack && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-800">
              Primero crea el pack. Luego podrás abrirlo nuevamente y subir su imagen principal.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rutina piel luminosa" />
            </div>
            <div>
              <label className="label">URL amigable</label>
              <input className="input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="Se genera automáticamente" />
            </div>
            <div className="col-span-2">
              <label className="label">Subtítulo</label>
              <input className="input" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Una rutina completa en tres pasos" />
            </div>
            <div className="col-span-2">
              <label className="label">Descripción principal</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className="label">¿Para quién es?</label>
              <textarea className="input" rows={3} value={form.target_audience} onChange={e => set('target_audience', e.target.value)} />
            </div>
            <div>
              <label className="label">Beneficios</label>
              <textarea className="input" rows={3} value={form.benefits} onChange={e => set('benefits', e.target.value)} />
            </div>
            <div>
              <label className="label">Guía de uso</label>
              <textarea className="input" rows={3} value={form.usage_guide} onChange={e => set('usage_guide', e.target.value)} />
            </div>
            <div>
              <label className="label">Recomendaciones</label>
              <textarea className="input" rows={3} value={form.recommendations} onChange={e => set('recommendations', e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-5">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="label">Producto</label>
                <select className="input" value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); setSelectedVariantId('') }}>
                  <option value="">Selecciona un producto</option>
                  {products.filter(product => product.is_active).map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="label">Variante</label>
                <select className="input" value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} disabled={!selectedProduct}>
                  <option value="">Selecciona una variante</option>
                  {(selectedProduct?.variants || []).map(variant => (
                    <option key={variant.id} value={variant.id}>{variant.color} · stock {variant.stock}</option>
                  ))}
                </select>
              </div>
              <button className="btn-blue h-[42px]" onClick={addItem}><Plus size={15} /> Agregar</button>
            </div>

            <div className="mt-4 space-y-2">
              {detailRows.map((row, index) => (
                <div key={`${row.product_id}-${row.variant_id}`} className="flex items-center gap-3 border border-gray-100 rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{row.product?.name}</div>
                    <div className="text-xs text-gray-400">{row.variant?.color} · {fmt(row.product?.sale_price)} · stock {row.variant?.stock || 0}</div>
                  </div>
                  <div className="w-28">
                    <label className="label">Cantidad</label>
                    <input
                      type="number" min="1" className="input"
                      value={row.quantity}
                      onChange={e => set('items', form.items.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, Number(e.target.value) || 1) } : item))}
                    />
                  </div>
                  <button
                    onClick={() => set('items', form.items.filter((_, itemIndex) => itemIndex !== index))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                    title="Quitar producto"
                  ><Trash2 size={15} /></button>
                </div>
              ))}
              {detailRows.length === 0 && <div className="text-sm text-gray-400 text-center py-8 border border-dashed rounded-lg">Agrega los productos que componen el pack.</div>}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 bg-gray-50 border rounded-lg p-4">
            <div>
              <label className="label">Descuento</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="95" step="0.5" className="input" value={form.discount_percent} onChange={e => set('discount_percent', e.target.value)} />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div><div className="label">Precio normal</div><div className="font-semibold">{fmt(regularPrice)}</div></div>
            <div><div className="label">Precio pack</div><div className="font-semibold text-green-700">{fmt(packPrice)}</div></div>
            <div><div className="label">Stock disponible</div><div className="font-semibold">{stock} packs</div></div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="accent-[#1E1A1A]" />
              Pack activo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.show_in_store} onChange={e => set('show_in_store', e.target.checked)} className="accent-[#1E1A1A]" />
              Visible en tienda
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar pack'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PacksManager() {
  const [packs, setPacks] = useState([])
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = () => Promise.all([getPacks(), getProducts()]).then(([packRows, productRows]) => {
    setPacks(packRows)
    setProducts(productRows)
  })
  useEffect(() => { load() }, [])

  const remove = async (pack) => {
    if (!confirm(`¿Eliminar el pack "${pack.name}"?`)) return
    await deletePack(pack.id)
    toast.success('Pack eliminado')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Packs promocionales</h2>
          <p className="text-sm text-gray-500">{packs.length} pack{packs.length !== 1 ? 's' : ''} configurado{packs.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-blue" onClick={() => setCreating(true)}><Plus size={15} /> Nuevo pack</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packs.map(pack => (
          <div key={pack.id} className="card p-0 overflow-hidden">
            <div className="h-40 bg-gray-100">
              {pack.image_url
                ? <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><Boxes size={36} /></div>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{pack.name}</div>
                  <div className="text-xs text-gray-400">/packs/{pack.slug}</div>
                </div>
                <span className={`badge ${pack.is_active && pack.show_in_store ? 'badge-green' : 'badge-gray'}`}>
                  {pack.is_active && pack.show_in_store ? 'Publicado' : 'Oculto'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {pack.items.map(item => <span key={item.id} className="badge badge-gray">{item.product_name} × {item.quantity}</span>)}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                <div><div className="text-xs text-gray-400">Normal</div><div className="line-through">{fmt(pack.regular_price)}</div></div>
                <div><div className="text-xs text-gray-400">Pack</div><div className="font-bold text-green-700">{fmt(pack.pack_price)}</div></div>
                <div><div className="text-xs text-gray-400">Stock</div><div className="font-semibold">{pack.available_stock}</div></div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <button className="btn-blue flex-1 text-xs" onClick={() => setEditing(pack)}><Edit2 size={13} /> Editar</button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title={pack.show_in_store ? 'Ocultar' : 'Mostrar'}
                  onClick={async () => {
                    await updatePack(pack.id, packPayload(pack, { show_in_store: !pack.show_in_store }))
                    load()
                  }}
                >{pack.show_in_store ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                <button className="p-2 text-red-400 hover:bg-red-50 rounded-lg" onClick={() => remove(pack)}><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
        {packs.length === 0 && <div className="col-span-full py-16 text-center text-gray-400">Todavía no hay packs. Crea el primero para promocionarlo en la tienda.</div>}
      </div>

      {(creating || editing) && (
        <PackModal
          pack={editing}
          products={products}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={load}
        />
      )}
    </div>
  )
}
