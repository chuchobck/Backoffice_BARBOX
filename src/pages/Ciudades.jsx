import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Edit2, Trash2, X, MapPin } from 'lucide-react'
import { ciudadesAPI } from '../services/api'

export default function Ciudades() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    id_ciudad: '',
    descripcion: ''
  })
  const queryClient = useQueryClient()

  // Query ciudades
  const { data, isLoading, error } = useQuery({
    queryKey: ['ciudades'],
    queryFn: () => ciudadesAPI.listar(),
  })

  const ciudades = Array.isArray(data?.data?.data) ? data.data.data : 
                   Array.isArray(data?.data) ? data.data : []

  // Filtrado
  const ciudadesFiltradas = ciudades.filter(ciudad => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!ciudad.id_ciudad?.toLowerCase().includes(searchLower) && 
          !ciudad.descripcion?.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    return true
  })

  const exportToCSV = () => {
    const headers = ['Código', 'Descripción']
    const rows = ciudades.map(c => [
      c.id_ciudad,
      c.descripcion
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ciudades_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const createMutation = useMutation({
    mutationFn: (data) => ciudadesAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ciudades'])
      setShowModal(false)
      resetForm()
      alert('Ciudad creada exitosamente')
    },
    onError: (error) => {
      alert('Error: ' + (error.response?.data?.message || error.message || 'Error desconocido'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ciudadesAPI.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ciudades'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Ciudad actualizada exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar: ' + (error.response?.data?.message || error.message))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => ciudadesAPI.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['ciudades'])
      alert('Ciudad eliminada exitosamente')
    },
    onError: (error) => {
      alert('Error al eliminar: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({
      id_ciudad: '',
      descripcion: ''
    })
    setEditingId(null)
  }

  const handleEdit = (ciudad) => {
    setFormData({
      id_ciudad: ciudad.id_ciudad || '',
      descripcion: ciudad.descripcion || ''
    })
    setEditingId(ciudad.id_ciudad)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta ciudad? Solo se puede eliminar si no tiene clientes o proveedores asociados.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.id_ciudad || !formData.descripcion) {
      alert('Código y descripción son obligatorios')
      return
    }

    if (formData.id_ciudad.length !== 3) {
      alert('El código debe tener exactamente 3 caracteres')
      return
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ 
      ...formData, 
      [name]: name === 'id_ciudad' ? value.toUpperCase() : value 
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Ciudades
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Catálogo de ciudades disponibles
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportToCSV}>
            <Download size={18} className="mr-2" />
            Exportar
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" />
            Nueva
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="card">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-barbox-text-secondary" size={20} />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="3" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="3" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : ciudadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">🏙️</p>
                    <p>No hay ciudades que coincidan con la búsqueda</p>
                  </td>
                </tr>
              ) : (
                ciudadesFiltradas.map((ciudad) => (
                  <tr key={ciudad.id_ciudad}>
                    <td className="font-mono font-bold text-barbox-terracotta">{ciudad.id_ciudad}</td>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-barbox-terracotta" />
                        {ciudad.descripcion}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(ciudad)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          title="Eliminar"
                          onClick={() => handleDelete(ciudad.id_ciudad)}
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

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title flex items-center gap-2">
                <MapPin size={20} />
                {editingId ? 'Editar Ciudad' : 'Nueva Ciudad'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Código <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="id_ciudad"
                    value={formData.id_ciudad}
                    onChange={handleChange}
                    className="input w-full uppercase"
                    placeholder="UIO"
                    maxLength={3}
                    required
                    disabled={!!editingId} // No permitir cambiar el código en edición
                  />
                  <p className="text-xs text-barbox-text-secondary mt-1">Exactamente 3 caracteres (ej: UIO, GYE, CUE)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Descripción <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Quito"
                    required
                  />
                </div>
              </div>

              <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setShowModal(false); resetForm(); }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
