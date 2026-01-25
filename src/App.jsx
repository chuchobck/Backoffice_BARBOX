import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Facturas from './pages/Facturas'
import Proveedores from './pages/Proveedores'
import Compras from './pages/Compras'
import Recepciones from './pages/Recepciones'
import Promociones from './pages/Promociones'
import Marcas from './pages/Marcas'
import Categorias from './pages/Categorias'
import IVA from './pages/IVA'
import Empleados from './pages/Empleados'
import MetodosPago from './pages/MetodosPago'
import Ciudades from './pages/Ciudades'

// Layout
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Ventas */}
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/facturas" element={<Facturas />} />
            
            {/* Inventario */}
            <Route path="/productos" element={<Productos />} />
            <Route path="/recepciones" element={<Recepciones />} />
            
            {/* Compras */}
            <Route path="/compras" element={<Compras />} />
            <Route path="/proveedores" element={<Proveedores />} />
            
            {/* Marketing */}
            <Route path="/promociones" element={<Promociones />} />
            <Route path="/marcas" element={<Marcas />} />
            
            {/* Configuración */}
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/iva" element={<IVA />} />
            <Route path="/metodos-pago" element={<MetodosPago />} />
            <Route path="/ciudades" element={<Ciudades />} />
            
            {/* Administración */}
            <Route path="/empleados" element={<Empleados />} />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
