import { useEffect, useState } from 'react'
import { getDashboard } from '../api/client'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { DollarSign, Package, TrendingUp, Wallet, AlertTriangle } from 'lucide-react'

const COLORS = ['#EEC5C5', '#1E1A1A', '#1D4ED8', '#fbbf24', '#60a5fa', '#34d399']

function StatCard({ icon: Icon, label, value, sub, color = 'yellow' }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color === 'yellow' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
        <Icon size={22} className={color === 'yellow' ? 'text-[#EEC5C5]' : 'text-[#1E1A1A]'} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#EEC5C5] border-t-transparent rounded-full" />
    </div>
  )

  if (!data) return <div className="text-red-500">Error al cargar el dashboard</div>

  const fmt = (n) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen ejecutivo de Glowi Skin</p>
      </div>

      {/* Sales KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Ventas hoy" value={fmt(data.sales.today)} color="yellow" />
        <StatCard icon={DollarSign} label="Ventas semana" value={fmt(data.sales.week)} color="yellow" />
        <StatCard icon={DollarSign} label="Ventas mes" value={fmt(data.sales.month)} color="blue" />
        <StatCard icon={DollarSign} label="Ventas año" value={fmt(data.sales.year)} color="blue" />
      </div>

      {/* Finance KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Efectivo disponible" value={fmt(data.finance.cash)} sub="Balance de caja" color="yellow" />
        <StatCard icon={TrendingUp} label="Utilidad bruta" value={fmt(data.finance.gross_profit)} sub="Ventas - COGS" color="blue" />
        <StatCard icon={Package} label="Valor inventario" value={fmt(data.inventory.total_value)} sub={`${data.inventory.total_products} productos activos`} color="blue" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Evolución de ventas (6 meses)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.monthly_sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`S/ ${v.toFixed(2)}`, 'Ventas']} />
              <Line type="monotone" dataKey="sales" stroke="#EEC5C5" strokeWidth={3} dot={{ fill: '#1E1A1A', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By category */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Ventas por categoría</h2>
          {data.by_category.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.by_category}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.by_category.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `S/ ${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Top productos vendidos</h2>
          {data.top_products.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">Sin ventas registradas</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="qty_sold" fill="#1E1A1A" name="Unidades" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800">Stock bajo</h2>
          </div>
          {data.inventory.low_stock.length === 0 ? (
            <div className="text-green-500 text-sm text-center py-8">✓ Todo el inventario en orden</div>
          ) : (
            <div className="space-y-2">
              {data.inventory.low_stock.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.sku} · {p.category}</div>
                  </div>
                  <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}>
                    {p.stock} unid.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
