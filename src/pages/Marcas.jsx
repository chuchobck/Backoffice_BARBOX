import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { marcasAPI, categoriasAPI } from '../services/api'

export default function Marcas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filtros, setFiltros] = useState({
    categoria: '',
    estado: ''  // Cambiado para mostrar todas las marcas por defecto
  })
  const [formData, setFormData] = useState({
    nombre: '',
    id_categoria: '',
    pais_origen: '',
    imagen_url: '',
    estado: 'ACT'
  })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => marcasAPI.listar(),
  })

  const marcas = Array.isArray(data?.data?.data) ? data.data.data : 
                Array.isArray(data?.data) ? data.data : []

  // Función de filtrado
  const marcasFiltradas = marcas.filter(marca => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!marca.nombre?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de categoría
    if (filtros.categoria && filtros.categoria !== '') {
      if (marca.id_categoria !== parseInt(filtros.categoria)) {
        return false
      }
    }

    // Filtro de estado
    if (filtros.estado && filtros.estado !== '') {
      if (marca.estado !== filtros.estado) {
        return false
      }
    }

    return true
  })

  // Query para categorías
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasAPI.listar(),
  })
  const categorias = Array.isArray(categoriasData?.data?.data) ? categoriasData.data.data : 
                    Array.isArray(categoriasData?.data) ? categoriasData.data : []

  const exportToCSV = () => {
    const headers = ['ID', 'Nombre', 'País', 'Imagen URL', 'Estado']
    const rows = marcas.map(m => [
      m.id_marca,
      m.nombre,
      m.pais_origen || '',
      m.imagen_url || '',
      m.estado === 'ACT' ? 'Activo' : 'Inactivo'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marcas_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const toggleEstadoMutation = useMutation({
    mutationFn: async ({ id, estadoActual }) => {
      const nuevoEstado = estadoActual === 'ACT' ? 'INA' : 'ACT'
      
      // Usar el endpoint específico de estado
      try {
        const response = await marcasAPI.cambiarEstado(Number(id), nuevoEstado)
        return response
      } catch (error) {
        // Fallback al PUT general si falla el específico
        const response = await marcasAPI.actualizar(Number(id), { estado: nuevoEstado })
        return response
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marcas'])
      alert('Estado de la marca actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al cambiar estado: ' + (error.response?.data?.message || error.message))
    }
  })

  const createMutation = useMutation({
    mutationFn: (data) => marcasAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['marcas'])
      setShowModal(false)
      resetForm()
      alert('Marca creada exitosamente')
    },
    onError: (error) => {
      alert('Error: ' + (error.message || 'Error desconocido'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => marcasAPI.actualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['marcas'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Marca actualizada exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar marca: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({ nombre: '', id_categoria: '', pais_origen: '', imagen_url: '', estado: 'ACT' })
    setEditingId(null)
  }

  const handleEdit = (marca) => {
    setFormData({
      nombre: marca.nombre || '',
      id_categoria: marca.id_categoria || '',
      pais_origen: marca.pais_origen || '',
      imagen_url: marca.imagen_url || '',
      estado: marca.estado || 'ACT'
    })
    setEditingId(marca.id_marca)
    setShowModal(true)
  }

  const handleDelete = (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'ACT' ? 'Inactiva' : 'Activa'
    if (window.confirm(`¿Está seguro de cambiar el estado a ${nuevoEstado}?`)) {
      toggleEstadoMutation.mutate({ id, estadoActual })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.id_categoria) {
      alert('Nombre y categoría son obligatorios')
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
            Marcas
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de marcas
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
                <th>Imagen</th>
                <th>Nombre</th>
                <th>País</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : marcasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">🎯</p>
                    <p>No hay marcas que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                marcasFiltradas.map((marca) => (
                  <tr key={marca.id_marca}>
                    <td className="font-mono text-sm">{marca.id_marca}</td>
                    <td>
                      {marca.imagen_url ? (
                        <img 
                          src={marca.imagen_url} 
                          alt={marca.nombre}
                          className="w-12 h-12 object-cover rounded-lg border border-barbox-border"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-barbox-cream rounded-lg flex items-center justify-center text-barbox-text-secondary text-xs border border-barbox-border">
                          Sin imagen
                        </div>
                      )}
                    </td>
                    <td className="font-medium">{marca.nombre || 'N/A'}</td>
                    <td>{marca.pais_origen || 'N/A'}</td>
                    <td>
                      <span className={`badge ${marca.estado === 'ACT' ? 'badge-success' : 'badge-warning'}`}>
                        {marca.estado === 'ACT' ? '✅ Activa' : '⏸️ Inactiva'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(marca)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          title="Cambiar Estado"
                          onClick={() => handleDelete(marca.id_marca, marca.estado)}
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
              <h3 className="card-title">{editingId ? 'Editar Marca' : 'Nueva Marca'}</h3>
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
                    placeholder="Johnnie Walker"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    País de Origen
                  </label>
                  <input
                    type="text"
                    name="pais_origen"
                    value={formData.pais_origen}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Escocia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Imagen (URL)
                  </label>
                  <input
                    type="url"
                    name="imagen_url"
                    value={formData.imagen_url}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <p className="text-xs text-barbox-text-secondary mt-1">URL de la imagen del producto</p>
                  {formData.imagen_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.imagen_url} 
                        alt="Vista previa"
                        className="w-20 h-20 object-cover rounded-lg border border-barbox-border"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'block'
                        }}
                      />
                      <p className="text-xs text-danger mt-1" style={{display: 'none'}}>Error al cargar la imagen</p>
                    </div>
                  )}
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
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">
                  Categoría
                </label>
                <select 
                  value={filtros.categoria} 
                  onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre}
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
                  <option value="">Todos</option>
                  <option value="ACT">Activo</option>
                  <option value="INA">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setFiltros({ categoria: '', estado: '' })
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
