import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { ivaAPI } from '../services/api'

export default function IVA() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filtros, setFiltros] = useState({
    estado: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    porcentaje: '',
    descripcion: '',
    estado: 'ACT'
  })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['iva'],
    queryFn: () => ivaAPI.listar(),
  })

  const ivas = Array.isArray(data?.data?.data) ? data.data.data : 
              Array.isArray(data?.data) ? data.data : []

  // Función de filtrado
  const ivasFiltrados = ivas.filter(iva => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!iva.porcentaje?.toString().includes(searchLower) &&
          !iva.descripcion?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de estado
    if (filtros.estado && filtros.estado !== '') {
      if (iva.estado !== filtros.estado) {
        return false
      }
    }

    return true
  })

  const exportToCSV = () => {
    const headers = ['ID', 'Porcentaje', 'Estado']
    const rows = ivas.map(i => [
      i.id_iva,
      i.porcentaje + '%',
      i.estado === 'ACT' ? 'Activo' : 'Inactivo'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iva_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const createMutation = useMutation({
    mutationFn: (data) => ivaAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['iva'])
      setShowModal(false)
      resetForm()
      alert('IVA creado exitosamente')
    },
    onError: (error) => {
      alert('Error: ' + (error.message || 'Error desconocido'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ivaAPI.actualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['iva'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('IVA actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar IVA: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({ porcentaje: '', descripcion: '', estado: 'ACT' })
    setEditingId(null)
  }

  const handleEdit = (iva) => {
    setFormData({
      porcentaje: iva.porcentaje || '',
      descripcion: iva.descripcion || '',
      estado: iva.estado || 'ACT'
    })
    setEditingId(iva.id_iva)
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.porcentaje) {
      alert('El porcentaje es obligatorio')
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
            IVA
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de IVA
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
                <th>Porcentaje</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : ivasFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">📊</p>
                    <p>No hay configuraciones de IVA que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                ivasFiltrados.map((iva) => (
                  <tr key={iva.id_iva}>
                    <td className="font-mono text-sm">{iva.id_iva}</td>
                    <td className="font-semibold text-lg text-barbox-terracotta">{iva.porcentaje}%</td>
                    <td className="text-sm">{new Date(iva.fecha_inicio).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className={`badge ${iva.estado === 'A' ? 'badge-success' : 'badge-warning'}`}>
                        {iva.estado === 'A' ? '✅ Activo' : '⏸️ Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(iva)}
                        >
                          <Edit2 size={16} />
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
              <h3 className="card-title">{editingId ? 'Editar IVA' : 'Nuevo IVA'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Porcentaje <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="porcentaje"
                    value={formData.porcentaje}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="IVA 15%"
                  />
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
                  <option value="A">Activo</option>
                  <option value="I">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setFiltros({ estado: '' })
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
