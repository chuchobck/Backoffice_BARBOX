import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Eye, Edit2, Trash2, X } from 'lucide-react'
import { productosAPI, categoriasAPI, marcasAPI, ivaAPI } from '../services/api'
import api from '../lib/axios'

export default function Productos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filtros, setFiltros] = useState({
    categoria: '',
    marca: '',
    estado: '',  // Cambiado de 'ACT' a '' para mostrar todos por defecto
    stockBajo: false,
    precioMin: '',
    precioMax: ''
  })
  const [viewingProduct, setViewingProduct] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    descripcion: '',
    precio_venta: '',
    precio_compra: '', // Backend field name
    stock_minimo: '',
    stock_actual: '',
    id_categoria: '',
    id_marca: '',
    id_iva: '',
    volumen: '',
    alcohol_vol: '',
    origen: '',
    notas_cata: '',
    imagen_url: '',
    estado: 'ACT'
  })
  const queryClient = useQueryClient()

  // Query para listar productos
  const { data, isLoading, error } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosAPI.listar(),
  })

  const productos = Array.isArray(data?.data?.data) ? data.data.data : 
                   Array.isArray(data?.data) ? data.data : []

  // Aplicar filtros - VERSIÓN SIMPLE Y DEBUGGEADA
  const productosFiltrados = productos.filter(producto => {
    // Filtro de búsqueda
    const matchSearch = !searchTerm || 
      producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.id_producto?.toString().includes(searchTerm)
    
    // Filtro de categoría
    const matchCategoria = !filtros.categoria || producto.id_categoria === parseInt(filtros.categoria)
    
    // Filtro de marca
    const matchMarca = !filtros.marca || producto.id_marca === parseInt(filtros.marca)
    
    // Filtro de estado - CON DEBUG
    let matchEstado = true
    if (filtros.estado) {
      matchEstado = producto.estado === filtros.estado
      if (!matchEstado && filtros.estado === 'INA') {
        console.log(`❌ Producto ${producto.id_producto} no pasa filtro INA: estado actual = ${producto.estado}`)
      }
    }
    
    // Filtro de stock bajo
    const matchStockBajo = !filtros.stockBajo || 
      (producto.stock_actual || 0) <= (producto.stock_minimo || 0)
    
    // Filtro de precio
    const precio = parseFloat(producto.precio_venta || 0)
    const matchPrecioMin = !filtros.precioMin || precio >= parseFloat(filtros.precioMin)
    const matchPrecioMax = !filtros.precioMax || precio <= parseFloat(filtros.precioMax)
    
    return matchSearch && matchCategoria && matchMarca && matchEstado && 
           matchStockBajo && matchPrecioMin && matchPrecioMax
  })

  // DEBUG de filtros cuando hay filtro de estado
  if (filtros.estado) {
    console.log(`🔍 FILTRO ESTADO ACTIVO: ${filtros.estado}`)
    console.log(`📊 Total productos: ${productos.length}`)
    console.log(`📊 Productos filtrados: ${productosFiltrados.length}`)
    
    const productosINA = productos.filter(p => p.estado === 'INA')
    const productosACT = productos.filter(p => p.estado === 'ACT')
    console.log(`📊 Productos INA en BD: ${productosINA.length}`)
    console.log(`📊 Productos ACT en BD: ${productosACT.length}`)
    
    if (filtros.estado === 'INA' && productosINA.length > 0) {
      console.log('🎯 Productos INA encontrados:', productosINA.map(p => ({ id: p.id_producto, estado: p.estado })))
    }
  }

  // Función para exportar a CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Descripción', 'Precio Compra', 'Precio Venta', 'Stock Actual', 'Stock Mínimo', 'Categoría', 'Marca', 'Imagen URL', 'Estado']
    const rows = productos.map(p => [
      p.id_producto,
      p.descripcion,
      Number(p.precio_compra || 0).toFixed(2),
      Number(p.precio_venta || 0).toFixed(2),
      p.stock_actual || 0,
      p.stock_minimo || 0,
      categorias.find(c => c.id_categoria === p.id_categoria)?.nombre || 'N/A',
      marcas.find(m => m.id_marca === p.id_marca)?.nombre || 'N/A',
      p.imagen_url || '',
      p.estado === 'ACT' ? 'Activo' : 'Inactivo'
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Queries para los selects
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasAPI.listar(),
  })
  const categorias = Array.isArray(categoriasData?.data?.data) ? categoriasData.data.data : 
                    Array.isArray(categoriasData?.data) ? categoriasData.data : []

  const { data: marcasData } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => marcasAPI.listar(),
  })
  const marcas = Array.isArray(marcasData?.data?.data) ? marcasData.data.data : 
                Array.isArray(marcasData?.data) ? marcasData.data : []

  const { data: ivasData } = useQuery({
    queryKey: ['iva'],
    queryFn: () => ivaAPI.listar(),
  })
  const ivas = Array.isArray(ivasData?.data?.data) ? ivasData.data.data : 
              Array.isArray(ivasData?.data) ? ivasData.data : []

  // Mutation para cambiar estado - VERSIÓN SIMPLE
  const toggleEstadoMutation = useMutation({
    mutationFn: async ({ id, estadoActual }) => {
      const nuevoEstado = estadoActual === 'ACT' ? 'INA' : 'ACT'
      console.log(`🔄 Cambiando ${id} de ${estadoActual} a ${nuevoEstado}`)
      
      // Usar solo PUT directo - simple y funcional
      return await productosAPI.actualizar(id.toString(), { estado: nuevoEstado })
    },
    onSuccess: (data, { id, estadoActual }) => {
      const nuevoEstado = estadoActual === 'ACT' ? 'INA' : 'ACT'
      console.log(`✅ Éxito: Producto ${id} ahora es ${nuevoEstado}`)
      console.log('Response:', data.data)
      
      // Forzar refresh completo
      queryClient.invalidateQueries(['productos'])
      
      // Confirmar cambio al usuario
      alert(`Producto ${nuevoEstado === 'INA' ? 'desactivado' : 'activado'} exitosamente`)
    },
    onError: (error, { id }) => {
      console.error(`❌ Error cambiando estado de ${id}:`, error)
      alert('Error al cambiar estado: ' + (error.response?.data?.message || error.message))
    }
  })

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: (data) => productosAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productos'])
      setShowModal(false)
      resetForm()
      alert('Producto creado exitosamente')
    },
    onError: (error) => {
      alert('Error: ' + (error.message || 'Error desconocido'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      return productosAPI.actualizar(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['productos'])
      setShowModal(false)
      resetForm()
      setEditingId(null)
      alert('Producto actualizado exitosamente')
    },
    onError: (error) => {
      console.error('Update mutation error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      })
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido'
      alert('Error al actualizar producto: ' + errorMsg)
    }
  })

  const resetForm = () => {
    setFormData({
      descripcion: '',
      precio_venta: '',
      precio_compra: '',
      stock_minimo: '',
      stock_actual: '',
      id_categoria: '',
      id_marca: '',
      id_iva: '',
      volumen: '',
      alcohol_vol: '',
      origen: '',
      notas_cata: '',
      imagen_url: '',
      estado: 'ACT'
    })
    setEditingId(null)
  }

  const handleEdit = (producto) => {
    // Backend expects alphanumeric ID (P000016)
    const productId = producto.id_producto
    
    // Map frontend form fields to backend expected structure
    setFormData({
      descripcion: producto.descripcion || '',
      precio_venta: producto.precio_venta || '',
      precio_compra: producto.precio_compra || '', 
      stock_minimo: producto.stock_minimo || '',
      stock_actual: producto.stock_actual || '',
      id_categoria: producto.id_categoria || '',
      id_marca: producto.id_marca || '',
      id_iva: producto.id_iva || '',
      volumen: producto.volumen || '',
      alcohol_vol: producto.alcohol_vol || '',
      origen: producto.origen || '',
      notas_cata: producto.notas_cata || '',
      imagen_url: producto.imagen_url || '',
      estado: producto.estado || 'ACT'
    })
    setEditingId(productId)
    setShowModal(true)
  }

  const handleDelete = (producto) => {
    // Use alphanumeric ID as backend expects
    const productId = typeof producto === 'object' ? producto.id_producto : producto
    const estadoActual = typeof producto === 'object' ? producto.estado : 'ACT'
    
    // Validar que el ID exista
    if (!productId || productId.toString().trim() === '') {
      alert('Error: ID de producto inválido para cambiar estado')
      return
    }

    console.log('ID del producto:', productId, 'Estado actual:', estadoActual)
    const nuevoEstado = estadoActual === 'ACT' ? 'Inactivo' : 'Activo'
    if (window.confirm(`¿Está seguro de cambiar el estado a ${nuevoEstado}?`)) {
      toggleEstadoMutation.mutate({ id: productId.toString(), estadoActual })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.descripcion || !formData.precio_venta) {
      alert('Descripción y Precio de venta son obligatorios')
      return
    }
    
    if (editingId) {
      // Filter only valid backend fields (remove empty values)
      const backendData = Object.entries(formData)
        .filter(([key, value]) => value !== '' && value != null)
        .reduce((obj, [key, value]) => {
          obj[key] = value
          return obj
        }, {})
      
      updateMutation.mutate({ id: editingId, data: backendData })
    } else {
      // For create, ensure required fields are present
      const createData = {
        ...formData,
        precio_venta: Number(formData.precio_venta),
        precio_compra: Number(formData.precio_compra || 0),
        stock_minimo: Number(formData.stock_minimo || 0),
        stock_actual: Number(formData.stock_actual || 0)
      }
      createMutation.mutate(createData)
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
            Productos
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de inventario
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
                <th className="text-right">Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="inline-block">Cargando...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-danger">
                    Error al cargar productos
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">📦</p>
                    <p>No hay productos{searchTerm || Object.values(filtros).some(v => v) ? ' que coincidan con los filtros' : ''}</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod, index) => {
                  const prodId = prod.id_producto;
                  return (
                  <tr key={prodId}>
                    <td className="font-mono text-sm">{prodId}</td>
                    <td>
                      {prod.imagen_url ? (
                        <img 
                          src={prod.imagen_url} 
                          alt={prod.descripcion}
                          className="w-12 h-12 object-cover rounded-lg border border-barbox-border"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-barbox-cream rounded-lg flex items-center justify-center text-barbox-text-secondary text-xs border border-barbox-border">
                          Sin imagen
                        </div>
                      )}
                    </td>
                    <td className="font-medium">{prod.descripcion || 'N/A'}</td>
                    <td className="text-right font-semibold">${Number(prod.precio_venta || 0).toFixed(2)}</td>
                    <td>{prod.stock_actual || 0}</td>
                    <td>
                      <span className={`badge ${prod.estado === 'ACT' ? 'badge-success' : 'badge-warning'}`}>
                        {prod.estado === 'ACT' ? '✅ Activo' : '⏸️ Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition" 
                          title="Ver"
                          onClick={() => {
                            setViewingProduct(prod)
                            setShowViewModal(true)
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition" 
                          title="Editar"
                          onClick={() => handleEdit(prod)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="p-2 hover:bg-danger/10 rounded transition text-danger"
                          title="Cambiar Estado"
                          onClick={() => handleDelete(prod)}
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
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex items-center justify-between">
              <h3 className="card-title">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
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
                  <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} className="input w-full" placeholder="Whisky Johnnie Walker Etiqueta Roja" required />
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Precio Compra
                    </label>
                    <input type="number" step="0.01" name="precio_compra" value={formData.precio_compra} onChange={handleChange} className="input w-full" placeholder="25.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Precio Venta <span className="text-danger">*</span>
                    </label>
                    <input type="number" step="0.01" name="precio_venta" value={formData.precio_venta} onChange={handleChange} className="input w-full" placeholder="35.00" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Stock Mínimo
                    </label>
                    <input type="number" name="stock_minimo" value={formData.stock_minimo} onChange={handleChange} className="input w-full" placeholder="10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Stock Actual
                    </label>
                    <input type="number" name="stock_actual" value={formData.stock_actual} onChange={handleChange} className="input w-full" placeholder="50" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Categoría
                    </label>
                    <select name="id_categoria" value={formData.id_categoria} onChange={handleChange} className="input w-full">
                      <option value="">Seleccionar...</option>
                      {categorias.map((cat, idx) => (
                        <option key={`cat-${cat.id_categoria || idx}`} value={cat.id_categoria}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      Marca
                    </label>
                    <select name="id_marca" value={formData.id_marca} onChange={handleChange} className="input w-full">
                      <option value="">Seleccionar...</option>
                      {marcas.map((marca, idx) => (
                        <option key={`marca-${marca.id_marca || idx}`} value={marca.id_marca}>{marca.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-barbox-wine mb-1">
                      IVA
                    </label>
                    <select name="id_iva" value={formData.id_iva} onChange={handleChange} className="input w-full">
                      <option value="">Seleccionar...</option>
                      {ivas.map((iva, idx) => (
                        <option key={`iva-${iva.id_iva || idx}`} value={iva.id_iva}>{iva.porcentaje}%</option>
                      ))}
                    </select>
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

      {/* Modal de Vista */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-barbox-border flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-barbox-wine">Detalles del Producto</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-barbox-cream rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {viewingProduct.imagen_url && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={viewingProduct.imagen_url} 
                    alt={viewingProduct.descripcion}
                    className="w-32 h-32 object-cover rounded-lg border border-barbox-border"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-barbox-text-secondary">ID</p>
                  <p className="font-semibold">{viewingProduct.id_producto}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Estado</p>
                  <span className={`badge ${viewingProduct.estado === 'ACT' ? 'badge-success' : 'badge-warning'}`}>
                    {viewingProduct.estado === 'ACT' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-barbox-text-secondary">Descripción</p>
                  <p className="font-semibold">{viewingProduct.descripcion}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Precio Compra</p>
                  <p className="font-semibold">${Number(viewingProduct.precio_compra || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Precio Venta</p>
                  <p className="font-semibold text-barbox-wine">${Number(viewingProduct.precio_venta || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Stock Actual</p>
                  <p className="font-semibold">{viewingProduct.stock_actual || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Stock Mínimo</p>
                  <p className="font-semibold">{viewingProduct.stock_minimo || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Categoría</p>
                  <p className="font-semibold">{categorias.find(c => c.id_categoria === viewingProduct.id_categoria)?.nombre || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Marca</p>
                  <p className="font-semibold">{marcas.find(m => m.id_marca === viewingProduct.id_marca)?.nombre || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">IVA</p>
                  <p className="font-semibold">{ivas.find(i => i.id_iva === viewingProduct.id_iva)?.porcentaje}%</p>
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
                <label className="block text-sm font-medium text-barbox-wine mb-1">Categoría</label>
                <select 
                  value={filtros.categoria} 
                  onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">Marca</label>
                <select 
                  value={filtros.marca} 
                  onChange={(e) => setFiltros({...filtros, marca: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todas las marcas</option>
                  {marcas.map(marca => (
                    <option key={marca.id_marca} value={marca.id_marca}>{marca.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-barbox-wine mb-1">Estado</label>
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

              <div>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={filtros.stockBajo} 
                    onChange={(e) => setFiltros({...filtros, stockBajo: e.target.checked})}
                    className="mr-2"
                  />
                  Solo productos con stock bajo
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Precio Mín.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={filtros.precioMin} 
                    onChange={(e) => setFiltros({...filtros, precioMin: e.target.value})}
                    className="input w-full" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Precio Máx.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={filtros.precioMax} 
                    onChange={(e) => setFiltros({...filtros, precioMax: e.target.value})}
                    className="input w-full" 
                    placeholder="999.99"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setFiltros({
                    categoria: '',
                    marca: '',
                    estado: '',
                    stockBajo: false,
                    precioMin: '',
                    precioMax: ''
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
