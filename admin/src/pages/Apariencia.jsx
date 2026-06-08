import { useEffect, useState } from 'react'
import api from '../api/client'
import { getProducts } from '../api/client'
import { Save, Image, X, Trash2, Search, GripVertical, Eye, EyeOff, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Announcement ─────────────────────────────────────────────────────────────
function AnnouncementSection() {
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get('/appearance/announcement').then(r => { setText(r.data.announcement_text); setLoaded(true) })
  }, [])

  const save = async () => {
    await api.put('/appearance/announcement', { announcement_text: text })
    toast.success('Texto actualizado')
  }

  if (!loaded) return null

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-bold text-[#1E1A1A]">Barra de anuncio</h2>
        <p className="text-xs text-gray-400 mt-0.5">Texto que aparece en la franja superior de la tienda.</p>
      </div>
      <div className="flex gap-3">
        <input
          className="input flex-1"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Envío gratis por compras desde S/200"
        />
        <button className="btn-blue flex items-center gap-2" onClick={save}>
          <Save size={15} /> Guardar
        </button>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div style={{ background: '#EEC5C5', textAlign: 'center', padding: '7px 16px', fontSize: 11, color: '#1E1A1A', fontStyle: 'italic' }}>
          {text || 'Envío gratis por compras desde S/200'}
        </div>
      </div>
    </div>
  )
}


// ── Banners ───────────────────────────────────────────────────────────────────
function BannerEditModal({ banner, onClose, onSaved }) {
  const [form, setForm] = useState({
    tag: banner.tag, title: banner.title, subtitle: banner.subtitle,
    cta: banner.cta, href: banner.href,
    bg: banner.bg, text_bg: banner.text_bg, text_color: banner.text_color,
    tag_color: banner.tag_color, cta_bg: banner.cta_bg, cta_color: banner.cta_color,
  })
  const [uploading, setUploading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    await api.put(`/appearance/banners/${banner.id}`, form)
    toast.success('Banner guardado')
    onSaved(); onClose()
  }

  const uploadImg = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.post(`/appearance/banners/${banner.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Imagen subida')
      onSaved()
    } catch { toast.error('Error al subir imagen') }
    finally { setUploading(false) }
  }

  const removeImg = async () => {
    await api.delete(`/appearance/banners/${banner.id}/image`)
    toast.success('Imagen eliminada')
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h3 className="font-bold text-lg">Editar Banner</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">

          {/* Image */}
          <div>
            <label className="label">Imagen del banner</label>
            {banner.image_url ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                <button onClick={removeImg} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={uploadImg} disabled={uploading} />
                <div className="border-2 border-dashed border-gray-300 hover:border-[#EEC5C5] rounded-xl p-6 text-center transition-colors">
                  <Image size={22} className="mx-auto mb-2 text-gray-400" />
                  <span className="text-sm text-gray-500">{uploading ? 'Subiendo...' : 'Haz clic para subir imagen'}</span>
                  <p className="text-xs text-gray-400 mt-1">Si no hay imagen se muestra la decoración de botellas</p>
                </div>
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Etiqueta (tag)</label>
              <input className="input" value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="Ej: Korean Skincare" />
            </div>
            <div>
              <label className="label">Link del botón (href)</label>
              <input className="input" value={form.href} onChange={e => set('href', e.target.value)} placeholder="/catalog" />
            </div>
            <div className="col-span-2">
              <label className="label">Título (usa \n para salto de línea)</label>
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Tu rutina\ncoreana" />
            </div>
            <div className="col-span-2">
              <label className="label">Subtítulo</label>
              <input className="input" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} />
            </div>
            <div>
              <label className="label">Texto del botón CTA</label>
              <input className="input" value={form.cta} onChange={e => set('cta', e.target.value)} placeholder="Ver catálogo" />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="label">Vista previa</label>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <div style={{ background: form.bg, height: 80, display: 'flex', alignItems: 'flex-end', padding: '12px 16px', position: 'relative' }}>
                {banner.image_url && <img src={banner.image_url} alt="" style={{ position: 'absolute', right: 16, bottom: 0, height: 70, objectFit: 'contain' }} />}
                <div>
                  <div style={{ fontSize: 8, color: form.tag_color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 2 }}>{form.tag}</div>
                  <div style={{ fontSize: 14, color: form.text_color, fontWeight: 300, textTransform: 'uppercase', whiteSpace: 'pre-line' }}>{form.title}</div>
                </div>
              </div>
              <div style={{ background: form.text_bg, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: form.text_color, opacity: 0.6 }}>{form.subtitle}</div>
                <div style={{ background: form.cta_bg, color: form.cta_color, fontSize: 9, fontWeight: 600, padding: '5px 12px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {form.cta}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save}>Guardar banner</button>
        </div>
      </div>
    </div>
  )
}

function BannersSection() {
  const [banners, setBanners] = useState([])
  const [editing, setEditing] = useState(null)

  const load = () => api.get('/appearance/banners/all').then(r => setBanners(r.data))
  useEffect(() => { load() }, [])

  const toggle = async (b) => {
    await api.put(`/appearance/banners/${b.id}`, { is_active: !b.is_active })
    toast.success(b.is_active ? 'Banner ocultado' : 'Banner activado')
    load()
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-bold text-[#1E1A1A]">Banners del carrusel</h2>
        <p className="text-xs text-gray-400 mt-0.5">Los banners activos aparecen en el carrusel de la homepage. Se muestran 3 a la vez.</p>
      </div>

      <div className="space-y-2">
        {banners.map(b => (
          <div key={b.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
            {/* Color preview */}
            <div style={{ width: 44, height: 44, borderRadius: 8, background: b.bg, flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
              {b.image_url && <img src={b.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">{b.title.replace(/\n/g, ' ')}</div>
              <div className="text-xs text-gray-400 truncate">{b.tag} · {b.cta}</div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {b.is_active ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Oculto</span>}
              <button onClick={() => toggle(b)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                {b.is_active ? <Eye size={15} className="text-blue-500" /> : <EyeOff size={15} className="text-gray-400" />}
              </button>
              <button onClick={() => setEditing(b)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                <Image size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <BannerEditModal
          banner={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { load(); api.get('/appearance/banners/all').then(r => { const updated = r.data.find(b => b.id === editing.id); if (updated) setEditing(updated) }) }}
        />
      )}
    </div>
  )
}


// ── Homepage sections ─────────────────────────────────────────────────────────
function ProductPicker({ selectedIds, onChange }) {
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => { getProducts({ store_only: 'true' }).then(setProducts) }, [])

  const filtered = products.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase())
  )

  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(i => i !== id))
    else onChange([...selectedIds, id])
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const arr = [...selectedIds]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    onChange(arr)
  }

  const moveDown = (idx) => {
    if (idx === selectedIds.length - 1) return
    const arr = [...selectedIds]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    onChange(arr)
  }

  const selectedProducts = selectedIds.map(id => products.find(p => p.id === id)).filter(Boolean)

  return (
    <div className="space-y-3">
      {/* Selected list */}
      {selectedProducts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seleccionados ({selectedProducts.length})</p>
          <div className="space-y-1.5">
            {selectedProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400 w-4 text-center font-mono">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate block">{p.name}</span>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => moveUp(idx)} className="p-1 hover:bg-blue-200 rounded text-gray-500 text-xs">↑</button>
                  <button onClick={() => moveDown(idx)} className="p-1 hover:bg-blue-200 rounded text-gray-500 text-xs">↓</button>
                  <button onClick={() => toggle(p.id)} className="p-1 hover:bg-red-100 rounded text-red-400">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & add */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Agregar producto</p>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar en inventario..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-1">
          {filtered.length === 0 && <div className="text-xs text-gray-400 text-center py-4">Sin resultados</div>}
          {filtered.map(p => {
            const selected = selectedIds.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {selected && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-sm text-gray-800 truncate">{p.name}</span>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">Stock: {p.total_stock}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HomepageSections() {
  const [sections, setSections] = useState([])
  const [saving, setSaving] = useState({})

  const load = () => api.get('/appearance/sections').then(r => setSections(r.data))
  useEffect(() => { load() }, [])

  const updateSection = (key, field, value) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s))
  }

  const save = async (section) => {
    setSaving(s => ({ ...s, [section.key]: true }))
    try {
      await api.put(`/appearance/sections/${section.key}`, {
        title: section.title,
        subtitle: section.subtitle,
        product_ids: section.product_ids || [],
        max_items: section.max_items,
      })
      toast.success(`Sección "${section.title}" guardada`)
    } catch { toast.error('Error al guardar') }
    finally { setSaving(s => ({ ...s, [section.key]: false })) }
  }

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section.key} className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#1E1A1A]">Sección: {section.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Elige qué productos aparecen en esta sección de la homepage.</p>
            </div>
            <button
              className="btn-blue flex items-center gap-2"
              onClick={() => save(section)}
              disabled={saving[section.key]}
            >
              <Save size={15} /> {saving[section.key] ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Título de la sección</label>
              <input className="input" value={section.title} onChange={e => updateSection(section.key, 'title', e.target.value)} />
            </div>
            <div>
              <label className="label">Subtítulo / etiqueta</label>
              <input className="input" value={section.subtitle} onChange={e => updateSection(section.key, 'subtitle', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Productos ({(section.product_ids || []).length} seleccionados)</label>
            <ProductPicker
              selectedIds={section.product_ids || []}
              onChange={(ids) => updateSection(section.key, 'product_ids', ids)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}


// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'announcement', label: 'Barra de anuncio' },
  { key: 'banners', label: 'Banners carrusel' },
  { key: 'homepage', label: 'Secciones homepage' },
]

export default function Apariencia() {
  const [tab, setTab] = useState('announcement')

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apariencia Tienda</h1>
        <p className="text-sm text-gray-500">Personaliza el contenido visible de la tienda online</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow text-[#1E1A1A]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'announcement' && <AnnouncementSection />}
      {tab === 'banners' && <BannersSection />}
      {tab === 'homepage' && <HomepageSections />}
    </div>
  )
}
