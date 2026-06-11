import { useEffect, useState } from 'react'
import api from '../api/client'
import { Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', order: 0 }

function Modal({ title, data, onChange, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Ej: Anti-manchas" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <input className="input" value={data.description} onChange={e => onChange('description', e.target.value)} placeholder="Descripción opcional..." />
          </div>
          <div>
            <label className="label">Orden (menor = primero)</label>
            <input className="input" type="number" min="0" value={data.order} onChange={e => onChange('order', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={onSave} disabled={!data.name.trim()}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

function TabContent({ tab, items, onCreate, onEdit, onToggle, onDelete, modal, onModalChange, onSave, onModalClose, resourceName, apiPath }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 capitalize">{resourceName}s</h2>
          <p className="text-sm text-gray-500">
            {items.filter(i => i.is_active).length} activas
          </p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={onCreate}>
          <Plus size={18} /> Nueva {resourceName}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-[#1E1A1A] flex items-center gap-2">
        <span className="font-bold">💡</span>
        Las {resourceName.toLowerCase()}s activas aparecen en la tienda online y el catálogo.
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="table-th">Orden</th>
              <th className="table-th">Nombre</th>
              <th className="table-th">Descripción</th>
              <th className="table-th">Estado</th>
              <th className="table-th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <span className="text-gray-400 font-mono text-xs">{item.order}</span>
                </td>
                <td className="table-td">
                  <span className="font-semibold text-gray-900">{item.name}</span>
                </td>
                <td className="table-td text-gray-500 text-xs">{item.description || '—'}</td>
                <td className="table-td">
                  {item.is_active
                    ? <span className="badge badge-green">Activa</span>
                    : <span className="badge badge-gray">Oculta</span>}
                </td>
                <td className="table-td">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onToggle(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={item.is_active ? 'Ocultar' : 'Activar'}>
                      {item.is_active ? <Eye size={15} className="text-blue-500" /> : <EyeOff size={15} className="text-gray-400" />}
                    </button>
                    <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(item)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? `Nueva ${resourceName}` : `Editar ${resourceName}`}
          data={modal.data}
          onChange={onModalChange}
          onSave={onSave}
          onClose={onModalClose}
        />
      )}
    </div>
  )
}

export default function Etiquetas() {
  const [tab, setTab] = useState('categories')
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [necessities, setNecessities] = useState([])
  const [modal, setModal] = useState(null)

  // ── Categorías ───────────────────────────────────────────────────────
  const loadCategories = () => api.get('/categories/all').then(r => setCategories(r.data))
  const openCreateCategory = () => setModal({ mode: 'create', data: { ...EMPTY }, resource: 'categories' })
  const openEditCategory = (c) => setModal({ mode: 'edit', data: { name: c.name, description: c.description, order: c.order }, id: c.id, resource: 'categories' })
  const toggleCategoryActive = async (cat) => {
    await api.put(`/categories/${cat.id}`, { is_active: !cat.is_active })
    toast.success(cat.is_active ? 'Categoría ocultada' : 'Categoría activada')
    loadCategories()
  }
  const deleteCategory = async (cat) => {
    if (!confirm(`¿Eliminar "${cat.name}"?`)) return
    await api.delete(`/categories/${cat.id}`)
    toast.success('Categoría eliminada')
    loadCategories()
  }

  // ── Marcas ───────────────────────────────────────────────────────────
  const loadBrands = () => api.get('/brands/all').then(r => setBrands(r.data))
  const openCreateBrand = () => setModal({ mode: 'create', data: { ...EMPTY }, resource: 'brands' })
  const openEditBrand = (b) => setModal({ mode: 'edit', data: { name: b.name, description: b.description, order: b.order }, id: b.id, resource: 'brands' })
  const toggleBrandActive = async (brand) => {
    await api.put(`/brands/${brand.id}`, { is_active: !brand.is_active })
    toast.success(brand.is_active ? 'Marca ocultada' : 'Marca activada')
    loadBrands()
  }
  const deleteBrand = async (brand) => {
    if (!confirm(`¿Eliminar "${brand.name}"?`)) return
    await api.delete(`/brands/${brand.id}`)
    toast.success('Marca eliminada')
    loadBrands()
  }

  // ── Necesidades ──────────────────────────────────────────────────────
  const loadNecessities = () => api.get('/necessities/all').then(r => setNecessities(r.data))
  const openCreateNecessity = () => setModal({ mode: 'create', data: { ...EMPTY }, resource: 'necessities' })
  const openEditNecessity = (n) => setModal({ mode: 'edit', data: { name: n.name, description: n.description, order: n.order }, id: n.id, resource: 'necessities' })
  const toggleNecessityActive = async (necessity) => {
    await api.put(`/necessities/${necessity.id}`, { is_active: !necessity.is_active })
    toast.success(necessity.is_active ? 'Necesidad ocultada' : 'Necesidad activada')
    loadNecessities()
  }
  const deleteNecessity = async (necessity) => {
    if (!confirm(`¿Eliminar "${necessity.name}"?`)) return
    await api.delete(`/necessities/${necessity.id}`)
    toast.success('Necesidad eliminada')
    loadNecessities()
  }

  // ── Modal ────────────────────────────────────────────────────────────
  const setField = (k, v) => setModal(m => ({ ...m, data: { ...m.data, [k]: v } }))

  const save = async () => {
    try {
      const path = `/${modal.resource}`
      if (modal.mode === 'create') {
        await api.post(path, modal.data)
        toast.success('Creado exitosamente')
      } else {
        await api.put(`${path}/${modal.id}`, modal.data)
        toast.success('Actualizado exitosamente')
      }
      setModal(null)
      if (modal.resource === 'categories') loadCategories()
      else if (modal.resource === 'brands') loadBrands()
      else if (modal.resource === 'necessities') loadNecessities()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    }
  }

  // ── Load data ────────────────────────────────────────────────────────
  useEffect(() => {
    loadCategories()
    loadBrands()
    loadNecessities()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
        <p className="text-sm text-gray-500">
          Gestiona las categorías, marcas y necesidades de tus productos
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setTab('categories')}
            className={`pb-3 px-1 border-b-2 font-semibold transition-colors ${
              tab === 'categories'
                ? 'border-[#1E1A1A] text-[#1E1A1A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Categorías
          </button>
          <button
            onClick={() => setTab('brands')}
            className={`pb-3 px-1 border-b-2 font-semibold transition-colors ${
              tab === 'brands'
                ? 'border-[#1E1A1A] text-[#1E1A1A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Marcas
          </button>
          <button
            onClick={() => setTab('necessities')}
            className={`pb-3 px-1 border-b-2 font-semibold transition-colors ${
              tab === 'necessities'
                ? 'border-[#1E1A1A] text-[#1E1A1A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Necesidades
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'categories' && (
        <TabContent
          tab={tab}
          items={categories}
          onCreate={openCreateCategory}
          onEdit={openEditCategory}
          onToggle={toggleCategoryActive}
          onDelete={deleteCategory}
          modal={modal?.resource === 'categories' ? modal : null}
          onModalChange={setField}
          onSave={save}
          onModalClose={() => setModal(null)}
          resourceName="Categoría"
        />
      )}

      {tab === 'brands' && (
        <TabContent
          tab={tab}
          items={brands}
          onCreate={openCreateBrand}
          onEdit={openEditBrand}
          onToggle={toggleBrandActive}
          onDelete={deleteBrand}
          modal={modal?.resource === 'brands' ? modal : null}
          onModalChange={setField}
          onSave={save}
          onModalClose={() => setModal(null)}
          resourceName="Marca"
        />
      )}

      {tab === 'necessities' && (
        <TabContent
          tab={tab}
          items={necessities}
          onCreate={openCreateNecessity}
          onEdit={openEditNecessity}
          onToggle={toggleNecessityActive}
          onDelete={deleteNecessity}
          modal={modal?.resource === 'necessities' ? modal : null}
          onModalChange={setField}
          onSave={save}
          onModalClose={() => setModal(null)}
          resourceName="Necesidad"
        />
      )}
    </div>
  )
}
