import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import Pedidos from './pages/Pedidos'
import Usuarios from './pages/Usuarios'
import Login from './pages/Login'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif", color: '#9CA3AF', fontSize: 14 }}>
      Cargando...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  )
}
