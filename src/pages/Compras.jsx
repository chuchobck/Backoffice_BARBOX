import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X, Minus } from 'lucide-react'
import { comprasAPI, proveedoresAPI, productosAPI } from '../services/api'

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filtros, setFiltros] = useState({
    proveedor: '',
    estado: '',
    fechaInicio: '',
    fechaFin: ''
  })
  const [viewingItem, setViewingItem] = useState(null)
  const [formData, setFormData] = useState({
    id_proveedor: '',
    fecha_pedido: new Date().toISOString().split('T')[0],
    observaciones: ''
  })
  const [detalles, setDetalles] = useState([{
    id_producto: '',
    cantidad: 1,
    precio_compra: 0
  }])
  const queryClient = useQueryClient()

  // Queries
  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => proveedoresAPI.listar()
  })
  const proveedores = Array.isArray(proveedoresData?.data?.data) ? proveedoresData.data.data : 
                     Array.isArray(proveedoresData?.data) ? proveedoresData.data : []

  const { data: productosData } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosAPI.listar()
  })
  const productos = Array.isArray(productosData?.data?.data) ? productosData.data.data : 
                   Array.isArray(productosData?.data) ? productosData.data : []

  const createMutation = useMutation({
    mutationFn: (data) => comprasAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['compras'])
      setShowModal(false)
      resetForm()
      alert('Compra creada exitosamente')
    },
    onError: (error) => {
      alert('Error al crear compra: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({
      id_proveedor: '',
      fecha_pedido: new Date().toISOString().split('T')[0],
      observaciones: ''
    })
    setDetalles([{ id_producto: '', cantidad: 1, precio_compra: 0 }])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.id_proveedor || detalles.length === 0) {
      alert('Seleccione un proveedor y agregue al menos un producto')
      return
    }
    const compra = {
      ...formData,
      detalles: detalles.filter(d => d.id_producto)
    }
    createMutation.mutate(compra)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDetalleChange = (index, field, value) => {
    const newDetalles = [...detalles]
    newDetalles[index][field] = value
    
    if (field === 'id_producto' && value) {
      const producto = productos.find(p => p.id_producto == value)
      if (producto) {
        newDetalles[index].precio_compra = producto.precio_compra || 0
      }
    }
    setDetalles(newDetalles)
  }

  const agregarDetalle = () => {
    setDetalles([...detalles, { id_producto: '', cantidad: 1, precio_compra: 0 }])
  }

  const eliminarDetalle = (index) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((_, i) => i !== index))
    }
  }

  const calcularTotal = () => {
    return detalles.reduce((sum, d) => sum + (d.cantidad * d.precio_compra), 0)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['compras'],
    queryFn: () => comprasAPI.listar(),
  })

  const compras = Array.isArray(data?.data?.data) ? data.data.data : 
                 Array.isArray(data?.data) ? data.data : []

  // Aplicar filtros
  const comprasFiltradas = compras.filter(compra => {
    // Filtro de búsqueda
    const proveedor = proveedores.find(p => p.id_proveedor === compra.id_proveedor)
    const matchSearch = !searchTerm || 
      compra.id_compra?.toString().includes(searchTerm) ||
      proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de proveedor
    const matchProveedor = !filtros.proveedor || compra.id_proveedor === parseInt(filtros.proveedor)
    
    // Filtro de estado
    const matchEstado = !filtros.estado || compra.estado === filtros.estado
    
    // Filtro de fechas
    const fechaCompra = new Date(compra.fecha_pedido)
    const matchFechaInicio = !filtros.fechaInicio || fechaCompra >= new Date(filtros.fechaInicio)
    const matchFechaFin = !filtros.fechaFin || fechaCompra <= new Date(filtros.fechaFin)
    
    return matchSearch && matchProveedor && matchEstado && matchFechaInicio && matchFechaFin
  })

  const exportToCSV = () => {
    const headers = ['ID', 'Proveedor', 'Fecha Pedido', 'Estado', 'Total', 'Observaciones']
    const rows = compras.map(c => [
      c.id_compra,
      proveedores.find(p => p.id_proveedor === c.id_proveedor)?.nombre || 'N/A',
      new Date(c.fecha_pedido).toLocaleDateString(),
      c.estado === 'APR' ? 'Aprobada' : c.estado === 'PEN' ? 'Pendiente' : 'Anulada',
      Number(c.total || 0).toFixed(2),
      c.observaciones || ''
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compras_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => comprasAPI.eliminar(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['compras'])
      alert('Compra eliminada')
    },
    onError: (error) => {
      alert('Error al eliminar: ' + (error.response?.data?.message || error.message))
    }
  })

  const aprobarMutation = useMutation({
    mutationFn: (id) => comprasAPI.aprobar(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['compras'])
      alert('Compra aprobada exitosamente')
    },
    onError: (error) => {
      alert('Error al aprobar: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleAprobar = (compra) => {
    if (window.confirm(`¿Aprobar la compra #${compra.id_compra}?`)) {
      aprobarMutation.mutate(compra.id_compra)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta compra?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Compras
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de compras
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportToCSV}>
            <Download size={18} className="mr-2" />
            Exportar
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-barbox-text-secondary" size={20} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button className="btn-secondary" onClick={() => setShowFiltersModal(true)}>
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th className="text-right">Total</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : comprasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">📦</p>
                    <p>No hay compras{searchTerm || Object.values(filtros).some(v => v) ? ' que coincidan con los filtros' : ''}</p>
                  </td>
                </tr>
              ) : (
                comprasFiltradas.map((compra, index) => {
                  const comp = compra; // alias para consistency
                  return (
                  <tr key={comp.id_compra}>
                    <td className="font-mono text-sm">{comp.id_compra}</td>
                    <td className="font-medium">{proveedores.find(p => p.id_proveedor === comp.id_proveedor)?.nombre || 'N/A'}</td>
                    <td className="text-sm text-barbox-text-secondary">{new Date(comp.fecha_pedido).toLocaleDateString('es-ES')}</td>
                    <td className="text-right font-semibold">${Number(comp.total || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        comp.estado === 'PEN' ? 'badge-warning' :
                        comp.estado === 'APR' ? 'badge-success' : 
                        comp.estado === 'ANU' ? 'badge-error' : 'badge-info'
                      }`}>
                        {comp.estado === 'PEN' ? '⏳ Pendiente' : 
                         comp.estado === 'APR' ? '✅ Aprobada' : 
                         comp.estado === 'ANU' ? '❌ Anulada' : 'Info'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => {
                            setViewingItem(comp)
                            setShowViewModal(true)
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {comp.estado === 'PEN' && (
                          <>
                            <button 
                              className="p-2 hover:bg-success/10 rounded transition text-success"
                              onClick={() => aprobarMutation.mutate(comp.id_compra)}
                              title="Aprobar compra"
                            >
                              ✓
                            </button>
                            <button 
                              className="p-2 hover:bg-danger/10 rounded transition text-danger"
                              onClick={() => deleteMutation.mutate(comp.id_compra)}
                              title="Eliminar compra"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal funcional */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title">Nueva Compra</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Proveedor <span className="text-danger">*</span>
                    </label>
                    <select name="id_proveedor" value={formData.id_proveedor} onChange={handleChange} className="input w-full" required>
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map(prov => (
                        <option key={prov.id_proveedor} value={prov.id_proveedor}>{prov.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Fecha Pedido
                    </label>
                    <input type="date" name="fecha_pedido" value={formData.fecha_pedido} onChange={handleChange} className="input w-full" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Observaciones
                  </label>
                  <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="input w-full" rows="2" placeholder="Notas adicionales..."></textarea>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-barbox-wine">Productos</h4>
                    <button type="button" onClick={agregarDetalle} className="btn-secondary btn-sm">
                      <Plus size={16} className="mr-1" /> Agregar
                    </button>
                  </div>
                  
                  {detalles.map((detalle, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-6">
                        <select
                          value={detalle.id_producto}
                          onChange={(e) => handleDetalleChange(index, 'id_producto', e.target.value)}
                          className="input w-full"
                        >
                          <option value="">Seleccionar producto...</option>
                          {productos.map(prod => (
                            <option key={prod.id_producto} value={prod.id_producto}>{prod.descripcion}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={detalle.cantidad}
                          onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value) || 1)}
                          className="input w-full"
                          placeholder="Cant."
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          value={detalle.precio_compra}
                          onChange={(e) => handleDetalleChange(index, 'precio_compra', parseFloat(e.target.value) || 0)}
                          className="input w-full"
                          placeholder="Precio"
                        />
                      </div>
                      <div className="col-span-1 flex items-center">
                        <button
                          type="button"
                          onClick={() => eliminarDetalle(index)}
                          className="p-2 text-danger hover:bg-red-50 rounded"
                          disabled={detalles.length === 1}
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <div className="text-right">
                      <div className="text-sm text-barbox-text-secondary">Total</div>
                      <div className="text-2xl font-bold text-barbox-wine">${calcularTotal().toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={createMutation.isPending}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Guardando...' : 'Guardar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Vista */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-barbox-border flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-barbox-wine">Detalles de Compra</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-barbox-cream rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-barbox-text-secondary">ID</p>
                  <p className="font-semibold">{viewingItem.id_compra}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Estado</p>
                  <span className={`badge ${viewingItem.estado === 'APR' ? 'badge-success' : viewingItem.estado === 'PEN' ? 'badge-warning' : 'badge-error'}`}>
                    {viewingItem.estado === 'APR' ? 'Aprobada' : viewingItem.estado === 'PEN' ? 'Pendiente' : 'Anulada'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Fecha Pedido</p>
                  <p className="font-semibold">{new Date(viewingItem.fecha_pedido).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Proveedor</p>
                  <p className="font-semibold">{proveedores.find(p => p.id_proveedor === viewingItem.id_proveedor)?.nombre || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-barbox-text-secondary">Observaciones</p>
                  <p className="font-semibold">{viewingItem.observaciones || 'Sin observaciones'}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Total</p>
                  <p className="font-semibold text-barbox-wine text-xl">${Number(viewingItem.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-barbox-border flex justify-end">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Filtros */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFiltersModal(false)}>
          <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title">Filtros</h3>
              <button onClick={() => setShowFiltersModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">Proveedor</label>
                <select 
                  value={filtros.proveedor} 
                  onChange={(e) => setFiltros({...filtros, proveedor: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos los proveedores</option>
                  {proveedores.map(prov => (
                    <option key={prov.id_proveedor} value={prov.id_proveedor}>{prov.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">Estado</label>
                <select 
                  value={filtros.estado} 
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos los estados</option>
                  <option value="PEN">Pendiente</option>
                  <option value="APR">Aprobada</option>
                  <option value="ANU">Anulada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Desde</label>
                  <input 
                    type="date"
                    value={filtros.fechaInicio} 
                    onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Hasta</label>
                  <input 
                    type="date"
                    value={filtros.fechaFin} 
                    onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setFiltros({
                    proveedor: '',
                    estado: '',
                    fechaInicio: '',
                    fechaFin: ''
                  })
                }}
              >
                Limpiar
              </button>
              <button 
                className="btn-primary"
                onClick={() => setShowFiltersModal(false)}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
