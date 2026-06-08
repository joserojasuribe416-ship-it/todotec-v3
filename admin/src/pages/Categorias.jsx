import { useEffect, useState } from 'react'
import api from '../api/client'
import { Plus, Edit2, Trash2, X, GripVertical, Eye, EyeOff } from 'lucide-react'
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
            <input className="input" value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Ej: Monitores" />
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

export default function Categorias() {
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(null)

  const load = () => api.get('/categories/all').then(r => setCategories(r.data))

  useEffect(() => { load() }, [])

  const openCreate = () => setModal({ mode: 'create', data: { ...EMPTY } })
  const openEdit = (c) => setModal({ mode: 'edit', data: { name: c.name, description: c.description, order: c.order }, id: c.id })
  const setField = (k, v) => setModal(m => ({ ...m, data: { ...m.data, [k]: v } }))

  const save = async () => {
    try {
      if (modal.mode === 'create') {
        await api.post('/categories', modal.data)
        toast.success('Categoría creada')
      } else {
        await api.put(`/categories/${modal.id}`, modal.data)
        toast.success('Categoría actualizada')
      }
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    }
  }

  const toggleActive = async (cat) => {
    await api.put(`/categories/${cat.id}`, { is_active: !cat.is_active })
    toast.success(cat.is_active ? 'Categoría ocultada' : 'Categoría activada')
    load()
  }

  const remove = async (cat) => {
    if (!confirm(`¿Eliminar "${cat.name}"?`)) return
    await api.delete(`/categories/${cat.id}`)
    toast.success('Categoría eliminada')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500">
            {categories.filter(c => c.is_active).length} activas · estas categorías aparecen en la tienda online y el buscador
          </p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={openCreate}>
          <Plus size={18} /> Nueva Categoría
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-[#1E1A1A] flex items-center gap-2">
        <span className="font-bold">💡</span>
        Las categorías activas aparecen automáticamente en la tienda online, el buscador y el panel de navegación.
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
            {categories.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Cargando categorías...</td></tr>
            )}
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <span className="text-gray-400 font-mono text-xs">{cat.order}</span>
                </td>
                <td className="table-td">
                  <span className="font-semibold text-gray-900">{cat.name}</span>
                </td>
                <td className="table-td text-gray-500 text-xs">{cat.description || '—'}</td>
                <td className="table-td">
                  {cat.is_active
                    ? <span className="badge badge-green">Activa</span>
                    : <span className="badge badge-gray">Oculta</span>}
                </td>
                <td className="table-td">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => toggleActive(cat)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={cat.is_active ? 'Ocultar' : 'Activar'}>
                      {cat.is_active ? <Eye size={15} className="text-blue-500" /> : <EyeOff size={15} className="text-gray-400" />}
                    </button>
                    <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => remove(cat)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
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
          title={modal.mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
          data={modal.data}
          onChange={setField}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
