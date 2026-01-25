import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { promocionesAPI } from '../services/api'

export default function Promociones() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filtros, setFiltros] = useState({
    estado: '',
    vigentes: false,
    fechaInicio: '',
    fechaFin: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    descripcion: '',
    descuento: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'ACT'
  })
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data) => promocionesAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promociones'])
      setShowModal(false)
      resetForm()
      alert('Promoción creada exitosamente')
    },
    onError: (error) => {
      alert('Error al crear la promoción: ' + (error.response?.data?.message || error.message))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => promocionesAPI.actualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promociones'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Promoción actualizada exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar promoción: ' + (error.response?.data?.message || error.message))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => promocionesAPI.eliminar(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['promociones'])
      alert('Promoción eliminada')
    },
    onError: (error) => {
      alert('Error al eliminar: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({
      descripcion: '',
      descuento: '',
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'ACT'
    })
    setEditingId(null)
  }

  const handleEdit = (promocion) => {
    setFormData({
      descripcion: promocion.descripcion || '',
      descuento: promocion.descuento || '',
      fecha_inicio: promocion.fecha_inicio ? promocion.fecha_inicio.split('T')[0] : '',
      fecha_fin: promocion.fecha_fin ? promocion.fecha_fin.split('T')[0] : '',
      estado: promocion.estado || 'ACT'
    })
    setEditingId(promocion.id_promocion)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta promoción permanentemente?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.descripcion || !formData.descuento) {
      alert('Por favor complete los campos requeridos')
      return
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['promociones'],
    queryFn: () => promocionesAPI.listar(),
  })

  const promociones = Array.isArray(data?.data?.data) ? data.data.data : 
                     Array.isArray(data?.data) ? data.data : []

  // Función de filtrado
  const promocionesFiltradas = promociones.filter(promocion => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!promocion.descripcion?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de estado
    if (filtros.estado && filtros.estado !== '') {
      if (promocion.estado !== filtros.estado) {
        return false
      }
    }

    // Filtro de promociones vigentes
    if (filtros.vigentes) {
      const hoy = new Date()
      const fechaInicio = new Date(promocion.fecha_inicio)
      const fechaFin = new Date(promocion.fecha_fin)
      if (hoy < fechaInicio || hoy > fechaFin) {
        return false
      }
    }

    // Filtro de fecha inicio
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(promocion.fecha_inicio)
      const filtroFechaInicio = new Date(filtros.fechaInicio)
      if (fechaInicio < filtroFechaInicio) {
        return false
      }
    }

    // Filtro de fecha fin
    if (filtros.fechaFin) {
      const fechaFin = new Date(promocion.fecha_fin)
      const filtroFechaFin = new Date(filtros.fechaFin)
      if (fechaFin > filtroFechaFin) {
        return false
      }
    }

    return true
  })

  const exportToCSV = () => {
    const headers = ['ID', 'Descripcion', 'Descuento (%)', 'Fecha Inicio', 'Fecha Fin', 'Estado']
    const rows = promociones.map(p => [
      p.id_promocion,
      p.descripcion,
      p.descuento,
      new Date(p.fecha_inicio).toLocaleDateString(),
      new Date(p.fecha_fin).toLocaleDateString(),
      p.estado === 'ACT' ? 'Activo' : 'Inactivo'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `promociones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Promociones
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de promociones
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
                <th>Descripción</th>
                <th>Descuento</th>
                <th>Vigencia</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : promocionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">🏷️</p>
                    <p>No hay promociones que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                promocionesFiltradas.map((prom) => (
                  <tr key={prom.id_promocion}>
                    <td className="font-mono text-sm">{prom.id_promocion}</td>
                    <td>{prom.descripcion || 'N/A'}</td>
                    <td><span className="badge badge-terracotta">{prom.descuento}%</span></td>
                    <td className="text-sm">{new Date(prom.fecha_inicio).toLocaleDateString('es-ES')}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(prom)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          onClick={() => handleDelete(prom.id_promocion)}
                        >
                          <Trash2 size={16} />
                        </button>
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
              <h3 className="card-title">{editingId ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Descripción <span className="text-danger">*</span>
                  </label>
                  <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} className="input w-full" placeholder="2x1 en Vinos Nacionales" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Descuento (%) <span className="text-danger">*</span>
                  </label>
                  <input type="number" step="0.01" min="0" max="100" name="descuento" value={formData.descuento} onChange={handleChange} className="input w-full" placeholder="15.00" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Fecha Inicio
                    </label>
                    <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Fecha Fin
                    </label>
                    <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} className="input w-full" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Estado
                  </label>
                  <select name="estado" value={formData.estado} onChange={handleChange} className="input w-full">
                    <option value="ACT">Activo</option>
                    <option value="INA">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={createMutation.isPending || updateMutation.isPending}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
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
                  <option value="ACT">Activo</option>
                  <option value="INA">Inactivo</option>
                </select>
              </div>

              {/* Promociones vigentes */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vigentes"
                  checked={filtros.vigentes}
                  onChange={(e) => setFiltros({...filtros, vigentes: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="vigentes" className="text-sm font-medium text-barbox-wine">
                  Solo promociones vigentes
                </label>
              </div>

              {/* Rango de fechas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Fecha inicio desde
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Fecha fin hasta
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setFiltros({ estado: '', vigentes: false, fechaInicio: '', fechaFin: '' })
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
