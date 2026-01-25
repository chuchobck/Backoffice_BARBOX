import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Download, Eye, Trash2, X } from 'lucide-react'
import { facturasAPI, clientesAPI, productosAPI } from '../services/api'

export default function Facturas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filtros, setFiltros] = useState({
    cliente: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: ''
  })
  const [viewingItem, setViewingItem] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => facturasAPI.listar(),
  })

  const facturas = Array.isArray(data?.data?.data) ? data.data.data : 
                  Array.isArray(data?.data) ? data.data : []

  // Aplicar filtros
  const facturasFiltradas = facturas.filter(factura => {
    // Filtro de búsqueda
    const matchSearch = !searchTerm || 
      factura.id_factura?.toString().includes(searchTerm) ||
      factura.numero_factura?.includes(searchTerm)
    
    // Filtro de estado
    const matchEstado = !filtros.estado || factura.estado === filtros.estado
    
    // Filtro de fechas
    const fechaFactura = new Date(factura.fecha_emision)
    const matchFechaInicio = !filtros.fechaInicio || fechaFactura >= new Date(filtros.fechaInicio)
    const matchFechaFin = !filtros.fechaFin || fechaFactura <= new Date(filtros.fechaFin)
    
    // Filtro de monto
    const total = parseFloat(factura.total || 0)
    const matchMontoMin = !filtros.montoMin || total >= parseFloat(filtros.montoMin)
    const matchMontoMax = !filtros.montoMax || total <= parseFloat(filtros.montoMax)
    
    return matchSearch && matchEstado && matchFechaInicio && matchFechaFin && matchMontoMin && matchMontoMax
  })

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }) => facturasAPI.anular(Number(id), { motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries(['facturas'])
      alert('Factura anulada exitosamente. Stock devuelto.')
    },
    onError: (error) => {
      alert('Error al anular factura: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleAnular = (factura) => {
    const motivo = prompt(`¿Motivo de anulación de la factura #${factura.id_factura}?`)
    if (motivo && window.confirm('¿Está seguro? Esta acción devolverá el stock.')) {
      anularMutation.mutate({ id: factura.id_factura, motivo })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-barbox-wine">
            Facturas
          </h1>
          <p className="text-barbox-text-secondary mt-1">
            Gestión de facturas
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">
            <Download size={18} className="mr-2" />
            Reporte
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
                <th>#</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th className="text-right">Total</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center py-8 text-danger">Error al cargar</td></tr>
              ) : facturasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-barbox-text-secondary">
                    <p className="text-4xl mb-2">📋</p>
                    <p>No hay facturas{searchTerm || Object.values(filtros).some(v => v) ? ' que coincidan con los filtros' : ''}</p>
                  </td>
                </tr>
              ) : (
                facturasFiltradas.map((factura, index) => {
                  const fact = factura; // alias para consistency
                  return (
                  <tr key={fact.id_factura}>
                    <td className="font-mono text-sm">{fact.id_factura}</td>
                    <td>{fact.numero_factura || 'N/A'}</td>
                    <td className="text-sm text-barbox-text-secondary">{new Date(fact.fecha_emision).toLocaleDateString('es-ES')}</td>
                    <td className="text-right font-semibold">${Number(fact.total || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        fact.estado === 'EMI' ? 'badge-info' :
                        fact.estado === 'PAG' ? 'badge-success' : 'badge-error'
                      }`}>
                        {fact.estado === 'EMI' ? '⏳ Emitida' : fact.estado === 'PAG' ? '✅ Pagada' : '❌ Anulada'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-barbox-cream rounded transition"
                          onClick={() => {
                            setViewingItem(fact)
                            setShowViewModal(true)
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {fact.estado === 'EMI' && (
                          <button 
                            className="p-2 hover:bg-danger/10 rounded transition text-danger"
                            onClick={() => handleAnular(fact)}
                            title="Anular factura"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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

      {/* Modal de Vista */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-barbox-border flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-barbox-wine">Detalles de Factura</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-barbox-cream rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-barbox-text-secondary">Número</p>
                  <p className="font-semibold">{viewingItem.numero_factura}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Estado</p>
                  <span className={`badge ${viewingItem.estado === 'EMI' ? 'badge-success' : 'badge-error'}`}>
                    {viewingItem.estado === 'EMI' ? 'Emitida' : 'Anulada'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Fecha</p>
                  <p className="font-semibold">{new Date(viewingItem.fecha).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Tipo</p>
                  <p className="font-semibold">{viewingItem.tipo_factura}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-barbox-text-secondary">Cliente</p>
                  <p className="font-semibold">{viewingItem.id_cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Subtotal</p>
                  <p className="font-semibold">${Number(viewingItem.subtotal || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">IVA</p>
                  <p className="font-semibold">${Number(viewingItem.iva || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Descuento</p>
                  <p className="font-semibold">${Number(viewingItem.descuento || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-barbox-text-secondary">Total</p>
                  <p className="font-semibold text-barbox-wine text-xl">${Number(viewingItem.total || 0).toFixed(2)}</p>
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
                <label className="block text-sm font-medium text-barbox-wine mb-1">Estado</label>
                <select 
                  value={filtros.estado} 
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="input w-full"
                >
                  <option value="">Todos los estados</option>
                  <option value="EMI">Emitida</option>
                  <option value="ANU">Anulada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Desde</label>
                  <input 
                    type="date"
                    value={filtros.fechaInicio} 
                    onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Hasta</label>
                  <input 
                    type="date"
                    value={filtros.fechaFin} 
                    onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Monto Mín.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={filtros.montoMin} 
                    onChange={(e) => setFiltros({...filtros, montoMin: e.target.value})}
                    className="input w-full" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-barbox-wine mb-1">Monto Máx.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={filtros.montoMax} 
                    onChange={(e) => setFiltros({...filtros, montoMax: e.target.value})}
                    className="input w-full" 
                    placeholder="9999.99"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-barbox-border flex justify-end gap-2">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setFiltros({
                    cliente: '',
                    estado: '',
                    fechaInicio: '',
                    fechaFin: '',
                    montoMin: '',
                    montoMax: ''
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
