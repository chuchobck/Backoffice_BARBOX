import { useQuery } from '@tanstack/react-query'
import { productosAPI, clientesAPI, facturasAPI, comprasAPI } from '../services/api'
import {
  TrendingUp, TrendingDown, ArrowUp, ArrowDown,
  Calendar, AlertTriangle, FileText, DollarSign, Package, Users, ShoppingCart, Receipt
} from 'lucide-react'

function Dashboard() {
  // TODO: Backend no tiene endpoint /dashboard implementado
  // Obtener datos de múltiples endpoints individuales
  const { data: productosData } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosAPI.listar(),
  })
  
  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.listar(),
  })
  
  const { data: facturasData } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => facturasAPI.listar(),
  })
  
  const { data: comprasData } = useQuery({
    queryKey: ['compras'],
    queryFn: () => comprasAPI.listar(),
  })

  // Extraer datos con validación estricta
  const productos = Array.isArray(productosData?.data?.data) ? productosData.data.data : 
                   Array.isArray(productosData?.data) ? productosData.data : []
  const clientes = Array.isArray(clientesData?.data?.data) ? clientesData.data.data : 
                  Array.isArray(clientesData?.data) ? clientesData.data : []
  const facturas = Array.isArray(facturasData?.data?.data) ? facturasData.data.data : 
                  Array.isArray(facturasData?.data) ? facturasData.data : []
  const compras = Array.isArray(comprasData?.data?.data) ? comprasData.data.data : 
                 Array.isArray(comprasData?.data) ? comprasData.data : []

  // Calcular estadísticas
  const totalProductos = productos.length
  const totalClientes = clientes.length
  const totalFacturas = facturas.filter(f => f.estado === 'EMI').length
  const totalCompras = compras.length

  // Calcular total de ventas (facturas emitidas)
  const totalVentas = facturas
    .filter(f => f.estado === 'EMI')
    .reduce((sum, f) => sum + Number(f.total || 0), 0)

  // Productos con stock bajo
  const productosStockBajo = productos.filter(p => 
    Number(p.stock_actual || 0) <= Number(p.stock_minimo || 0)
  )

  // Valor total del inventario
  const valorInventario = productos.reduce((sum, p) => 
    sum + (Number(p.precio_compra || 0) * Number(p.stock_actual || 0)), 0
  )

  const isLoading = !productosData || !clientesData || !facturasData || !comprasData

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Dashboard
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Bienvenido de vuelta 👋
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">
            📊 Reporte Completo
          </button>
          <button className="btn-secondary">
            📤 Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="💵 Total Ventas"
          value={`$${totalVentas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${totalFacturas} facturas`}
          icon={<DollarSign />}
          color="terracotta"
        />
        <KPICard
          title="📦 Productos"
          value={totalProductos}
          subtitle={`${productosStockBajo.length} stock bajo`}
          icon={<Package />}
          color="wine"
        />
        <KPICard
          title="👥 Clientes"
          value={totalClientes}
          subtitle="Clientes activos"
          icon={<Users />}
          color="olive"
        />
        <KPICard
          title="🛒 Compras"
          value={totalCompras}
          subtitle="Total compras"
          icon={<ShoppingCart />}
          color="terracotta"
        />
      </div>

      {/* Alertas y Estadísticas Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Productos con Stock Bajo */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-barbox-wine flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Productos con Stock Bajo
            </h3>
          </div>
          <div className="card-body">
            {productosStockBajo.length === 0 ? (
              <p className="text-barbox-text-secondary text-center py-4">
                ✅ Todos los productos tienen stock suficiente
              </p>
            ) : (
              <div className="space-y-2">
                {productosStockBajo.slice(0, 5).map(producto => (
                  <div key={producto.id_producto} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{producto.descripcion}</p>
                      <p className="text-xs text-barbox-text-secondary">
                        Stock: {producto.stock_actual} / Mínimo: {producto.stock_minimo}
                      </p>
                    </div>
                    <span className="badge badge-warning">¡Bajo!</span>
                  </div>
                ))}
                {productosStockBajo.length > 5 && (
                  <p className="text-xs text-barbox-text-secondary text-center mt-2">
                    +{productosStockBajo.length - 5} productos más
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Inventario */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-barbox-wine flex items-center gap-2">
              <Package size={20} />
              Resumen de Inventario
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-barbox-text-secondary">Total Productos</span>
                <span className="font-semibold text-xl">{totalProductos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-barbox-text-secondary">Valor Inventario</span>
                <span className="font-semibold text-xl text-barbox-wine">
                  ${valorInventario.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-barbox-text-secondary">Stock Bajo</span>
                <span className="font-semibold text-xl text-orange-600">{productosStockBajo.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-barbox-text-secondary">Total Facturas</span>
                <span className="font-semibold text-xl">{totalFacturas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas Facturas */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📄 Últimas Facturas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-barbox-cream/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-barbox-wine uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-barbox-wine uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-barbox-wine uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-barbox-wine uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-barbox-wine uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-barbox-cream">
              {facturas.slice(0, 5).map((factura) => (
                <tr key={factura.id_factura} className="hover:bg-barbox-cream/20">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-barbox-wine">
                    {factura.numero_factura}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-barbox-brown">
                    {factura.Cliente?.nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-barbox-brown">
                    {factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString('es-ES') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-barbox-wine">
                    ${Number(factura.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      factura.estado === 'EMI' ? 'bg-green-100 text-green-800' :
                      factura.estado === 'ANU' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {factura.estado === 'EMI' ? 'Emitida' :
                       factura.estado === 'ANU' ? 'Anulada' :
                       factura.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay facturas recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// KPI Card Component
function KPICard({ title, value, change, progress, subtitle, icon, color }) {
  const colorClasses = {
    terracotta: 'from-barbox-terracotta to-barbox-terracotta-dark',
    wine: 'from-barbox-wine via-barbox-wine to-[#3A2625]',
    olive: 'from-barbox-olive to-[#5a6c4d]',
    warning: 'from-warning to-[#ca8a04]',
    info: 'from-info to-[#138496]',
  }

  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]} text-white`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm opacity-90">{title}</p>
          {icon && <div className="opacity-80">{icon}</div>}
        </div>
        <p className="text-3xl font-bold mb-2">{value}</p>
        
        {change !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            {change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span>{change >= 0 ? '+' : ''}{change}% vs ayer</span>
          </div>
        )}
        
        {progress !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm">{progress}%</span>
          </div>
        )}
        
        {subtitle && (
          <p className="text-sm opacity-90 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

// Gráfico de Ventas por Día
function VentasPorDiaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C75040" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#C75040" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3D6D2" />
        <XAxis 
          dataKey="fecha" 
          tick={{ fill: '#4A4545' }}
          tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: es })}
        />
        <YAxis 
          tick={{ fill: '#4A4545' }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#F6EDE7',
            border: '1px solid #E3D6D2',
            borderRadius: '8px'
          }}
          labelFormatter={(label) => format(new Date(label), 'd MMMM', { locale: es })}
          formatter={(value) => [`$${value.toFixed(2)}`, 'Ventas']}
        />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="#C75040" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorVentas)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Top Productos
function TopProductosCard({ productos }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">🏆 Top 10 Productos</h3>
      </div>
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {productos.map((producto, index) => (
          <div 
            key={producto.id_producto}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-barbox-cream transition"
          >
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
              ${index === 0 ? 'bg-gradient-to-br from-barbox-terracotta to-barbox-terracotta-dark text-white' : ''}
              ${index === 1 ? 'bg-barbox-cream text-barbox-wine border-2 border-barbox-terracotta' : ''}
              ${index === 2 ? 'bg-barbox-border text-barbox-text-secondary' : ''}
              ${index > 2 ? 'bg-white border border-barbox-border text-barbox-text-secondary' : ''}
            `}>
              {index + 1}
            </div>
            
            <img 
              src={producto.imagen_url || '/placeholder.png'} 
              alt={producto.descripcion}
              className="w-10 h-10 rounded object-cover border border-barbox-border"
            />
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-barbox-wine truncate">{producto.descripcion}</p>
              <p className="text-sm text-barbox-text-secondary">{producto.marca}</p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-lg text-barbox-wine">{producto.cantidad_vendida}</p>
              <p className="text-xs text-barbox-text-secondary">unidades</p>
            </div>
            
            <div className="w-20">
              <div className="h-2 bg-barbox-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-barbox-terracotta to-barbox-terracotta-dark"
                  style={{ width: `${(producto.cantidad_vendida / productos[0]?.cantidad_vendida) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-barbox-terracotta">
                ${Number(producto.total_generado || 0).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Ventas por Canal
function VentasPorCanalCard({ datos }) {
  const chartData = [
    { name: 'POS', value: datos.POS?.porcentaje || 0, color: '#C75040' },
    { name: 'WEB', value: datos.WEB?.porcentaje || 0, color: '#2A1716' },
    { name: 'Móvil', value: datos.MOV?.porcentaje || 0, color: '#eab308' }
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📊 Ventas por Canal</h3>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `${value}%`}
              contentStyle={{ 
                backgroundColor: '#F6EDE7',
                border: '1px solid #E3D6D2',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-barbox-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#C75040]"></div>
              <span className="text-sm font-medium text-barbox-text-secondary">POS</span>
            </div>
            <p className="text-2xl font-bold text-barbox-wine">{datos.POS?.porcentaje || 0}%</p>
            <p className="text-sm text-barbox-terracotta font-semibold">
              ${Number(datos.POS?.total || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#2A1716]"></div>
              <span className="text-sm font-medium text-barbox-text-secondary">WEB</span>
            </div>
            <p className="text-2xl font-bold text-barbox-wine">{datos.WEB?.porcentaje || 0}%</p>
            <p className="text-sm text-barbox-terracotta font-semibold">
              ${Number(datos.WEB?.total || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
              <span className="text-sm font-medium text-barbox-text-secondary">Móvil</span>
            </div>
            <p className="text-2xl font-bold text-barbox-wine">{datos.MOV?.porcentaje || 0}%</p>
            <p className="text-sm text-barbox-terracotta font-semibold">
              ${Number(datos.MOV?.total || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Últimas Facturas
function UltimasFacturasCard({ facturas }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">📋 Últimas Facturas</h3>
          <button className="btn-ghost text-sm">Ver todas →</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th># Factura</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Canal</th>
              <th className="text-right">Total</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((factura) => (
              <tr key={factura.id_factura}>
                <td className="font-mono text-sm font-medium">{factura.id_factura}</td>
                <td>
                  <div>
                    <p className="font-medium">{factura.cliente_nombre}</p>
                    <p className="text-xs text-barbox-text-secondary">{factura.cliente_cedula}</p>
                  </div>
                </td>
                <td className="text-sm text-barbox-text-secondary">
                  {format(new Date(factura.fecha_emision), 'd MMM, HH:mm', { locale: es })}
                </td>
                <td>
                  <span className={`badge ${
                    factura.id_canal === 'POS' ? 'badge-terracotta' :
                    factura.id_canal === 'WEB' ? 'bg-barbox-wine text-white' :
                    'bg-warning text-white'
                  }`}>
                    {factura.id_canal}
                  </span>
                </td>
                <td className="text-right font-semibold">${factura.total.toFixed(2)}</td>
                <td>
                  <span className={`badge ${
                    factura.estado === 'PAG' ? 'badge-success' :
                    factura.estado === 'EMI' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {factura.estado === 'PAG' ? '✅ Pagada' :
                     factura.estado === 'EMI' ? '⏳ Emitida' : '🚫 Anulada'}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-barbox-cream rounded transition" title="Ver detalle">
                      👁️
                    </button>
                    <button className="p-2 hover:bg-barbox-cream rounded transition" title="Imprimir">
                      🖨️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-barbox-border animate-pulse rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card p-6 h-32 animate-pulse bg-barbox-border"></div>
        ))}
      </div>
      <div className="card h-96 animate-pulse bg-barbox-border"></div>
    </div>
  )
}

export default Dashboard