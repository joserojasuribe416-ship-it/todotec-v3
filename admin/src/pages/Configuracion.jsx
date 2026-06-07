import { useEffect, useState } from 'react'
import { getConfig, updateConfig, uploadLogo } from '../api/client'
import api from '../api/client'
import { Save, Upload, AlertTriangle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

const PRIMARY_COLORS = [
  { label: 'Azul marino',   value: '#1E3A8A' },
  { label: 'Azul royal',    value: '#2563EB' },
  { label: 'Índigo',        value: '#4338CA' },
  { label: 'Violeta',       value: '#7C3AED' },
  { label: 'Verde',         value: '#16A34A' },
  { label: 'Verde oscuro',  value: '#15803D' },
  { label: 'Rojo',          value: '#DC2626' },
  { label: 'Naranja',       value: '#EA580C' },
  { label: 'Negro',         value: '#0A0A0A' },
  { label: 'Gris oscuro',   value: '#374151' },
]

const SECONDARY_COLORS = [
  { label: 'Amarillo',   value: '#FFD100' },
  { label: 'Ámbar',      value: '#F59E0B' },
  { label: 'Naranja',    value: '#F97316' },
  { label: 'Rojo',       value: '#EF4444' },
  { label: 'Verde',      value: '#10B981' },
  { label: 'Azul claro', value: '#38BDF8' },
  { label: 'Violeta',    value: '#A78BFA' },
  { label: 'Blanco',     value: '#FFFFFF' },
]

function ColorPalette({ colors, selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {colors.map(c => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: c.value,
            border: selected === c.value ? '3px solid #374151' : '2px solid #E5E7EB',
            cursor: 'pointer',
            boxShadow: selected === c.value ? '0 0 0 2px white inset' : 'none',
            transition: 'transform 0.1s',
            transform: selected === c.value ? 'scale(1.15)' : 'scale(1)',
          }}
        />
      ))}
      {/* Custom color picker */}
      <label title="Color personalizado" style={{ position: 'relative', cursor: 'pointer' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, border: '2px dashed #9CA3AF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#9CA3AF', background: '#F9FAFB'
        }}>+</div>
        <input
          type="color"
          value={selected}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </label>
    </div>
  )
}

export default function Configuracion() {
  const [form, setForm] = useState(null)
  const [uploading, setUploading] = useState(false)
  const { updateTheme } = useTheme()

  useEffect(() => { getConfig().then(setForm) }, [])

  const save = async () => {
    try {
      await updateConfig(form)
      updateTheme(form.primary_color || '#1E3A8A', form.secondary_color || '#FFD100')
      toast.success('Configuración guardada')
    } catch { toast.error('Error al guardar') }
  }

  const handlePrimary = (color) => {
    set('primary_color', color)
    updateTheme(color, form.secondary_color || '#FFD100')
  }

  const handleSecondary = (color) => {
    set('secondary_color', color)
    updateTheme(form.primary_color || '#1E3A8A', color)
  }

  const uploadLogoFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadLogo(file)
      setForm(f => ({ ...f, logo_url: res.url }))
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

  if (!form) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#FFD100] border-t-transparent rounded-full" /></div>

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
        <h2 className="font-bold text-[#1E3A8A]">Datos de la Empresa</h2>
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
        <h2 className="font-bold text-[#1E3A8A]">Parámetros Financieros</h2>
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
        <h2 className="font-bold text-[#1E3A8A]">Facturación</h2>
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
        <h2 className="font-bold text-[#1E3A8A]">Redes Sociales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Instagram</label>
            <input className="input" value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@todotec" />
          </div>
          <div>
            <label className="label">Facebook</label>
            <input className="input" value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="TodoTec" />
          </div>
          <div>
            <label className="label">TikTok</label>
            <input className="input" value={form.tiktok} onChange={e => set('tiktok', e.target.value)} placeholder="@todotec" />
          </div>
        </div>
      </div>

      {/* ── Apariencia ── */}
      <div className="card space-y-6">
        <div>
          <h2 className="font-bold text-[#1E3A8A]">Apariencia</h2>
          <p className="text-xs text-gray-400 mt-0.5">Los cambios de color se aplican en tiempo real al guardar.</p>
        </div>

        {/* Preview */}
        <div style={{
          borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            background: form.primary_color || '#1E3A8A',
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: form.secondary_color || '#FFD100',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, color: form.primary_color || '#1E3A8A'
            }}>TT</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{form.company_name || 'Mi Empresa'}</span>
            <span style={{
              marginLeft: 'auto', background: form.secondary_color || '#FFD100',
              color: form.primary_color || '#1E3A8A',
              fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 4
            }}>BOTÓN</span>
          </div>
          <div style={{ background: '#F7F8FA', padding: '14px 24px' }}>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>Vista previa del encabezado con tus colores</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="label">Color primario (fondo, sidebar, banners)</label>
            <div className="flex items-center gap-3 mb-3">
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: form.primary_color || '#1E3A8A', border: '1px solid #E5E7EB'
              }} />
              <span className="text-xs text-gray-500 font-mono">{form.primary_color || '#1E3A8A'}</span>
            </div>
            <ColorPalette
              colors={PRIMARY_COLORS}
              selected={form.primary_color || '#1E3A8A'}
              onChange={handlePrimary}
            />
          </div>
          <div>
            <label className="label">Color secundario (acentos, botones, íconos)</label>
            <div className="flex items-center gap-3 mb-3">
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: form.secondary_color || '#FFD100', border: '1px solid #E5E7EB'
              }} />
              <span className="text-xs text-gray-500 font-mono">{form.secondary_color || '#FFD100'}</span>
            </div>
            <ColorPalette
              colors={SECONDARY_COLORS}
              selected={form.secondary_color || '#FFD100'}
              onChange={handleSecondary}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="label">Título del banner de la tienda</label>
          <input
            className="input"
            value={form.banner_title || ''}
            onChange={e => set('banner_title', e.target.value)}
            placeholder="Todo lo que necesitas, en un solo lugar."
          />
          <label className="label">Subtítulo del banner</label>
          <textarea
            className="input"
            rows={2}
            value={form.banner_subtitle || ''}
            onChange={e => set('banner_subtitle', e.target.value)}
            placeholder="Importamos directamente los mejores productos tecnológicos."
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-blue flex items-center gap-2" onClick={save}>
          <Save size={18} /> Guardar todos los cambios
        </button>
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
