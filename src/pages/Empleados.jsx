import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Edit2, Trash2, X, User, Eye, EyeOff } from 'lucide-react'
import { empleadosAPI, rolesAPI } from '../services/api'

export default function Empleados() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filtros, setFiltros] = useState({
    id_rol: '',
    estado: ''
  })
  const [formData, setFormData] = useState({
    cedula: '',
    nombre1: '',
    nombre2: '',
    apellido1: '',
    apellido2: '',
    telefono: '',
    id_rol: '',
    usuario: '',
    password: '',
    estado: 'ACT'
  })
  const queryClient = useQueryClient()

  // Query empleados
  const { data, isLoading, error } = useQuery({
    queryKey: ['empleados'],
    queryFn: () => empleadosAPI.listar(),
  })

  const empleados = Array.isArray(data?.data?.data) ? data.data.data : 
                    Array.isArray(data?.data) ? data.data : []

  // Query roles para combobox
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesAPI.listar(),
  })
  const roles = Array.isArray(rolesData?.data?.data) ? rolesData.data.data : 
                Array.isArray(rolesData?.data) ? rolesData.data : []

  // Filtrado
  const empleadosFiltrados = empleados.filter(empleado => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const nombreCompleto = `${empleado.nombre1 || ''} ${empleado.nombre2 || ''} ${empleado.apellido1 || ''} ${empleado.apellido2 || ''}`.toLowerCase()
      if (!nombreCompleto.includes(searchLower) && 
          !empleado.cedula?.toLowerCase().includes(searchLower) &&
          !empleado.usuario?.usuario?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    if (filtros.id_rol && filtros.id_rol !== '') {
      if (empleado.id_rol !== parseInt(filtros.id_rol)) {
        return false
      }
    }

    if (filtros.estado && filtros.estado !== '') {
      if (empleado.estado !== filtros.estado) {
        return false
      }
    }

    return true
  })

  const exportToCSV = () => {
    const headers = ['ID', 'Cédula', 'Nombre Completo', 'Teléfono', 'Usuario', 'Rol', 'Estado']
    const rows = empleados.map(e => [
      e.id_empleado,
      e.cedula,
      `${e.nombre1 || ''} ${e.nombre2 || ''} ${e.apellido1 || ''} ${e.apellido2 || ''}`.trim(),
      e.telefono || '',
      e.usuario?.usuario || '',
      roles.find(r => r.id_rol === e.id_rol)?.nombre || e.id_rol,
      e.estado === 'ACT' ? 'Activo' : 'Inactivo'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `empleados_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const createMutation = useMutation({
    mutationFn: (data) => empleadosAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['empleados'])
      setShowModal(false)
      resetForm()
      alert('Empleado creado exitosamente')
    },
    onError: (error) => {
      alert('Error: ' + (error.response?.data?.message || error.message || 'Error desconocido'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => empleadosAPI.actualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['empleados'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Empleado actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al actualizar: ' + (error.response?.data?.message || error.message))
    }
  })

  const toggleEstadoMutation = useMutation({
    mutationFn: ({ id, estadoActual }) => {
      const nuevoEstado = estadoActual === 'ACT' ? 'INA' : 'ACT'
      return empleadosAPI.actualizar(Number(id), { estado: nuevoEstado })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['empleados'])
      alert('Estado actualizado exitosamente')
    },
    onError: (error) => {
      alert('Error al cambiar estado: ' + (error.response?.data?.message || error.message))
    }
  })

  const resetForm = () => {
    setFormData({
      cedula: '',
      nombre1: '',
      nombre2: '',
      apellido1: '',
      apellido2: '',
      telefono: '',
      id_rol: '',
      usuario: '',
      password: '',
      estado: 'ACT'
    })
    setEditingId(null)
    setShowPassword(false)
  }

  const handleEdit = (empleado) => {
    setFormData({
      cedula: empleado.cedula || '',
      nombre1: empleado.nombre1 || '',
      nombre2: empleado.nombre2 || '',
      apellido1: empleado.apellido1 || '',
      apellido2: empleado.apellido2 || '',
      telefono: empleado.telefono || '',
      id_rol: empleado.id_rol || '',
      usuario: empleado.usuario?.usuario || '',
      password: '', // No se muestra la contraseña
      estado: empleado.estado || 'ACT'
    })
    setEditingId(empleado.id_empleado)
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
    
    // Validaciones
    if (!formData.cedula || !formData.nombre1 || !formData.apellido1 || !formData.id_rol) {
      alert('Cédula, primer nombre, primer apellido y rol son obligatorios')
      return
    }

    if (!editingId && (!formData.usuario || !formData.password)) {
      alert('Usuario y contraseña son obligatorios para nuevos empleados')
      return
    }

    if (!editingId && formData.password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres')
      return
    }

    // Preparar datos
    const dataToSend = { ...formData }
    if (editingId && !dataToSend.password) {
      delete dataToSend.password // No enviar password vacío en edición
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSend })
    } else {
      createMutation.mutate(dataToSend)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Empleados
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de empleados y usuarios del sistema
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
                placeholder="Buscar por nombre, cédula o usuario..."
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
                <th>Cédula</th>
                <th>Nombre Completo</th>
                <th>Teléfono</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="8" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : empleadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">👥</p>
                    <p>No hay empleados que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id_empleado}>
                    <td className="font-mono text-sm">{empleado.id_empleado}</td>
                    <td className="font-mono">{empleado.cedula}</td>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-barbox-terracotta to-barbox-terracotta-dark flex items-center justify-center text-white text-sm font-semibold">
                          {empleado.nombre1?.charAt(0) || 'E'}
                        </div>
                        {`${empleado.nombre1 || ''} ${empleado.nombre2 || ''} ${empleado.apellido1 || ''} ${empleado.apellido2 || ''}`.trim()}
                      </div>
                    </td>
                    <td>{empleado.telefono || 'N/A'}</td>
                    <td className="text-sm text-barbox-text-secondary">{empleado.usuario?.usuario || 'N/A'}</td>
                    <td>
                      <span className="badge badge-info">
                        {roles.find(r => r.id_rol === empleado.id_rol)?.nombre || empleado.id_rol}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${empleado.estado === 'ACT' ? 'badge-success' : 'badge-warning'}`}>
                        {empleado.estado === 'ACT' ? '✅ Activo' : '⏸️ Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => handleEdit(empleado)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          title="Cambiar Estado"
                          onClick={() => handleDelete(empleado.id_empleado, empleado.estado)}
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
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="card-title flex items-center gap-2">
                <User size={20} />
                {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-barbox-cream rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {/* Datos Personales */}
                <div>
                  <h4 className="text-sm font-semibold text-barbox-wine mb-3 uppercase tracking-wide">
                    Datos Personales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-barbox-wine mb-1">
                        Cédula <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="cedula"
                        value={formData.cedula}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="1234567890"
                        maxLength={13}
                        required
                      />
                      <p className="text-xs text-barbox-text-secondary mt-1">10 dígitos para cédula ecuatoriana</p>
                    </div>
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
                        placeholder="García"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-barbox-wine mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="0987654321"
                      />
                      <p className="text-xs text-barbox-text-secondary mt-1">Formato: 09XXXXXXXX (celular)</p>
                    </div>
                  </div>
                </div>

                {/* Datos de Acceso */}
                <div>
                  <h4 className="text-sm font-semibold text-barbox-wine mb-3 uppercase tracking-wide">
                    Datos de Acceso al Sistema
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-barbox-wine mb-1">
                        Rol <span className="text-danger">*</span>
                      </label>
                      <select
                        name="id_rol"
                        value={formData.id_rol}
                        onChange={handleChange}
                        className="input w-full"
                        required
                      >
                        <option value="">Seleccionar rol...</option>
                        {roles.map(rol => (
                          <option key={rol.id_rol} value={rol.id_rol}>
                            {rol.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
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
                    <div>
                      <label className="block text-sm font-medium text-barbox-wine mb-1">
                        Usuario (Email) {!editingId && <span className="text-danger">*</span>}
                      </label>
                      <input
                        type="email"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="usuario@empresa.com"
                        required={!editingId}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-barbox-wine mb-1">
                        Contraseña {!editingId && <span className="text-danger">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="input w-full pr-10"
                          placeholder={editingId ? '(dejar vacío para no cambiar)' : 'Mínimo 8 caracteres'}
                          required={!editingId}
                          minLength={!editingId ? 8 : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-barbox-text-secondary hover:text-barbox-wine"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {editingId && (
                        <p className="text-xs text-barbox-text-secondary mt-1">
                          Dejar vacío para mantener la contraseña actual
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-barbox-border flex justify-end gap-2 sticky bottom-0 bg-white">
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
                  Rol
                </label>
                <select 
                  value={filtros.id_rol} 
                  onChange={(e) => setFiltros({...filtros, id_rol: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos los roles</option>
                  {roles.map(rol => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </option>
                  ))}
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
                    setFiltros({ id_rol: '', estado: '' })
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
