import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { proveedoresAPI } from '../services/api'

export default function Proveedores() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filtros, setFiltros] = useState({
    ciudad: '',
    estado: ''
  })
  const [viewingItem, setViewingItem] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    email: '',
    telefono: '',
    direccion: '',
    id_ciudad: 'GYE'
  })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => proveedoresAPI.listar(),
  })

  const proveedores = Array.isArray(data?.data?.data) ? data.data.data : 
                     Array.isArray(data?.data) ? data.data : []

  // Función de filtrado
  const proveedoresFiltrados = proveedores.filter(proveedor => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!proveedor.nombre?.toLowerCase().includes(searchLower) &&
          !proveedor.ruc?.toLowerCase().includes(searchLower) &&
          !proveedor.email?.toLowerCase().includes(searchLower) &&
          !proveedor.telefono?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de ciudad
    if (filtros.ciudad && filtros.ciudad !== '') {
      if (proveedor.id_ciudad !== filtros.ciudad) {
        return false
      }
    }

    // Filtro de estado (si existe el campo)
    if (filtros.estado && filtros.estado !== '') {
      if (proveedor.estado !== filtros.estado) {
        return false
      }
    }

    return true
  })

  // Función para exportar a CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Nombre', 'RUC', 'Teléfono', 'Email', 'Dirección', 'Ciudad']
    const rows = proveedores.map(p => [
      p.id_proveedor,
      p.nombre || '',
      p.ruc || '',
      p.telefono || '',
      p.email || '',
      p.direccion || '',
      p.id_ciudad || ''
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proveedores_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const toggleEstadoMutation = useMutation({
    mutationFn: ({ id, proveedor }) => {
      const nuevoEstado = proveedor.estado === 'ACT' ? 'INA' : 'ACT'
      console.log('Cambiando estado del proveedor:', id, 'de', proveedor.estado, 'a', nuevoEstado)
      const dataToUpdate = {
        nombre: proveedor.nombre,
        nombre_contacto: proveedor.nombre_contacto,
        telefono: proveedor.telefono,
        email: proveedor.email,
        direccion: proveedor.direccion,
        estado: nuevoEstado
      }
      return proveedoresAPI.actualizar(id, dataToUpdate)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proveedores'])
      alert('Estado actualizado exitosamente')
    },
    onError: (error) => {
      console.error('Error al cambiar estado:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido al cambiar estado'
      alert('Error al cambiar estado: ' + errorMsg)
    }
  })

  const createMutation = useMutation({
    mutationFn: (data) => proveedoresAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['proveedores'])
      setShowModal(false)
      resetForm()
      alert('Proveedor creado exitosamente')
    },
    onError: (error) => {
      console.error('Error al crear proveedor:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido'
      alert('Error al crear proveedor: ' + errorMsg)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => proveedoresAPI.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['proveedores'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Proveedor actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar proveedor: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({
      nombre: '',
      ruc: '',
      email: '',
      telefono: '',
      direccion: '',
      id_ciudad: 'GYE'
    })
    setEditingId(null)
  }

  const handleEdit = (proveedor) => {
    // Validar que el ID exista y no esté vacío
    if (!proveedor.id_proveedor || proveedor.id_proveedor.toString().trim() === '') {
      alert('Error: ID de proveedor inválido')
      return
    }
    
    setFormData({
      nombre: proveedor.nombre || '',
      ruc: proveedor.ruc || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      id_ciudad: proveedor.id_ciudad || 'GYE'
    })
    setEditingId(proveedor.id_proveedor)
    setShowModal(true)
  }

  const handleDelete = (id, proveedor) => {
    // Validar que el ID exista y no esté vacío
    if (!id || id.toString().trim() === '') {
      alert('Error: ID de proveedor inválido')
      return
    }
    
    const nuevoEstado = proveedor.estado === 'ACT' ? 'Inactivo' : 'Activo'
    if (window.confirm(`¿Está seguro de cambiar el estado a ${nuevoEstado}?`)) {
      toggleEstadoMutation.mutate({ id, proveedor })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.ruc) {
      alert('Nombre y RUC son obligatorios')
      return
    }
    if (editingId) {
      // Validar que editingId exista y no esté vacío
      if (!editingId || editingId.toString().trim() === '') {
        alert('Error: ID de proveedor inválido para editar')
        return
      }
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
            Proveedores
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de proveedores
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
                <th>RUC</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">🏢</p>
                    <p>No hay proveedores que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((prov) => (
                  <tr key={prov.id_proveedor}>
                    <td className="font-mono text-sm">{prov.id_proveedor}</td>
                    <td className="font-medium">{prov.nombre || 'N/A'}</td>
                    <td>{prov.ruc || 'N/A'}</td>
                    <td>{prov.telefono || 'N/A'}</td>
                    <td>{prov.email || 'N/A'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => {
                            setViewingItem(prov)
                            setShowViewModal(true)
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(prov)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          onClick={() => handleDelete(prov.id_proveedor, prov)}
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
              <h3 className="card-title">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Nombre/Razón Social <span className="text-danger">*</span>
                  </label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="input w-full" placeholder="Distribuidora ABC" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    RUC <span className="text-danger">*</span>
                  </label>
                  <input type="text" name="ruc" value={formData.ruc} onChange={handleChange} className="input w-full" placeholder="1234567890" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Teléfono
                  </label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="input w-full" placeholder="0987654321" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Email
                  </label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="input w-full" placeholder="contacto@distribuidor.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Dirección
                  </label>
                  <textarea name="direccion" value={formData.direccion} onChange={handleChange} className="input w-full" rows="2" placeholder="Av. Principal 123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Ciudad
                  </label>
                  <select name="id_ciudad" value={formData.id_ciudad} onChange={handleChange} className="input w-full">
                    <option value="GYE">Guayaquil</option>
                    <option value="UIO">Quito</option>
                    <option value="CUE">Cuenca</option>
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

      {/* Modal de Vista */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-barbox-border flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-barbox-wine">Detalles del Proveedor</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-barbox-cream rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-barbox-text-secondary">ID</p>
                  <p className="font-semibold">{viewingItem.id_proveedor}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">RUC</p>
                  <p className="font-semibold">{viewingItem.ruc || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-barbox-text-secondary">Nombre</p>
                  <p className="font-semibold">{viewingItem.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Teléfono</p>
                  <p className="font-semibold">{viewingItem.telefono || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Email</p>
                  <p className="font-semibold">{viewingItem.email || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-barbox-text-secondary">Dirección</p>
                  <p className="font-semibold">{viewingItem.direccion || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-barbox-text-secondary">Ciudad</p>
                  <p className="font-semibold">{viewingItem.id_ciudad || 'N/A'}</p>
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
              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">
                  Ciudad
                </label>
                <select 
                  value={filtros.ciudad} 
                  onChange={(e) => setFiltros({...filtros, ciudad: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todas las ciudades</option>
                  <option value="GYE">Guayaquil</option>
                  <option value="QTO">Quito</option>
                  <option value="CUE">Cuenca</option>
                  <option value="AMB">Ambato</option>
                  <option value="MAC">Machala</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setFiltros({ ciudad: '', estado: '' })
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
