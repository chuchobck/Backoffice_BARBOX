import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { recepcionesAPI, comprasAPI } from '../services/api'

export default function Recepciones() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filtros, setFiltros] = useState({
    compra: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: ''
  })
  const [viewingItem, setViewingItem] = useState(null)
  const [formData, setFormData] = useState({
    id_compra: '',
    fecha_recepcion: new Date().toISOString().split('T')[0],
    notas: ''
  })
  const queryClient = useQueryClient()

  // Query para compras disponibles
  const { data: comprasData } = useQuery({
    queryKey: ['compras'],
    queryFn: () => comprasAPI.listar()
  })
  const compras = Array.isArray(comprasData?.data?.data) ? comprasData.data.data : 
                 Array.isArray(comprasData?.data) ? comprasData.data : []

  const createMutation = useMutation({
    mutationFn: (data) => recepcionesAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['recepciones'])
      queryClient.invalidateQueries(['productos'])
      setShowModal(false)
      resetForm()
      alert('Recepción registrada exitosamente. Stock actualizado.')
    },
    onError: (error) => {
      alert('Error al registrar recepción: ' + (error.response?.data?.message || error.message))
    }
  })

  const anularMutation = useMutation({
    mutationFn: (id) => recepcionesAPI.anular(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['recepciones'])
      queryClient.invalidateQueries(['productos'])
      alert('Recepción anulada. Stock restado.')
    },
    onError: (error) => {
      alert('Error al anular recepción: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleAnular = (recepcion) => {
    if (window.confirm(`¿Está seguro de anular la recepción #${recepcion.id_recepcion}? Esto restará el stock.`)) {
      anularMutation.mutate(recepcion.id_recepcion)
    }
  }

  const resetForm = () => {
    setFormData({
      id_compra: '',
      fecha_recepcion: new Date().toISOString().split('T')[0],
      notas: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.id_compra) {
      alert('Seleccione una compra')
      return
    }
    createMutation.mutate(formData)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['recepciones'],
    queryFn: () => recepcionesAPI.listar(),
  })

  const recepciones = Array.isArray(data?.data?.data) ? data.data.data : 
                     Array.isArray(data?.data) ? data.data : []

  // Función de filtrado
  const recepcionesFiltradas = recepciones.filter(recepcion => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!recepcion.id_recepcion?.toString().includes(searchLower) &&
          !recepcion.id_compra?.toString().includes(searchLower) &&
          !recepcion.notas?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de compra
    if (filtros.compra && filtros.compra !== '') {
      if (recepcion.id_compra !== parseInt(filtros.compra)) {
        return false
      }
    }

    // Filtro de estado
    if (filtros.estado && filtros.estado !== '') {
      if (recepcion.estado !== filtros.estado) {
        return false
      }
    }

    // Filtro de fecha desde
    if (filtros.fechaDesde) {
      const fechaRecepcion = new Date(recepcion.fecha_recepcion)
      const fechaDesde = new Date(filtros.fechaDesde)
      if (fechaRecepcion < fechaDesde) {
        return false
      }
    }

    // Filtro de fecha hasta
    if (filtros.fechaHasta) {
      const fechaRecepcion = new Date(recepcion.fecha_recepcion)
      const fechaHasta = new Date(filtros.fechaHasta)
      if (fechaRecepcion > fechaHasta) {
        return false
      }
    }

    return true
  })

  const exportToCSV = () => {
    const headers = ['ID', 'Compra', 'Fecha Recepción', 'Estado', 'Notas']
    const rows = recepciones.map(r => [
      r.id_recepcion,
      r.id_compra,
      new Date(r.fecha_recepcion).toLocaleDateString(),
      r.estado === 'REC' ? 'Recibida' : 'Anulada',
      r.notas || ''
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recepciones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Recepciones
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de recepciones
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
                <th>Compra</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : recepcionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">📥</p>
                    <p>No hay recepciones que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                recepcionesFiltradas.map((rec) => (
                  <tr key={rec.id_recepcion}>
                    <td className="font-mono text-sm">{rec.id_recepcion}</td>
                    <td>Compra #{rec.id_compra}</td>
                    <td className="text-sm text-barbox-text-secondary">{new Date(rec.fecha_recepcion).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className={`badge ${rec.estado === 'APR' ? 'badge-success' : 'badge-warning'}`}>
                        {rec.estado === 'APR' ? '✅ Aprobada' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => {
                            setViewingItem(rec)
                            setShowViewModal(true)
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {rec.estado === 'APR' && (
                          <button 
                            className="p-2 hover:bg-danger/10 rounded transition text-danger"
                            onClick={() => handleAnular(rec)}
                            title="Anular recepción"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal funcional */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title">Nueva Recepción</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Compra <span className="text-danger">*</span>
                  </label>
                  <select name="id_compra" value={formData.id_compra} onChange={handleChange} className="input w-full" required>
                    <option value="">Seleccionar compra...</option>
                    {compras.map(compra => (
                      <option key={compra.id_compra} value={compra.id_compra}>
                        Compra #{compra.id_compra} - {compra.proveedor?.nombre || 'Sin proveedor'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Fecha Recepción
                  </label>
                  <input type="date" name="fecha_recepcion" value={formData.fecha_recepcion} onChange={handleChange} className="input w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Notas
                  </label>
                  <textarea name="notas" value={formData.notas} onChange={handleChange} className="input w-full" rows="4" placeholder="Observaciones sobre la recepción..."></textarea>
                </div>
              </div>
              <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={createMutation.isPending}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Guardando...' : 'Guardar Recepción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Vista */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-barbox-border flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-barbox-wine">Detalles de Recepción</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-barbox-cream rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-barbox-text-secondary">ID</p>
                  <p className="font-semibold">{viewingItem.id_recepcion}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Estado</p>
                  <span className={`badge ${viewingItem.estado === 'REC' ? 'badge-success' : 'badge-error'}`}>
                    {viewingItem.estado === 'REC' ? 'Recibida' : 'Anulada'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Fecha Recepción</p>
                  <p className="font-semibold">{new Date(viewingItem.fecha_recepcion).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Compra</p>
                  <p className="font-semibold">{compras.find(c => c.id_compra === viewingItem.id_compra)?.id_compra || viewingItem.id_compra}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-barbox-text-secondary">Notas</p>
                  <p className="font-semibold">{viewingItem.notas || 'Sin notas'}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title">Filtros</h3>
              <button onClick={() => setShowFiltersModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Compra */}
              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">
                  Compra
                </label>
                <select 
                  value={filtros.compra} 
                  onChange={(e) => setFiltros({...filtros, compra: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todas las compras</option>
                  {compras.map(compra => (
                    <option key={compra.id_compra} value={compra.id_compra}>
                      Compra #{compra.id_compra}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">
                  Estado
                </label>
                <select 
                  value={filtros.estado} 
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos los estados</option>
                  <option value="REC">Recibida</option>
                  <option value="ANU">Anulada</option>
                </select>
              </div>

              {/* Rango de fechas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setFiltros({ compra: '', fechaDesde: '', fechaHasta: '', estado: '' })
                    setShowFiltersModal(false)
                  }}
                >
                  Limpiar
                </button>
                <button 
                  className="btn-primary flex-1"
                  onClick={() => setShowFiltersModal(false)}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
