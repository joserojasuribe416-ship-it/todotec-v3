import { useEffect, useState } from 'react'
import { getConfig, updateConfig, uploadLogo } from '../api/client'
import api from '../api/client'
import { Save, Upload, AlertTriangle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

export default function Configuracion() {
  const [form, setForm] = useState(null)
  const [uploading, setUploading] = useState(false)
  const { updateBrand } = useTheme()

  useEffect(() => { getConfig().then(setForm) }, [])

  const save = async () => {
    try {
      await updateConfig(form)
      updateBrand(form.company_name, form.logo_url)
      toast.success('Configuración guardada')
    } catch { toast.error('Error al guardar') }
  }

  const uploadLogoFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadLogo(file)
      setForm(f => ({ ...f, logo_url: res.url }))
      updateBrand(undefined, res.url)
      toast.success('Logo actualizado')
    } catch { toast.error('Error al subir logo') }
    finally { setUploading(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetTotal = async () => {
    const first = confirm('⚠️ RESET TOTAL\n\nEsto eliminará permanentemente:\n• Todos los productos e inventario\n• Todas las compras y ventas\n• Todos los proveedores\n• Todos los registros contables\n• Todas las imágenes de productos\n\nSe conservarán: configuración de empresa y categorías.\n\n¿Estás seguro?')
    if (!first) return
    const second = confirm('Esta acción NO se puede deshacer.\n\n¿Confirmas el RESET TOTAL del sistema?')
    if (!second) return
    try {
      await api.post('/reset-total')
      toast.success('Reset total completado. El sistema está limpio.')
    } catch {
      toast.error('Error al ejecutar el reset')
    }
  }

  if (!form) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#EEC5C5] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Parámetros del sistema y datos de la empresa</p>
        </div>
        <button className="btn-blue flex items-center gap-2" onClick={save}>
          <Save size={18} /> Guardar cambios
        </button>
      </div>

      {/* Company data */}
      <div className="card space-y-4">
        <h2 className="font-bold text-[#1E1A1A]">Datos de la Empresa</h2>
        <div className="flex items-center gap-4">
          {form.logo_url && <img src={form.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border" />}
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={uploadLogoFile} disabled={uploading} />
            <div className="btn-ghost flex items-center gap-2 text-sm">
              <Upload size={15} /> {uploading ? 'Subiendo...' : 'Subir Logo'}
            </div>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre comercial</label>
            <input className="input" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Razón social</label>
            <input className="input" value={form.razon_social} onChange={e => set('razon_social', e.target.value)} />
          </div>
          <div>
            <label className="label">RUC</label>
            <input className="input" value={form.ruc} onChange={e => set('ruc', e.target.value)} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input className="input" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+51 999 999 999" />
          </div>
          <div className="col-span-2">
            <label className="label">Dirección</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Financial */}
      <div className="card space-y-4">
        <h2 className="font-bold text-[#1E1A1A]">Parámetros Financieros</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Moneda principal</label>
            <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option value="PEN">PEN — Soles</option>
              <option value="USD">USD — Dólares</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de cambio (USD→PEN)</label>
            <input className="input" type="number" step="0.01" value={form.exchange_rate} onChange={e => set('exchange_rate', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="label">IGV (%)</label>
            <input className="input" type="number" step="0.01" value={(form.tax_rate * 100).toFixed(0)} onChange={e => set('tax_rate', parseFloat(e.target.value) / 100)} />
          </div>
        </div>
      </div>

      {/* Invoicing */}
      <div className="card space-y-4">
        <h2 className="font-bold text-[#1E1A1A]">Facturación</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Serie</label>
            <input className="input" value={form.invoice_series} onChange={e => set('invoice_series', e.target.value)} placeholder="F001" />
          </div>
          <div>
            <label className="label">Correlativo actual</label>
            <input className="input" type="number" value={form.invoice_correlativo} disabled className="bg-gray-50 cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Social media */}
      <div className="card space-y-4">
        <h2 className="font-bold text-[#1E1A1A]">Redes Sociales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Instagram</label>
            <input className="input" value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@todotec" />
          </div>
          <div>
            <label className="label">Facebook</label>
            <input className="input" value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="Glowi Skin" />
          </div>
          <div>
            <label className="label">TikTok</label>
            <input className="input" value={form.tiktok} onChange={e => set('tiktok', e.target.value)} placeholder="@todotec" />
          </div>
        </div>
      </div>

      {/* ── Zona de Peligro ── */}
      <div className="card border-2 border-red-200 bg-red-50 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600" />
          <h2 className="font-bold text-red-700">Zona de Peligro</h2>
        </div>
        <div className="flex items-center justify-between gap-6 bg-white rounded-xl p-4 border border-red-200">
          <div>
            <div className="font-bold text-gray-900 text-sm">Reset total del sistema</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Elimina todos los productos, compras, ventas, proveedores y registros contables.
              El negocio queda en cero. Se conservan la configuración de empresa y las categorías.
            </div>
          </div>
          <button
            onClick={resetTotal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-red-600 border-2 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 whitespace-nowrap flex-shrink-0"
          >
            <Trash2 size={15} /> Reset total
          </button>
        </div>
      </div>
    </div>
  )
}
