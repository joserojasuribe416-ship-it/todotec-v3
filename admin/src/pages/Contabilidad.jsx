import { useEffect, useState } from 'react'
import { getIncomeStatement, getBalanceSheet, getCapital, addCapital, deleteCapital, getEntries } from '../api/client'
import api from '../api/client'
import { Plus, Trash2, X, TrendingUp, Scale, BookOpen, RotateCcw, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

function CapitalModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ contributor: 'Socio', amount: '', description: '' })
  const save = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Monto inválido'); return }
    try {
      await addCapital({ ...form, amount: parseFloat(form.amount) })
      toast.success('Capital registrado')
      onSaved()
      onClose()
    } catch { toast.error('Error al guardar') }
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg">Agregar Capital</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Socio / Aportante</label>
            <input className="input" value={form.contributor} onChange={e => setForm(f => ({ ...f, contributor: e.target.value }))} />
          </div>
          <div>
            <label className="label">Monto (S/) *</label>
            <input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción opcional..." />
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-[#1E3A8A]">
            <strong>Asiento automático:</strong><br />
            Débito: Efectivo | Crédito: Capital Social
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={save}>Registrar Aporte</button>
        </div>
      </div>
    </div>
  )
}

export default function Contabilidad() {
  const [tab, setTab] = useState('pyl')
  const [pyl, setPyl] = useState(null)
  const [balance, setBalance] = useState(null)
  const [capital, setCapital] = useState([])
  const [entries, setEntries] = useState([])
  const [showCapital, setShowCapital] = useState(false)

  const loadAll = () => {
    getIncomeStatement().then(setPyl)
    getBalanceSheet().then(setBalance)
    getCapital().then(setCapital)
    getEntries().then(setEntries)
  }

  useEffect(() => { loadAll() }, [])

  const delCapital = async (id) => {
    if (!confirm('¿Eliminar este aporte?')) return
    await deleteCapital(id)
    toast.success('Aporte eliminado')
    loadAll()
  }

  const resetBalance = async () => {
    if (!confirm('⚠️ ¿Resetear el balance? Esto eliminará TODOS los asientos contables, aportes de capital y reiniciará el correlativo de facturas. Esta acción no se puede deshacer.')) return
    try {
      await api.post('/accounting/reset')
      toast.success('Balance reseteado correctamente')
      loadAll()
    } catch { toast.error('Error al resetear') }
  }

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  const TABS = [
    { id: 'pyl', label: 'P&L', icon: TrendingUp },
    { id: 'balance', label: 'Balance General', icon: Scale },
    { id: 'capital', label: 'Capital', icon: Plus },
    { id: 'entries', label: 'Asientos', icon: BookOpen },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contabilidad</h1>
          <p className="text-sm text-gray-500">Estados financieros y registros contables</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50" onClick={resetBalance}>
            <RotateCcw size={15} /> Resetear balance
          </button>
          <button className="btn-blue flex items-center gap-2" onClick={() => setShowCapital(true)}>
            <Plus size={18} /> Agregar Capital
          </button>
        </div>
      </div>

      {/* Cash indicator */}
      {balance && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${balance.activos.efectivo > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          <AlertTriangle size={16} />
          Efectivo disponible en caja: <span className="text-base font-bold">S/ {(balance.activos.efectivo || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
          {balance.activos.efectivo === 0 && <span className="ml-2">— Sin efectivo. Agrega capital antes de comprar al contado.</span>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'border-[#FFD100] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* P&L */}
      {tab === 'pyl' && pyl && (
        <div className="max-w-xl">
          <div className="card">
            <h2 className="font-bold text-[#1E3A8A] text-lg mb-6 text-center">Estado de Ganancias y Pérdidas</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-700 font-medium">Ventas totales</span>
                <span className="font-bold text-gray-900">{fmt(pyl.ventas)}</span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-gray-700">(-) Costo de ventas</span>
                <span className="text-red-600">({fmt(pyl.costo_ventas)})</span>
              </div>
              <div className="flex justify-between py-3 border-t bg-blue-50 px-3 rounded-lg">
                <span className="font-bold text-[#1E3A8A]">Utilidad Bruta</span>
                <span className="font-bold text-[#1E3A8A] text-lg">{fmt(pyl.utilidad_bruta)}</span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-gray-700">(-) Gastos operativos</span>
                <span className="text-red-600">({fmt(pyl.gastos)})</span>
              </div>
              <div className={`flex justify-between py-3 border-t px-3 rounded-lg ${pyl.utilidad_neta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className="font-bold">Utilidad Neta</span>
                <span className={`font-bold text-xl ${pyl.utilidad_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(pyl.utilidad_neta)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance */}
      {tab === 'balance' && balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className="card">
            <h3 className="font-bold text-[#1E3A8A] mb-4">ACTIVOS</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Efectivo</span>
                <span className="font-semibold">{fmt(balance.activos.efectivo)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Inventarios</span>
                <span className="font-semibold">{fmt(balance.activos.inventarios)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Cuentas por Cobrar</span>
                <span className="font-semibold">{fmt(balance.activos.cuentas_por_cobrar)}</span>
              </div>
              <div className="flex justify-between py-3 border-t bg-[#1E3A8A] text-white px-3 rounded-lg">
                <span className="font-bold">Total Activos</span>
                <span className="font-bold">{fmt(balance.activos.total)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold text-[#1E3A8A] mb-4">PASIVOS</h3>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Cuentas por Pagar</span>
                <span className="font-semibold">{fmt(balance.pasivos.cuentas_por_pagar)}</span>
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-[#1E3A8A] mb-4">PATRIMONIO</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Capital Social</span>
                  <span className="font-semibold">{fmt(balance.patrimonio.capital_social)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Utilidades Acumuladas</span>
                  <span className="font-semibold">{fmt(balance.patrimonio.utilidades_acumuladas)}</span>
                </div>
                <div className="flex justify-between py-3 border-t bg-yellow-50 px-3 rounded-lg">
                  <span className="font-bold text-[#1E3A8A]">Total Patrimonio</span>
                  <span className="font-bold text-[#1E3A8A]">{fmt(balance.patrimonio.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capital */}
      {tab === 'capital' && (
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total aportado: <strong className="text-[#1E3A8A]">{fmt(capital.reduce((s, c) => s + c.amount, 0))}</strong>
            </div>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-th">Fecha</th>
                  <th className="table-th">Aportante</th>
                  <th className="table-th">Descripción</th>
                  <th className="table-th text-right">Monto</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {capital.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin aportes registrados</td></tr>
                )}
                {capital.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-td">{new Date(c.contribution_date).toLocaleDateString('es-PE')}</td>
                    <td className="table-td font-medium">{c.contributor}</td>
                    <td className="table-td text-gray-500">{c.description || '—'}</td>
                    <td className="table-td text-right font-bold text-[#1E3A8A]">{fmt(c.amount)}</td>
                    <td className="table-td">
                      <button onClick={() => delCapital(c.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entries */}
      {tab === 'entries' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Fecha</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Descripción</th>
                <th className="table-th">Débito</th>
                <th className="table-th">Crédito</th>
                <th className="table-th text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin asientos contables</td></tr>
              )}
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 text-sm">
                  <td className="table-td">{new Date(e.entry_date).toLocaleDateString('es-PE')}</td>
                  <td className="table-td">
                    <span className={`badge ${e.entry_type === 'venta' ? 'badge-green' : e.entry_type === 'capital' ? 'badge-blue' : e.entry_type === 'cogs' ? 'badge-red' : 'badge-yellow'}`}>
                      {e.entry_type}
                    </span>
                  </td>
                  <td className="table-td text-gray-600">{e.description}</td>
                  <td className="table-td text-green-700 font-medium">{e.debit_account}</td>
                  <td className="table-td text-red-600 font-medium">{e.credit_account}</td>
                  <td className="table-td text-right font-semibold">{fmt(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCapital && <CapitalModal onClose={() => setShowCapital(false)} onSaved={loadAll} />}
    </div>
  )
}
