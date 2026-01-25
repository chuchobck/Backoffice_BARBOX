import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { categoriasAPI } from '../services/api'

export default function Categorias() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filtros, setFiltros] = useState({
    activo: ''
  })
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasAPI.listar(),
  })

  const categorias = Array.isArray(data?.data?.data) ? data.data.data : 
                    Array.isArray(data?.data) ? data.data : []

  // Función de filtrado
  const categoriasFiltradas = categorias.filter(categoria => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!categoria.nombre?.toLowerCase().includes(searchLower) &&
          !categoria.descripcion?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de estado activo
    if (filtros.activo !== '') {
      const isActivo = filtros.activo === 'true'
      if (categoria.activo !== isActivo) {
        return false
      }
    }

    return true
  })

  const exportToCSV = () => {
    const headers = ['ID', 'Nombre', 'Descripción', 'Estado']
    const rows = categorias.map(c => [
      c.id_categoria,
      c.nombre,
      c.descripcion || '',
      c.activo ? 'Activo' : 'Inactivo'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `categorias_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const createMutation = useMutation({
    mutationFn: (data) => categoriasAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categorias'])
      setShowModal(false)
      resetForm()
      alert('Categoría creada exitosamente')
    },
    onError: (error) => {
      alert('Error: ' + (error.message || 'Error desconocido'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoriasAPI.actualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categorias'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Categoría actualizada exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar categoría: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', activo: true })
    setEditingId(null)
  }

  const handleEdit = (categoria) => {
    setFormData({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      activo: categoria.activo !== undefined ? categoria.activo : true
    })
    setEditingId(categoria.id_categoria)
    setShowModal(true)
  }

  const toggleEstadoMutation = useMutation({
    mutationFn: ({ id, estadoActual }) => {
      const nuevoEstado = !estadoActual
      return categoriasAPI.actualizar(Number(id), { activo: nuevoEstado })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categorias'])
      alert('Estado actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al cambiar estado: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleDelete = (id, estadoActual) => {
    const nuevoEstado = estadoActual ? 'Inactiva' : 'Activa'
    if (window.confirm(`¿Está seguro de cambiar el estado a ${nuevoEstado}?`)) {
      toggleEstadoMutation.mutate({ id, estadoActual })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre) {
      alert('El nombre es obligatorio')
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Categorias
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de categorías
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
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">📂</p>
                    <p>No hay categorías que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                categoriasFiltradas.map((cat) => (
                  <tr key={cat.id_categoria}>
                    <td className="font-mono text-sm">{cat.id_categoria}</td>
                    <td className="font-medium">{cat.nombre || 'N/A'}</td>
                    <td className="text-sm text-barbox-text-secondary">{cat.descripcion || 'N/A'}</td>
                    <td>
                      <span className={`badge ${cat.activo ? 'badge-success' : 'badge-warning'}`}>
                        {cat.activo ? '✅ Activa' : '⏸️ Inactiva'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(cat)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          onClick={() => handleDelete(cat.id_categoria, cat.activo)}
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
          <div className="card max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title">{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Nombre <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Whisky"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="input w-full"
                    rows="3"
                    placeholder="Descripción de la categoría"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Estado
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      name="activo" 
                      checked={formData.activo} 
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})} 
                      className="mr-2"
                    />
                    Activo
                  </label>
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
                  value={filtros.activo} 
                  onChange={(e) => setFiltros({...filtros, activo: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setFiltros({ activo: '' })
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
