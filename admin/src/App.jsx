import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Proveedores from './pages/Proveedores'
import Inventario from './pages/Inventario'
import Compras from './pages/Compras'
import Ventas from './pages/Ventas'
import Contabilidad from './pages/Contabilidad'
import Configuracion from './pages/Configuracion'
import Categorias from './pages/Categorias'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="compras" element={<Compras />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="contabilidad" element={<Contabilidad />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  )
}
