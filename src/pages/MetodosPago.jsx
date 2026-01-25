import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Edit2, Trash2, X, CreditCard, Monitor, Globe } from 'lucide-react'
import { metodosPagoAPI } from '../services/api'

export default function MetodosPago() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filtros, setFiltros] = useState({
    disponible_pos: '',
    disponible_web: '',
    estado: ''
  })
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    disponible_pos: true,
    disponible_web: true,
    requiere_referencia: false,
    estado: 'ACT'
  })
  const queryClient = useQueryClient()

  // Query métodos de pago
  const { data, isLoading, error } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: () => metodosPagoAPI.listar(),
  })

  const metodosPago = Array.isArray(data?.data?.data) ? data.data.data : 
                      Array.isArray(data?.data) ? data.data : []

  // Filtrado
  const metodosPagoFiltrados = metodosPago.filter(metodo => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (!metodo.codigo?.toLowerCase().includes(searchLower) && 
          !metodo.nombre?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    if (filtros.disponible_pos !== '') {
      const valor = filtros.disponible_pos === 'true'
      if (metodo.disponible_pos !== valor) {
        return false
      }
    }

    if (filtros.disponible_web !== '') {
      const valor = filtros.disponible_web === 'true'
      if (metodo.disponible_web !== valor) {
        return false
      }
    }

    if (filtros.estado && filtros.estado !== '') {
      if (metodo.estado !== filtros.estado) {
        return false
      }
    }

    return true
  })

  const exportToCSV = () => {
    const headers = ['ID', 'Código', 'Nombre', 'POS', 'Web', 'Req. Referencia', 'Estado']
    const rows = metodosPago.map(m => [
      m.id_metodo_pago,
      m.codigo,
      m.nombre,
      m.disponible_pos ? 'Sí' : 'No',
      m.disponible_web ? 'Sí' : 'No',
      m.requiere_referencia ? 'Sí' : 'No',
      m.estado === 'ACT' ? 'Activo' : 'Inactivo'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metodos_pago_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const createMutation = useMutation({
    mutationFn: (data) => metodosPagoAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['metodos-pago'])
      setShowModal(false)
      resetForm()
      alert('Método de pago creado exitosamente')
    },
    onError: (error) => {
      alert('Error: ' + (error.response?.data?.message || error.message || 'Error desconocido'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => metodosPagoAPI.actualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['metodos-pago'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Método de pago actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar: ' + (error.response?.data?.message || error.message))
    }
  })

  const toggleEstadoMutation = useMutation({
    mutationFn: ({ id, estadoActual }) => {
      const nuevoEstado = estadoActual === 'ACT' ? 'INA' : 'ACT'
      return metodosPagoAPI.actualizar(Number(id), { estado: nuevoEstado })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['metodos-pago'])
      alert('Estado actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al cambiar estado: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      disponible_pos: true,
      disponible_web: true,
      requiere_referencia: false,
      estado: 'ACT'
    })
    setEditingId(null)
  }

  const handleEdit = (metodo) => {
    setFormData({
      codigo: metodo.codigo || '',
      nombre: metodo.nombre || '',
      disponible_pos: metodo.disponible_pos !== undefined ? metodo.disponible_pos : true,
      disponible_web: metodo.disponible_web !== undefined ? metodo.disponible_web : true,
      requiere_referencia: metodo.requiere_referencia || false,
      estado: metodo.estado || 'ACT'
    })
    setEditingId(metodo.id_metodo_pago)
    setShowModal(true)
  }

  const handleDelete = (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'ACT' ? 'Inactivo' : 'Activo'
    if (window.confirm(`¿Está seguro de cambiar el estado a ${nuevoEstado}?`)) {
      toggleEstadoMutation.mutate({ id, estadoActual })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.codigo || !formData.nombre) {
      alert('Código y nombre son obligatorios')
      return
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Métodos de Pago
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de métodos de pago disponibles
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
                placeholder="Buscar por código o nombre..."
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
                <th>Código</th>
                <th>Nombre</th>
                <th>POS</th>
                <th>Web</th>
                <th>Req. Referencia</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="8" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : metodosPagoFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">💳</p>
                    <p>No hay métodos de pago que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                metodosPagoFiltrados.map((metodo) => (
                  <tr key={metodo.id_metodo_pago}>
                    <td className="font-mono text-sm">{metodo.id_metodo_pago}</td>
                    <td className="font-mono font-medium">{metodo.codigo}</td>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-barbox-terracotta" />
                        {metodo.nombre}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 ${metodo.disponible_pos ? 'text-success' : 'text-barbox-text-secondary'}`}>
                        <Monitor size={16} />
                        {metodo.disponible_pos ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 ${metodo.disponible_web ? 'text-success' : 'text-barbox-text-secondary'}`}>
                        <Globe size={16} />
                        {metodo.disponible_web ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={metodo.requiere_referencia ? 'text-warning font-medium' : 'text-barbox-text-secondary'}>
                        {metodo.requiere_referencia ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${metodo.estado === 'ACT' ? 'badge-success' : 'badge-warning'}`}>
                        {metodo.estado === 'ACT' ? '✅ Activo' : '⏸️ Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(metodo)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          title="Cambiar Estado"
                          onClick={() => handleDelete(metodo.id_metodo_pago, metodo.estado)}
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
          <div className="card max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title flex items-center gap-2">
                <CreditCard size={20} />
                {editingId ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
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
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    className="input w-full uppercase"
                    placeholder="EFECTIVO"
                    maxLength={20}
                    required
                  />
                  <p className="text-xs text-barbox-text-secondary mt-1">Máximo 20 caracteres, se guardará en mayúsculas</p>
                </div>

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
                    placeholder="Pago en Efectivo"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 border border-barbox-border rounded-lg cursor-pointer hover:bg-barbox-cream transition">
                    <input
                      type="checkbox"
                      name="disponible_pos"
                      checked={formData.disponible_pos}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-barbox-border text-barbox-terracotta focus:ring-barbox-terracotta"
                    />
                    <div>
                      <div className="flex items-center gap-2 font-medium text-barbox-wine">
                        <Monitor size={18} />
                        POS
                      </div>
                      <span className="text-xs text-barbox-text-secondary">Punto de venta</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-barbox-border rounded-lg cursor-pointer hover:bg-barbox-cream transition">
                    <input
                      type="checkbox"
                      name="disponible_web"
                      checked={formData.disponible_web}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-barbox-border text-barbox-terracotta focus:ring-barbox-terracotta"
                    />
                    <div>
                      <div className="flex items-center gap-2 font-medium text-barbox-wine">
                        <Globe size={18} />
                        Web
                      </div>
                      <span className="text-xs text-barbox-text-secondary">E-commerce</span>
                    </div>
                  </label>
                </div>

                <label className="flex items-center gap-3 p-3 border border-barbox-border rounded-lg cursor-pointer hover:bg-barbox-cream transition">
                  <input
                    type="checkbox"
                    name="requiere_referencia"
                    checked={formData.requiere_referencia}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-barbox-border text-barbox-terracotta focus:ring-barbox-terracotta"
                  />
                  <div>
                    <span className="font-medium text-barbox-wine">Requiere Referencia</span>
                    <p className="text-xs text-barbox-text-secondary">Solicitar número de referencia/autorización</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="ACT">Activo</option>
                    <option value="INA">Inactivo</option>
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
              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">
                  Disponible en POS
                </label>
                <select 
                  value={filtros.disponible_pos} 
                  onChange={(e) => setFiltros({...filtros, disponible_pos: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">
                  Disponible en Web
                </label>
                <select 
                  value={filtros.disponible_web} 
                  onChange={(e) => setFiltros({...filtros, disponible_web: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>

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
                    setFiltros({ disponible_pos: '', disponible_web: '', estado: '' })
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
