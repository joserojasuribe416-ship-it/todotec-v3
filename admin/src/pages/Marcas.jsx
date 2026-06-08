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
            <input className="input" value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Ej: COSRX, Laneige..." />
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

export default function Marcas() {
  const [brands, setBrands] = useState([])
  const [modal, setModal] = useState(null)

  const load = () => api.get('/brands/all').then(r => setBrands(r.data))

  useEffect(() => { load() }, [])

  const openCreate = () => setModal({ mode: 'create', data: { ...EMPTY } })
  const openEdit = (b) => setModal({ mode: 'edit', data: { name: b.name, description: b.description, order: b.order }, id: b.id })
  const setField = (k, v) => setModal(m => ({ ...m, data: { ...m.data, [k]: v } }))

  const save = async () => {
    try {
      if (modal.mode === 'create') {
        await api.post('/brands', modal.data)
        toast.success('Marca creada')
      } else {
        await api.put(`/brands/${modal.id}`, modal.data)
        toast.success('Marca actualizada')
      }
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    }
  }

  const toggleActive = async (brand) => {
    await api.put(`/brands/${brand.id}`, { is_active: !brand.is_active })
    toast.success(brand.is_active ? 'Marca ocultada' : 'Marca activada')
    load()
  }

  const remove = async (brand) => {
    if (!confirm(`¿Eliminar "${brand.name}"?`)) return
    await api.delete(`/brands/${brand.id}`)
    toast.success('Marca eliminada')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
          <p className="text-sm text-gray-500">
            {brands.filter(b => b.is_active).length} activas · aparecen como opciones al registrar productos
          </p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={openCreate}>
          <Plus size={18} /> Nueva Marca
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-[#1E1A1A] flex items-center gap-2">
        <span className="font-bold">💡</span>
        Las marcas activas aparecen en el selector al registrar compras y editar productos en el inventario.
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
            {brands.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Cargando marcas...</td></tr>
            )}
            {brands.map(brand => (
              <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <span className="text-gray-400 font-mono text-xs">{brand.order}</span>
                </td>
                <td className="table-td">
                  <span className="font-semibold text-gray-900">{brand.name}</span>
                </td>
                <td className="table-td text-gray-500 text-xs">{brand.description || '—'}</td>
                <td className="table-td">
                  {brand.is_active
                    ? <span className="badge badge-green">Activa</span>
                    : <span className="badge badge-gray">Oculta</span>}
                </td>
                <td className="table-td">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => toggleActive(brand)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={brand.is_active ? 'Ocultar' : 'Activar'}>
                      {brand.is_active ? <Eye size={15} className="text-blue-500" /> : <EyeOff size={15} className="text-gray-400" />}
                    </button>
                    <button onClick={() => openEdit(brand)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => remove(brand)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
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
          title={modal.mode === 'create' ? 'Nueva Marca' : 'Editar Marca'}
          data={modal.data}
          onChange={setField}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
