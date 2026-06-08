import { useEffect, useState } from 'react'
import { getPayables, payPurchase, getReceivables, collectSale } from '../api/client'
import { X, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function daysUntil(dateStr) {
  if (!dateStr) return null
  const due = new Date(dateStr)
  const now = new Date()
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24))
}

function DueBadge({ dateStr }) {
  const days = daysUntil(dateStr)
  if (days === null) return null
  if (days < 0) return (
    <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 11 }}>
      Vencido hace {Math.abs(days)}d
    </span>
  )
  if (days === 0) return (
    <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11 }}>
      Vence hoy
    </span>
  )
  if (days <= 7) return (
    <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11 }}>
      Vence en {days}d
    </span>
  )
  return (
    <span className="badge" style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 11 }}>
      Vence en {days}d
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    credito:  { bg: '#FEE2E2', color: '#991B1B', label: 'Pendiente' },
    parcial:  { bg: '#FEF3C7', color: '#92400E', label: 'Parcial' },
    pagado:   { bg: '#D1FAE5', color: '#065F46', label: 'Pagado' },
    cobrado:  { bg: '#D1FAE5', color: '#065F46', label: 'Cobrado' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#6B7280', label: status }
  return <span className="badge" style={{ background: s.bg, color: s.color, fontSize: 11 }}>{s.label}</span>
}

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0
  return (
    <div style={{ background: '#F3F4F6', borderRadius: 99, height: 6, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', borderRadius: 99,
        background: pct >= 100 ? '#10B981' : pct > 0 ? '#EEC5C5' : '#E5E7EB',
        width: `${pct}%`, transition: 'width 0.4s'
      }} />
    </div>
  )
}

function PayModal({ item, type, onDone, onClose }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const balance = item.balance

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Ingresa un monto válido'); return }
    if (amt > balance + 0.01) { toast.error(`El monto supera el saldo (${fmt(balance)})`); return }
    setLoading(true)
    try {
      if (type === 'pay') await payPurchase(item.id, { amount: amt, notes })
      else await collectSale(item.id, { amount: amt, notes })
      toast.success(type === 'pay' ? 'Pago registrado' : 'Cobro registrado')
      onDone()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-900">
            {type === 'pay' ? 'Registrar Pago' : 'Registrar Cobro'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold">{fmt(type === 'pay' ? item.total_cost : item.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ya {type === 'pay' ? 'pagado' : 'cobrado'}:</span>
              <span className="font-semibold text-green-600">{fmt(item.amount_paid)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="text-gray-700 font-semibold">Saldo pendiente:</span>
              <span className="font-bold text-[#1E1A1A]">{fmt(balance)}</span>
            </div>
          </div>
          <div>
            <label className="label">Monto del {type === 'pay' ? 'pago' : 'cobro'} (S/)*</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              max={balance}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Máx. ${fmt(balance)}`}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => setAmount(balance.toFixed(2))}
              >Pago total</button>
              {[25, 50, 75].map(pct => (
                <button key={pct}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setAmount(((balance * pct) / 100).toFixed(2))}
                >{pct}%</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Nota (opcional)</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Transferencia, efectivo..." />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-blue flex-1" onClick={submit} disabled={loading}>
            {loading ? 'Procesando...' : (type === 'pay' ? 'Registrar Pago' : 'Registrar Cobro')}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreditCard2({ item, type, onAction }) {
  const [expanded, setExpanded] = useState(false)
  const total = type === 'pay' ? item.total_cost : item.total
  const isDone = item.balance <= 0

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">
                {type === 'pay'
                  ? (item.supplier?.name || `Compra #${item.id}`)
                  : `${item.customer_name} · ${item.invoice_number}`}
              </span>
              <StatusBadge status={item.status} />
              <DueBadge dateStr={item.credit_due_date} />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {item.credit_days > 0 && `${item.credit_days} días crédito · `}
              {item.credit_due_date
                ? `Vence: ${new Date(item.credit_due_date).toLocaleDateString('es-PE')}`
                : 'Sin fecha de vencimiento'}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-[#1E1A1A] text-sm">{fmt(total)}</div>
            <div className="text-xs text-gray-400">total</div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mt-3">
          <ProgressBar paid={item.amount_paid} total={total} />
          <span className="text-xs text-gray-500 shrink-0">
            {fmt(item.amount_paid)} / {fmt(total)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-xs">
            <span className="text-gray-500">Saldo: </span>
            <span className={`font-bold ${item.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {fmt(item.balance)}
            </span>
          </div>
          <div className="flex gap-2">
            {item.payments.length > 0 && (
              <button
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                onClick={() => setExpanded(e => !e)}
              >
                {item.payments.length} abono{item.payments.length !== 1 ? 's' : ''}
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {!isDone && (
              <button
                className="btn-blue text-xs py-1.5 px-3"
                onClick={() => onAction(item)}
              >
                {type === 'pay' ? '+ Abonar' : '+ Cobrar'}
              </button>
            )}
            {isDone && (
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <CheckCircle size={13} /> Completado
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && item.payments.length > 0 && (
        <div className="border-t bg-gray-50 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial de abonos</p>
          {item.payments.map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-700">{new Date(p.payment_date).toLocaleDateString('es-PE')}</span>
                {p.notes && <span className="text-gray-400 ml-2">— {p.notes}</span>}
              </div>
              <span className="font-semibold text-green-700">{fmt(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Cobranzas() {
  const [tab, setTab] = useState('payables')
  const [payables, setPayables] = useState([])
  const [receivables, setReceivables] = useState([])
  const [modal, setModal] = useState(null) // { item, type }

  const load = async () => {
    const [p, r] = await Promise.all([getPayables(), getReceivables()])
    setPayables(p)
    setReceivables(r)
  }

  useEffect(() => { load() }, [])

  const items = tab === 'payables' ? payables : receivables
  const type = tab === 'payables' ? 'pay' : 'collect'

  // KPIs
  const totalPending = payables.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0)
  const totalReceivable = receivables.filter(r => r.balance > 0).reduce((s, r) => s + r.balance, 0)
  const overdue = [...payables, ...receivables].filter(i => {
    if (i.balance <= 0 || !i.credit_due_date) return false
    return daysUntil(i.credit_due_date) < 0
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cobranzas y Pagos</h1>
        <p className="text-sm text-gray-500">Seguimiento de créditos pendientes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-red-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Por pagar a proveedores</div>
              <div className="font-bold text-red-600">{fmt(totalPending)}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-[#1E1A1A]" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Por cobrar a clientes</div>
              <div className="font-bold text-[#1E1A1A]">{fmt(totalReceivable)}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${overdue > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              {overdue > 0
                ? <AlertTriangle size={18} className="text-red-600" />
                : <CheckCircle size={18} className="text-green-600" />}
            </div>
            <div>
              <div className="text-xs text-gray-500">Vencidos</div>
              <div className={`font-bold ${overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overdue === 0 ? 'Ninguno' : `${overdue} registro${overdue !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'payables', label: `Por Pagar (${payables.filter(p => p.balance > 0).length})`, icon: CreditCard },
          { key: 'receivables', label: `Por Cobrar (${receivables.filter(r => r.balance > 0).length})`, icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors"
            style={{
              borderColor: tab === key ? '#1E1A1A' : 'transparent',
              color: tab === key ? '#1E1A1A' : '#9CA3AF',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            No hay registros a crédito.
          </div>
        )}
        {items.map(item => (
          <CreditCard2
            key={item.id}
            item={item}
            type={type}
            onAction={(it) => setModal({ item: it, type })}
          />
        ))}
      </div>

      {modal && (
        <PayModal
          item={modal.item}
          type={modal.type}
          onDone={load}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
