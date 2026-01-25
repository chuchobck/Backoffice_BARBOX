import api from '../lib/axios'

// Dashboard endpoint NO EXISTE en backend
// export const dashboardAPI = {
//   obtenerDatos: () => api.get('/dashboard'),
// }

// Productos
export const productosAPI = {
  listar: (params) => api.get('/productos', { params }),
  buscar: (params) => api.get('/productos/buscar', { params }),
  obtenerPorId: (id) => {
    if (!id || id.toString().trim() === '') {
      return Promise.reject(new Error(`Invalid product ID: ${id}`))
    }
    return api.get(`/productos/${id}`)
  },
  crear: (data) => api.post('/productos', data),
  actualizar: (id, data) => {
    if (!id || id.toString().trim() === '') {
      return Promise.reject(new Error(`Invalid product ID for update: ${id}`))
    }
    return api.put(`/productos/${id}`, data)
  },
  cambiarEstado: (id, estado) => {
    if (!id || id.toString().trim() === '') {
      return Promise.reject(new Error(`Invalid product ID for status change: ${id}`))
    }
    return api.put(`/productos/${id}/estado`, { estado })
  },
  eliminar: (id) => {
    if (!id || id.toString().trim() === '') {
      return Promise.reject(new Error(`Invalid product ID for delete: ${id}`))
    }
    return api.delete(`/productos/${id}`)
  },
}

// Clientes
export const clientesAPI = {
  listar: (params) => api.get('/clientes', { params }),
  buscar: (params) => api.get('/clientes/buscar', { params }),
  obtenerPorId: (id) => api.get(`/clientes/${id}`),
  crear: (data) => api.post('/clientes', data),
  actualizar: (id, data) => api.put(`/clientes/${id}`, data),
  eliminar: (id) => api.delete(`/clientes/${id}`),
  obtenerFacturas: (id) => api.get(`/clientes/${id}/facturas`),
}

// Facturas
export const facturasAPI = {
  listar: (params) => api.get('/facturas', { params }),
  obtenerPorId: (id) => api.get(`/facturas/${id}`),
  crear: (data) => api.post('/facturas', data),
  anular: (id, data) => api.post(`/facturas/${id}/anular`, data),
}

// Proveedores
export const proveedoresAPI = {
  listar: (params) => api.get('/proveedores', { params }),
  obtenerPorId: (id) => api.get(`/proveedores/${id}`),
  crear: (data) => api.post('/proveedores', data),
  actualizar: (id, data) => api.put(`/proveedores/${id}`, data),
  eliminar: (id) => api.delete(`/proveedores/${id}`),
}

// Compras
export const comprasAPI = {
  listar: (params) => api.get('/compras', { params }),
  obtenerPorId: (id) => api.get(`/compras/${id}`),
  crear: (data) => api.post('/compras', data),
  actualizar: (id, data) => api.put(`/compras/${id}`, data),
  eliminar: (id) => api.delete(`/compras/${id}`),
  aprobar: (id) => api.put(`/compras/${id}/aprobar`),
}

// Recepciones
export const recepcionesAPI = {
  listar: (params) => api.get('/bodega/recepciones', { params }),
  obtenerPorId: (id) => api.get(`/bodega/recepciones/${id}`),
  crear: (data) => api.post('/bodega/recepciones', data),
  anular: (id, data) => api.delete(`/bodega/recepciones/${id}`, { data }),
}

// Promociones
export const promocionesAPI = {
  listar: (params) => api.get('/promociones', { params }),
  obtenerPorId: (id) => api.get(`/promociones/${id}`),
  crear: (data) => api.post('/promociones', data),
  actualizar: (id, data) => api.put(`/promociones/${id}`, data),
  eliminar: (id) => api.delete(`/promociones/${id}`),
}

// Marcas
export const marcasAPI = {
  listar: (params) => api.get('/marcas', { params }),
  obtenerPorId: (id) => api.get(`/marcas/${id}`),
  crear: (data) => api.post('/marcas', data),
  actualizar: (id, data) => api.put(`/marcas/${id}`, data),
  cambiarEstado: (id, estado) => {
    if (!id || id.toString().trim() === '') {
      return Promise.reject(new Error(`Invalid marca ID for status change: ${id}`))
    }
    return api.put(`/marcas/${id}/estado`, { estado })
  },
  eliminar: (id) => api.delete(`/marcas/${id}`),
}

// Categorías
export const categoriasAPI = {
  listar: (params) => api.get('/categorias', { params }),
  obtenerPorId: (id) => api.get(`/categorias/${id}`),
  crear: (data) => api.post('/categorias', data),
  actualizar: (id, data) => api.put(`/categorias/${id}`, data),
  eliminar: (id) => api.delete(`/categorias/${id}`),
}

// IVA
export const ivaAPI = {
  listar: () => api.get('/iva'),
  obtenerVigente: () => api.get('/iva/vigente'),
  crear: (data) => api.post('/iva', data),
  actualizar: (id, data) => api.put(`/iva/${id}`, data),
  eliminar: (id) => api.delete(`/iva/${id}`),
}

// Ciudades
export const ciudadesAPI = {
  listar: () => api.get('/ciudades'),
  obtenerPorId: (id) => api.get(`/ciudades/${id}`),
  crear: (data) => api.post('/ciudades', data),
  actualizar: (id, data) => api.put(`/ciudades/${id}`, data),
  eliminar: (id) => api.delete(`/ciudades/${id}`),
}

// Unidades de Medida (catálogo)
export const unidadesMedidaAPI = {
  listar: () => api.get('/unidades-medida'),
}

// Métodos de Pago
export const metodosPagoAPI = {
  listar: () => api.get('/metodos-pago'),
  obtenerPorId: (id) => api.get(`/metodos-pago/${id}`),
  buscar: (params) => api.get('/metodos-pago/buscar', { params }),
  disponiblesWeb: () => api.get('/metodos-pago/disponibles-web'),
  crear: (data) => api.post('/metodos-pago', data),
  actualizar: (id, data) => api.put(`/metodos-pago/${id}`, data),
  eliminar: (id) => api.delete(`/metodos-pago/${id}`),
}

// Empleados
export const empleadosAPI = {
  listar: (params) => api.get('/empleados', { params }),
  obtenerPorId: (id) => api.get(`/empleados/${id}`),
  buscar: (params) => api.get('/empleados/buscar', { params }),
  crear: (data) => api.post('/empleados', data),
  actualizar: (id, data) => api.put(`/empleados/${id}`, data),
  eliminar: (id) => api.delete(`/empleados/${id}`),
}

// Roles (para combobox de empleados)
export const rolesAPI = {
  listar: () => api.get('/roles'),
}
