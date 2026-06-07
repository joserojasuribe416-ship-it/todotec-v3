import { useEffect, useState } from 'react'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/client'
import { Plus, Search, Edit2, Trash2, Star, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', email: '', email2: '', phone: '', phone2: '', description: '', city: '', rating: 5 }

function Modal({ title, data, onChange, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Nombre del proveedor" />
          </div>

          {/* Emails */}
          <div>
            <label className="label">Email principal *</label>
            <input className="input" value={data.email} onChange={e => onChange('email', e.target.value)} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label className="label">Email secundario <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input className="input" value={data.email2 || ''} onChange={e => onChange('email2', e.target.value)} placeholder="email2@ejemplo.com" />
          </div>

          {/* Phones */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Celular principal *</label>
              <input className="input" value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+51 999 999 999" />
            </div>
            <div>
              <label className="label">Celular secundario <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
              <input className="input" value={data.phone2 || ''} onChange={e => onChange('phone2', e.target.value)} placeholder="+51 888 888 888" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ciudad</label>
              <input className="input" value={data.city} onChange={e => onChange('city', e.target.value)} placeholder="Lima, Shenzhen..." />
            </div>
            <div>
              <label className="label">Rating (1-5)</label>
              <input className="input" type="number" min="1" max="5" step="0.5" value={data.rating} onChange={e => onChange('rating', parseFloat(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={3} value={data.description} onChange={e => onChange('description', e.target.value)} placeholder="Descripción del proveedor..." />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={onSave} disabled={!data.name}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

export default function Proveedores() {
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'create'|'edit', data, id? }

  const load = (s) => getSuppliers(s || undefined).then(setSuppliers)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const openCreate = () => setModal({ mode: 'create', data: { ...EMPTY } })
  const openEdit = (s) => setModal({ mode: 'edit', data: { ...s }, id: s.id })
  const setField = (k, v) => setModal(m => ({ ...m, data: { ...m.data, [k]: v } }))

  const save = async () => {
    try {
      if (modal.mode === 'create') {
        await createSupplier(modal.data)
        toast.success('Proveedor creado')
      } else {
        await updateSupplier(modal.id, modal.data)
        toast.success('Proveedor actualizado')
      }
      setModal(null)
      load(search)
    } catch (e) {
      toast.error('Error al guardar')
    }
  }

  const remove = async (id, name) => {
    if (!confirm(`¿Eliminar a ${name}?`)) return
    await deleteSupplier(id)
    toast.success('Proveedor eliminado')
    load(search)
  }

  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500">{suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={openCreate}>
          <Plus size={18} /> Agregar Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar proveedor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="table-th">Proveedor</th>
              <th className="table-th">Ciudad</th>
              <th className="table-th">Contacto</th>
              <th className="table-th">Rating</th>
              <th className="table-th">Descripción</th>
              <th className="table-th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {suppliers.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin proveedores. Agrega el primero.</td></tr>
            )}
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td">
                  <div className="font-medium text-gray-900">{s.name}</div>
                </td>
                <td className="table-td">{s.city || '—'}</td>
                <td className="table-td">
                  <div className="text-xs">{s.email || '—'}</div>
                  {s.email2 && <div className="text-xs text-gray-400">{s.email2}</div>}
                  <div className="text-xs text-gray-500 mt-0.5">{s.phone || ''}</div>
                  {s.phone2 && <div className="text-xs text-gray-400">{s.phone2}</div>}
                </td>
                <td className="table-td">
                  <span className="text-yellow-500 text-sm">{stars(s.rating)}</span>
                  <span className="text-xs text-gray-400 ml-1">{s.rating}</span>
                </td>
                <td className="table-td max-w-xs truncate text-gray-500">{s.description || '—'}</td>
                <td className="table-td">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => remove(s.id, s.name)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
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
          title={modal.mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
          data={modal.data}
          onChange={setField}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
