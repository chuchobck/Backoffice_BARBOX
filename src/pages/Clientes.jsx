import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { clientesAPI } from '../services/api'

export default function Clientes() {
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
    ruc_cedula: '',
    nombre1: '',
    nombre2: '',
    apellido1: '',
    apellido2: '',
    email: '',
    telefono: '',
    direccion: '',
    id_ciudad: 'GYE'
  })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.listar(),
  })

  const clientes = Array.isArray(data?.data?.data) ? data.data.data : 
                  Array.isArray(data?.data) ? data.data : []

  // Aplicar filtros
  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro de búsqueda
    const matchSearch = !searchTerm || 
      cliente.nombre1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.apellido1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.ruc_cedula?.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de ciudad
    const matchCiudad = !filtros.ciudad || cliente.id_ciudad === filtros.ciudad
    
    return matchSearch && matchCiudad
  })

  // Función para exportar a CSV
  const exportToCSV = () => {
    const headers = ['ID', 'RUC/Cédula', 'Primer Nombre', 'Segundo Nombre', 'Primer Apellido', 'Segundo Apellido', 'Teléfono', 'Email', 'Dirección']
    const rows = clientes.map(c => [
      c.id_cliente,
      c.ruc_cedula || '',
      c.nombre1 || '',
      c.nombre2 || '',
      c.apellido1 || '',
      c.apellido2 || '',
      c.telefono || '',
      c.email || '',
      c.direccion || ''
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => clientesAPI.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
      alert('Cliente eliminado')
    },
    onError: (error) => {
      alert('Error al eliminar: ' + (error.response?.data?.message || error.message))
    }
  })

  const createMutation = useMutation({
    mutationFn: (data) => clientesAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
      setShowModal(false)
      resetForm()
      alert('Cliente creado exitosamente')
    },
    onError: (error) => {
      alert('Error al crear cliente: ' + (error.response?.data?.message || error.message))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => clientesAPI.actualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Cliente actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar cliente: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({
      ruc_cedula: '',
      nombre1: '',
      nombre2: '',
      apellido1: '',
      apellido2: '',
      email: '',
      telefono: '',
      direccion: '',
      id_ciudad: 'GYE'
    })
    setEditingId(null)
  }

  const handleEdit = (cliente) => {
    setFormData({
      ruc_cedula: cliente.ruc_cedula || '',
      nombre1: cliente.nombre1 || '',
      nombre2: cliente.nombre2 || '',
      apellido1: cliente.apellido1 || '',
      apellido2: cliente.apellido2 || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      id_ciudad: cliente.id_ciudad || 'GYE'
    })
    setEditingId(cliente.id_cliente)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      deleteMutation.mutate(Number(id))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.ruc_cedula || !formData.nombre1 || !formData.apellido1) {
      alert('RUC/Cédula, Primer nombre y Primer apellido son obligatorios')
      return
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Clientes
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de clientes
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
                <th>RUC/Cédula</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center py-8 text-danger">Error al cargar clientes</td></tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">👥</p>
                    <p>No hay clientes{searchTerm || Object.values(filtros).some(v => v) ? ' que coincidan con los filtros' : ''}</p>
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente, index) => {
                  return (
                  <tr key={cliente.id_cliente}>
                    <td className="font-mono text-sm">{cliente.id_cliente}</td>
                    <td className="font-medium">{`${cliente.nombre1 || ''} ${cliente.nombre2 || ''} ${cliente.apellido1 || ''} ${cliente.apellido2 || ''}`.trim()}</td>
                    <td>{cliente.ruc_cedula || 'N/A'}</td>
                    <td>{cliente.telefono || 'N/A'}</td>
                    <td>{cliente.email || 'N/A'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => {
                            setViewingItem(cliente)
                            setShowViewModal(true)
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          onClick={() => deleteMutation.mutate(cliente.id_cliente)}
                        >
                          <Trash2 size={16} />
                        </button>
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
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* RUC/Cédula */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    RUC/Cédula <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="ruc_cedula"
                    value={formData.ruc_cedula}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="0999999999"
                    required
                  />
                </div>

                {/* Primer Nombre */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Primer Nombre <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre1"
                    value={formData.nombre1}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Juan"
                    required
                  />
                </div>

                {/* Segundo Nombre */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Segundo Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre2"
                    value={formData.nombre2}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Carlos"
                  />
                </div>

                {/* Primer Apellido */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Primer Apellido <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="apellido1"
                    value={formData.apellido1}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Pérez"
                    required
                  />
                </div>

                {/* Segundo Apellido */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Segundo Apellido
                  </label>
                  <input
                    type="text"
                    name="apellido2"
                    value={formData.apellido2}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="López"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="0987654321"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="input w-full"
                    rows="3"
                    placeholder="Av. Principal y Calle 123"
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Ciudad
                  </label>
                  <select
                    name="id_ciudad"
                    value={formData.id_ciudad}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="GYE">Guayaquil</option>
                    <option value="UIO">Quito</option>
                    <option value="CUE">Cuenca</option>
                  </select>
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

      {/* Modal de Vista */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-barbox-border flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-barbox-wine">Detalles del Cliente</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-barbox-cream rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-barbox-text-secondary">ID</p>
                  <p className="font-semibold">{viewingItem.id_cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">RUC/Cédula</p>
                  <p className="font-semibold">{viewingItem.ruc_cedula}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Primer Nombre</p>
                  <p className="font-semibold">{viewingItem.nombre1}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Segundo Nombre</p>
                  <p className="font-semibold">{viewingItem.nombre2 || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Primer Apellido</p>
                  <p className="font-semibold">{viewingItem.apellido1}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Segundo Apellido</p>
                  <p className="font-semibold">{viewingItem.apellido2 || 'N/A'}</p>
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
                <label className="block text-sm font-medium text-barbox-wine mb-1">Ciudad</label>
                <select 
                  value={filtros.ciudad} 
                  onChange={(e) => setFiltros({...filtros, ciudad: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todas las ciudades</option>
                  <option value="GYE">Guayaquil</option>
                  <option value="UIO">Quito</option>
                  <option value="CUE">Cuenca</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setFiltros({
                    ciudad: '',
                    estado: ''
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
