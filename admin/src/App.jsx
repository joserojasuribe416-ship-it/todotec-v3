import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ThemeProvider } from './context/ThemeContext'
import Dashboard from './pages/Dashboard'
import Proveedores from './pages/Proveedores'
import Inventario from './pages/Inventario'
import Compras from './pages/Compras'
import Ventas from './pages/Ventas'
import Contabilidad from './pages/Contabilidad'
import Configuracion from './pages/Configuracion'
import Cobranzas from './pages/Cobranzas'
import Categorias from './pages/Categorias'
import Marcas from './pages/Marcas'
import Apariencia from './pages/Apariencia'

export default function App() {
  return (
    <ThemeProvider>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="compras" element={<Compras />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="cobranzas" element={<Cobranzas />} />
        <Route path="contabilidad" element={<Contabilidad />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="marcas" element={<Marcas />} />
        <Route path="apariencia" element={<Apariencia />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
    </ThemeProvider>
  )
}
