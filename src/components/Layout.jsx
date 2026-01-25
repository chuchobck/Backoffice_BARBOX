import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, Users, FileText, Package, Warehouse,
  ShoppingCart, Truck, Tag, Award, FolderOpen, Percent,
  Menu, X, LogOut, Bell, CreditCard, MapPin, UserCog
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  {
    title: 'GENERAL',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ]
  },
  {
    title: 'VENTAS',
    items: [
      { icon: Users, label: 'Clientes', path: '/clientes' },
      { icon: FileText, label: 'Facturas', path: '/facturas' },
    ]
  },
  {
    title: 'INVENTARIO',
    items: [
      { icon: Package, label: 'Productos', path: '/productos' },
      { icon: Warehouse, label: 'Recepciones', path: '/recepciones' },
    ]
  },
  {
    title: 'COMPRAS',
    items: [
      { icon: ShoppingCart, label: 'Órdenes de Compra', path: '/compras' },
      { icon: Truck, label: 'Proveedores', path: '/proveedores' },
    ]
  },
  {
    title: 'MARKETING',
    items: [
      { icon: Tag, label: 'Promociones', path: '/promociones' },
      { icon: Award, label: 'Marcas', path: '/marcas' },
    ]
  },
  {
    title: 'CONFIGURACIÓN',
    items: [
      { icon: FolderOpen, label: 'Categorías', path: '/categorias' },
      { icon: Percent, label: 'IVA', path: '/iva' },
      { icon: CreditCard, label: 'Métodos de Pago', path: '/metodos-pago' },
      { icon: MapPin, label: 'Ciudades', path: '/ciudades' },
    ]
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      { icon: UserCog, label: 'Empleados', path: '/empleados' },
    ]
  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-barbox-cream">
      {/* Navbar */}
      <nav className="bg-white border-b border-barbox-border fixed top-0 left-0 right-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y Menu Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-barbox-cream transition"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-barbox-terracotta to-barbox-terracotta-dark rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-terracotta">
                  🍷
                </div>
                <h1 className="text-xl font-display font-bold text-barbox-wine hidden sm:block">
                  BARBOX
                </h1>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-barbox-cream rounded-lg transition relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 px-4 py-2 bg-barbox-cream rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-barbox-terracotta to-barbox-terracotta-dark flex items-center justify-center text-white font-semibold text-sm">
                  {user?.nombre1?.charAt(0) || 'U'}
                </div>
                <span className="font-semibold text-barbox-wine text-sm hidden md:block">
                  {user?.nombre1 || 'Usuario'}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-2 hover:bg-danger/10 hover:text-danger rounded-lg transition"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 bottom-0 z-20
          w-64 bg-white border-r border-barbox-border
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}>
          <div className="p-4">
            {menuItems.map((section, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="text-xs font-bold text-barbox-text-secondary uppercase tracking-wider mb-3 px-3">
                  {section.title}
                </h3>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition group
                          ${active 
                            ? 'bg-gradient-to-r from-barbox-terracotta to-barbox-terracotta-dark text-white shadow-terracotta' 
                            : 'hover:bg-barbox-cream text-barbox-wine'
                          }
                        `}
                      >
                        <Icon size={20} className={active ? '' : 'text-barbox-terracotta'} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
