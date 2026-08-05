import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mockCotizaciones } from '../data/mockData';
import { Plus, Search, FileText, SlidersHorizontal, X } from 'lucide-react';
import CotizacionForm from '../components/CotizacionForm';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Cotizaciones({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const filterEstadoUrl = searchParams.get('estado');
  
  const [filterCliente, setFilterCliente] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState(null);
  const [filterFechaFin, setFilterFechaFin] = useState(null);
  const [filterEstadoSelect, setFilterEstadoSelect] = useState(filterEstadoUrl || '');
  const [editingCotizacion, setEditingCotizacion] = useState(null);
  const [cotizaciones, setCotizaciones] = useState(mockCotizaciones);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const calculateGap = (fechaEntrega) => {
    if (!fechaEntrega) return { text: 'Sin fecha', color: 'var(--text-muted)' };
    const today = new Date();
    today.setHours(0,0,0,0);
    const [year, month, day] = fechaEntrega.split('-');
    const deliveryDate = new Date(year, month - 1, day);
    
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Vencido (${Math.abs(diffDays)}d)`, color: 'var(--error-color)' };
    if (diffDays === 0) return { text: '¡Hoy!', color: 'var(--error-color)' };
    if (diffDays <= 2) return { text: `${diffDays} días`, color: 'var(--warning-color)' };
    return { text: `${diffDays} días`, color: 'var(--success-color)' };
  };

  const getBadgeClass = (estado) => {
    switch(estado) {
      case 'Aprobada': return 'badge badge-success';
      case 'Pendiente': return 'badge badge-pending';
      case 'Rechazada': return 'badge badge-danger';
      default: return 'badge badge-primary';
    }
  };

  const filtered = cotizaciones.filter(c => {
    if (c.convertidaAOT) return false;
    
    const matchesSearch = c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = filterCliente ? c.cliente === filterCliente : true;
    
    const itemDate = new Date(c.fecha);
    itemDate.setHours(0,0,0,0);
    const filterStart = filterFechaInicio ? new Date(filterFechaInicio).setHours(0,0,0,0) : null;
    const filterEnd = filterFechaFin ? new Date(filterFechaFin).setHours(23,59,59,999) : null;

    const matchesFechaInicio = filterStart ? itemDate >= filterStart : true;
    const matchesFechaFin = filterEnd ? itemDate <= filterEnd : true;
    const matchesEstado = filterEstadoSelect ? c.estado === filterEstadoSelect : true;
    
    return matchesSearch && matchesCliente && matchesFechaInicio && matchesFechaFin && matchesEstado;
  });

  const handleEdit = (cotizacion) => {
    setEditingCotizacion({
      id: cotizacion.id,
      fechaEmision: cotizacion.fecha || new Date().toISOString().split('T')[0],
      fechaValidez: '15',
      cliente: cotizacion.cliente,
      contacto: '',
      ejecutivo: user?.name || 'Admin',
      estado: cotizacion.estado,
      items: [
        {
          id: Date.now(),
          lineaNegocio: cotizacion.tipo.split(' ')[0] || 'Impresión',
          descripcion: 'Trabajo recuperado de resumen',
          cantidad: 1,
          costoUnitario: cotizacion.monto,
          adjuntos: '',
          formato: '', sustrato: '', tintas: '', acabados: '', dimensiones: '', tipoMaterial: '', resolucion: '', terminaciones: '', dimensiones3D: '', materialesEstructurales: '', iluminacion: '', instalacion: 'No', materialCorte: '', grosor: '', tipoCorte: '', metraje: '',
          tipoDiseño: '', formatoEntrega: '', complejidad: '', tipoInstalacion: '', ubicacion: '', requiereAndamios: 'No', tiempoMontaje: ''
        }
      ],
      subtotal: cotizacion.monto,
      impuestos: 0,
      total: cotizacion.monto,
      condicionesPago: '50% anticipo / 50% contra entrega',
      fechaEntrega: cotizacion.fechaEntrega || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleSave = (nuevaCotizacion) => {
    const listCotizacion = {
      id: nuevaCotizacion.id,
      cliente: nuevaCotizacion.cliente || 'Sin Cliente',
      tipo: nuevaCotizacion.items.length > 0 ? nuevaCotizacion.items[0].lineaNegocio + (nuevaCotizacion.items.length > 1 ? ' y otros' : '') : 'Varios',
      monto: nuevaCotizacion.total,
      estado: nuevaCotizacion.estado,
      fecha: nuevaCotizacion.fechaEmision,
      fechaEntrega: nuevaCotizacion.fechaEntrega,
      convertidaAOT: nuevaCotizacion.convertidaAOT || false
    };
    
    if (cotizaciones.find(c => c.id === nuevaCotizacion.id)) {
      const updatedList = cotizaciones.map(c => c.id === nuevaCotizacion.id ? listCotizacion : c);
      setCotizaciones(updatedList);
      
      const mockIndex = mockCotizaciones.findIndex(c => c.id === nuevaCotizacion.id);
      if (mockIndex !== -1) mockCotizaciones[mockIndex] = listCotizacion;
    } else {
      setCotizaciones([listCotizacion, ...cotizaciones]);
      mockCotizaciones.unshift(listCotizacion);
    }
    setEditingCotizacion(null);
  };

  const handleDelete = (id) => {
    setCotizaciones(cotizaciones.filter(c => c.id !== id));
    setEditingCotizacion(null);
  };

  if (editingCotizacion) {
    return <CotizacionForm 
      initialData={editingCotizacion.id !== 'NEW' ? editingCotizacion : null} 
      onCancel={() => setEditingCotizacion(null)} 
      onSave={handleSave} 
      onDelete={() => handleDelete(editingCotizacion.id)}
      user={user}
    />;
  }

  const isAnyFilterActive = filterCliente || filterFechaInicio || filterFechaFin || filterEstadoSelect;

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      <div className="flex-row-between" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={28} color="var(--primary-color)" /> Cotizaciones
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className={`btn ${isAnyFilterActive ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }} 
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            <SlidersHorizontal size={16} />
            Filtros {isAnyFilterActive ? '(Activo)' : ''}
          </button>
          <button className="btn" style={{ padding: '0.5rem', width: 'auto', borderRadius: 'var(--radius-full)' }} onClick={() => setEditingCotizacion({id: 'NEW'})}>
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <div className="input-group" style={{ position: 'relative', margin: 0 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-control" 
            placeholder="Buscar cotización..." 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map(cotizacion => (
          <div 
            key={cotizacion.id} 
            className="card hoverable" 
            style={{ margin: 0, padding: '0.75rem', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s' }}
            onClick={() => handleEdit(cotizacion)}
          >
            <div className="flex-row-between" style={{ marginBottom: '0.25rem' }}>
              <strong>{cotizacion.id}</strong>
              <span className={getBadgeClass(cotizacion.estado)}>{cotizacion.estado}</span>
            </div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: '1.2' }}>{cotizacion.cliente}</p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>{cotizacion.tipo}</p>
            <div className="flex-row-between" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Emisión: {cotizacion.fecha}</span>
              <strong style={{ color: 'var(--primary-color)' }}>${cotizacion.monto.toFixed(2)}</strong>
            </div>
            <div className="flex-row-between" style={{ fontSize: '0.8rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--secondary-color)' }}>
                Entrega est.: {cotizacion.fechaEntrega || 'N/A'}
              </span>
              <span style={{ 
                background: `color-mix(in srgb, ${calculateGap(cotizacion.fechaEntrega).color} 15%, transparent)`, 
                color: calculateGap(cotizacion.fechaEntrega).color,
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}>
                GAP: {calculateGap(cotizacion.fechaEntrega).text}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Filtros flotante y centrado */}
      {isFilterDrawerOpen && (
        <>
          <div className="modal-overlay" onClick={() => setIsFilterDrawerOpen(false)}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <SlidersHorizontal size={20} color="var(--primary-color)" />
                  <span>Filtros de Cotizaciones</span>
                </h3>
                <button className="modal-close-btn" onClick={() => setIsFilterDrawerOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label>Cliente</label>
                  <select className="input-control" value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
                    <option value="">Todos los Clientes</option>
                    {[...new Set(cotizaciones.map(c => c.cliente))].map(cliente => (
                      <option key={cliente} value={cliente}>{cliente}</option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Rango de Fechas</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Desde</span>
                      <DatePicker
                        selected={filterFechaInicio}
                        onChange={(date) => setFilterFechaInicio(date)}
                        selectsStart
                        startDate={filterFechaInicio}
                        endDate={filterFechaFin}
                        className="input-control"
                        placeholderText="dd/mm/aaaa"
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        withPortal
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Hasta</span>
                      <DatePicker
                        selected={filterFechaFin}
                        onChange={(date) => setFilterFechaFin(date)}
                        selectsEnd
                        startDate={filterFechaInicio}
                        endDate={filterFechaFin}
                        minDate={filterFechaInicio}
                        className="input-control"
                        placeholderText="dd/mm/aaaa"
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        withPortal
                      />
                    </div>
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Estatus</label>
                  <select className="input-control" value={filterEstadoSelect} onChange={e => setFilterEstadoSelect(e.target.value)}>
                    <option value="">Cualquier Estatus</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Enviada">Enviada</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setFilterCliente('');
                    setFilterFechaInicio(null);
                    setFilterFechaFin(null);
                    setFilterEstadoSelect('');
                  }}
                >
                  Limpiar
                </button>
                <button className="btn btn-primary" onClick={() => setIsFilterDrawerOpen(false)}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
