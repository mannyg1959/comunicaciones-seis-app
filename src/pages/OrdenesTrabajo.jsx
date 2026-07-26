import { useState } from 'react';
import { mockOrdenesTrabajo } from '../data/mockData';
import { Package, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function OrdenesTrabajo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState(null);
  const [filterFechaFin, setFilterFechaFin] = useState(null);
  const [filterEstadoSelect, setFilterEstadoSelect] = useState('');

  const stages = ['Pendiente', 'Producción', 'Revisión', 'Finalizado', 'Entregado'];
  const [selectedOT, setSelectedOT] = useState(null);
  const [tempEstado, setTempEstado] = useState('');

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

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'Pendiente': return 'var(--status-pendiente)';
      case 'Producción': return 'var(--status-produccion)';
      case 'Revisión': return 'var(--status-revision)';
      case 'Finalizado': return 'var(--status-finalizado)';
      case 'Entregado': return 'var(--status-entregado)';
      default: return 'var(--primary-color)';
    }
  };

  const filtered = mockOrdenesTrabajo.filter(ot => {
    const matchesSearch = ot.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || ot.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = filterCliente ? ot.cliente === filterCliente : true;
    
    const itemDate = new Date(ot.fechaEntrega);
    itemDate.setHours(0,0,0,0);
    const filterStart = filterFechaInicio ? new Date(filterFechaInicio).setHours(0,0,0,0) : null;
    const filterEnd = filterFechaFin ? new Date(filterFechaFin).setHours(23,59,59,999) : null;

    const matchesFechaInicio = filterStart ? itemDate >= filterStart : true;
    const matchesFechaFin = filterEnd ? itemDate <= filterEnd : true;
    const matchesEstado = filterEstadoSelect ? ot.estado === filterEstadoSelect : true;
    
    return matchesSearch && matchesCliente && matchesFechaInicio && matchesFechaFin && matchesEstado;
  });

  const handleOpenOT = (ot) => {
    setSelectedOT(ot);
    setTempEstado(ot.estado);
  };

  const handleSaveEstado = () => {
    if (!selectedOT) return;
    const index = mockOrdenesTrabajo.findIndex(o => o.id === selectedOT.id);
    if (index !== -1) {
      let progreso = 0;
      switch(tempEstado) {
        case 'Pendiente': progreso = 0; break;
        case 'Producción': progreso = 30; break;
        case 'Revisión': progreso = 70; break;
        case 'Finalizado': progreso = 90; break;
        case 'Entregado': progreso = 100; break;
      }
      mockOrdenesTrabajo[index] = { ...mockOrdenesTrabajo[index], estado: tempEstado, progreso };
    }
    setSelectedOT(null);
  };

  const renderTimeline = (currentEstado) => {
    const currentIndex = stages.indexOf(currentEstado);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2rem 0', position: 'relative' }}>
        {stages.map((stage, index) => {
          const isCompletedOrCurrent = index <= currentIndex;
          let color = 'var(--border-color)';
          let textColor = 'var(--text-muted)';
          
          if (isCompletedOrCurrent) {
            color = getStatusColor(stage);
            textColor = '#fff';
          }

          return (
            <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: color, 
                color: textColor,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                zIndex: 2,
                boxShadow: isCompletedOrCurrent ? `0 0 0 2px var(--surface-color), 0 0 0 4px ${color}` : 'none',
                transition: 'all var(--transition-fast)'
              }}>
                {index + 1}
              </div>
              <span style={{ fontSize: '0.7rem', marginTop: '0.75rem', textAlign: 'center', color: isCompletedOrCurrent ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isCompletedOrCurrent ? '600' : '400' }}>
                {stage}
              </span>
              {index < stages.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '50%',
                  width: '100%',
                  height: '4px',
                  backgroundColor: index < currentIndex ? getStatusColor(stages[index]) : 'var(--border-color)',
                  zIndex: 1,
                  transition: 'background-color var(--transition-fast)'
                }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-content">
      <div className="flex-row-between" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={28} color="var(--primary-color)" /> Órdenes de Trabajo
        </h1>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', background: '#94a3b8', position: 'relative', zIndex: 10 }}>
          <div className="input-group" style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="Buscar orden o cliente..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <select className="input-control" value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
              <option value="">Todos los Clientes</option>
              {[...new Set(mockOrdenesTrabajo.map(ot => ot.cliente))].map(cliente => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#000', fontWeight: 'bold', marginBottom: '0.25rem', display: 'block' }}>Desde (Entrega)</span>
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
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#000', fontWeight: 'bold', marginBottom: '0.25rem', display: 'block' }}>Hasta (Entrega)</span>
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
                />
              </div>
            </div>
            
            <select className="input-control" value={filterEstadoSelect} onChange={e => setFilterEstadoSelect(e.target.value)}>
              <option value="">Cualquier Estatus</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Producción">Producción</option>
              <option value="Revisión">Revisión</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
        </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(ot => (
          <div key={ot.id} className="card hoverable" style={{ margin: 0, cursor: 'pointer' }} onClick={() => handleOpenOT(ot)}>
            <div className="flex-row-between" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
              <div>
                <strong>{ot.id}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Ref: {ot.cotizacionId}</span>
              </div>
              <span style={{ 
                background: `color-mix(in srgb, ${getStatusColor(ot.estado)} 15%, transparent)`, 
                color: getStatusColor(ot.estado),
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}>
                {ot.estado}
              </span>
            </div>
            
            <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{ot.cliente} - {ot.tipo}</p>
            <div className="flex-row-between" style={{ fontSize: '0.875rem', marginBottom: '1rem', alignItems: 'center' }}>
              <span>Entrega: {ot.fechaEntrega}</span>
              <span style={{ 
                background: `color-mix(in srgb, ${calculateGap(ot.fechaEntrega).color} 15%, transparent)`, 
                color: calculateGap(ot.fechaEntrega).color,
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}>
                GAP: {calculateGap(ot.fechaEntrega).text}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${ot.progreso}%`, 
                  background: getStatusColor(ot.estado),
                  borderRadius: '4px',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{ot.progreso}%</span>
            </div>
          </div>
        ))}
      </div>

      {selectedOT && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 0 }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Actualizar Estatus</span>
              <span style={{ color: 'var(--primary-color)' }}>{selectedOT.id}</span>
            </h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>{selectedOT.cliente} - {selectedOT.tipo}</p>

            {renderTimeline(tempEstado)}

            <div className="input-group" style={{ marginTop: '2rem' }}>
              <label>Cambiar Estatus A:</label>
              <select className="input-control" value={tempEstado} onChange={e => setTempEstado(e.target.value)}>
                {stages.map((stage, index) => {
                  const originalIndex = stages.indexOf(selectedOT.estado);
                  // Allow previous stages (error correction), current stage, and exactly ONE next stage
                  if (index <= originalIndex + 1) {
                    return <option key={stage} value={stage}>{stage}</option>;
                  }
                  return null;
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setSelectedOT(null)}>Cancelar</button>
              <button className="btn btn-solid" style={{ flex: 1, padding: '0.75rem' }} onClick={handleSaveEstado}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
