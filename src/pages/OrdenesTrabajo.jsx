import { useState } from 'react';
import { mockOrdenesTrabajo } from '../data/mockData';
import { Package, Search, SlidersHorizontal, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function OrdenesTrabajo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState(null);
  const [filterFechaFin, setFilterFechaFin] = useState(null);
  const [filterEstadoSelect, setFilterEstadoSelect] = useState('');
  const [filterIncidencia, setFilterIncidencia] = useState(false);

  const stages = ['Programación', 'Producción', 'Revisión', 'Finalizado', 'Entregado'];
  const [selectedOT, setSelectedOT] = useState(null);
  const [tempEstado, setTempEstado] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // State for OTs (persisted in localStorage)
  const [ordenesTrabajo, setOrdenesTrabajo] = useState(() => {
    const saved = localStorage.getItem('comunicaciones_seis_ots');
    return saved ? JSON.parse(saved) : [...mockOrdenesTrabajo];
  });

  // State for active incidents per OT (persisted in localStorage)
  const [otIncidents, setOtIncidents] = useState(() => {
    const saved = localStorage.getItem('comunicaciones_seis_ot_incidents');
    const defaultIncidents = {
      'OT-5001': [
        { id: 1, type: 'incident', text: 'Retraso de materia prima: sustrato agotado', date: '2026-07-27 10:00', severity: 'Alta' }
      ]
    };
    return saved ? JSON.parse(saved) : defaultIncidents;
  });

  // Initial mockup history logs (persisted in localStorage)
  const [otLogs, setOtLogs] = useState(() => {
    const saved = localStorage.getItem('comunicaciones_seis_ot_logs');
    const defaultLogs = {
      'OT-5001': [
        { id: 1, type: 'status', text: 'Orden Creada', date: '2026-07-25 09:00', icon: 'FilePlus' },
        { id: 2, type: 'status', text: 'Estatus cambiado a Programación', date: '2026-07-25 10:15', icon: 'SlidersHorizontal' },
        { id: 3, type: 'status', text: 'Estatus cambiado a Producción', date: '2026-07-26 14:30', icon: 'Package' }
      ],
      'OT-5002': [
        { id: 1, type: 'status', text: 'Orden Creada', date: '2026-07-18 08:30', icon: 'FilePlus' },
        { id: 2, type: 'status', text: 'Estatus cambiado a Programación', date: '2026-07-18 09:00', icon: 'SlidersHorizontal' },
        { id: 3, type: 'status', text: 'Estatus cambiado a Producción', date: '2026-07-18 11:00', icon: 'Package' },
        { id: 4, type: 'status', text: 'Estatus cambiado a Revisión', date: '2026-07-19 15:45', icon: 'SlidersHorizontal' },
        { id: 5, type: 'status', text: 'Estatus cambiado a Finalizado', date: '2026-07-20 12:00', icon: 'CheckCircle' }
      ],
      'OT-5003': [
        { id: 1, type: 'status', text: 'Orden Creada', date: '2026-07-24 11:20', icon: 'FilePlus' },
        { id: 2, type: 'status', text: 'Estatus cambiado a Programación', date: '2026-07-25 09:30', icon: 'SlidersHorizontal' }
      ],
      'OT-5004': [
        { id: 1, type: 'status', text: 'Orden Creada', date: '2026-07-25 10:00', icon: 'FilePlus' },
        { id: 2, type: 'status', text: 'Estatus cambiado a Programación', date: '2026-07-25 11:30', icon: 'SlidersHorizontal' },
        { id: 3, type: 'status', text: 'Estatus cambiado a Producción', date: '2026-07-26 09:00', icon: 'Package' },
        { id: 4, type: 'status', text: 'Estatus cambiado a Revisión', date: '2026-07-28 14:00', icon: 'SlidersHorizontal' }
      ],
      'OT-5005': [
        { id: 1, type: 'status', text: 'Orden Creada', date: '2026-07-10 09:00', icon: 'FilePlus' },
        { id: 2, type: 'status', text: 'Estatus cambiado a Programación', date: '2026-07-10 10:00', icon: 'SlidersHorizontal' },
        { id: 3, type: 'status', text: 'Estatus cambiado a Producción', date: '2026-07-11 08:30', icon: 'Package' },
        { id: 4, type: 'status', text: 'Estatus cambiado a Revisión', date: '2026-07-14 13:00', icon: 'SlidersHorizontal' },
        { id: 5, type: 'status', text: 'Estatus cambiado a Finalizado', date: '2026-07-15 11:00', icon: 'CheckCircle' },
        { id: 6, type: 'status', text: 'Estatus cambiado a Entregado', date: '2026-07-15 16:30', icon: 'Truck' }
      ]
    };
    return saved ? JSON.parse(saved) : defaultLogs;
  });

  // Keep localStorage updated when state changes
  useEffect(() => {
    localStorage.setItem('comunicaciones_seis_ots', JSON.stringify(ordenesTrabajo));
  }, [ordenesTrabajo]);

  useEffect(() => {
    localStorage.setItem('comunicaciones_seis_ot_incidents', JSON.stringify(otIncidents));
  }, [otIncidents]);

  useEffect(() => {
    localStorage.setItem('comunicaciones_seis_ot_logs', JSON.stringify(otLogs));
  }, [otLogs]);

  const filtered = ordenesTrabajo.filter(ot => {
    const matchesSearch = ot.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || ot.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCliente = filterCliente ? ot.cliente === filterCliente : true;
    
    const itemDate = new Date(ot.fechaEntrega);
    itemDate.setHours(0,0,0,0);
    const filterStart = filterFechaInicio ? new Date(filterFechaInicio).setHours(0,0,0,0) : null;
    const filterEnd = filterFechaFin ? new Date(filterFechaFin).setHours(23,59,59,999) : null;

    const matchesFechaInicio = filterStart ? itemDate >= filterStart : true;
    const matchesFechaFin = filterEnd ? itemDate <= filterEnd : true;
    
    const matchesEstado = filterEstadoSelect ? ot.estado === filterEstadoSelect : true;
    const matchesIncidencia = filterIncidencia ? (otIncidents[ot.id] || []).length > 0 : true;
    
    return matchesSearch && matchesCliente && matchesFechaInicio && matchesFechaFin && matchesEstado && matchesIncidencia;
  });

  // State for active modal view: 'menu' | 'estatus' | 'incidencia' | 'historial'
  const [activeModalView, setActiveModalView] = useState('menu');

  // State for new incident inputs
  const [newIncidentText, setNewIncidentText] = useState('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState('Media');

  const handleOpenOT = (ot) => {
    setSelectedOT(ot);
    setTempEstado(ot.estado);
    setActiveModalView('menu');
    setNewIncidentText('');
    setNewIncidentSeverity('Media');
  };

  const handleSaveEstado = () => {
    if (!selectedOT) return;
    const index = ordenesTrabajo.findIndex(o => o.id === selectedOT.id);
    if (index !== -1) {
      let progreso = 0;
      switch(tempEstado) {
        case 'Programación': progreso = 0; break;
        case 'Producción': progreso = 30; break;
        case 'Revisión': progreso = 70; break;
        case 'Finalizado': progreso = 90; break;
        case 'Entregado': progreso = 100; break;
      }
      const oldEstado = ordenesTrabajo[index].estado;
      
      const updatedOts = [...ordenesTrabajo];
      updatedOts[index] = { ...updatedOts[index], estado: tempEstado, progreso };
      setOrdenesTrabajo(updatedOts);
      
      if (oldEstado !== tempEstado) {
        // Add log entry
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const newLog = {
          id: Date.now(),
          type: 'status',
          text: `Estatus cambiado a ${tempEstado}`,
          date: nowStr,
          icon: tempEstado === 'Entregado' ? 'Truck' : tempEstado === 'Finalizado' ? 'CheckCircle' : 'SlidersHorizontal'
        };
        setOtLogs(prev => ({
          ...prev,
          [selectedOT.id]: [...(prev[selectedOT.id] || []), newLog]
        }));
      }
    }
    setSelectedOT(null);
  };

  const handleSaveIncident = () => {
    if (!selectedOT || !newIncidentText.trim()) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newIncident = {
      id: Date.now(),
      type: 'incident',
      text: newIncidentText,
      date: nowStr,
      severity: newIncidentSeverity
    };

    // Save to active incidents
    setOtIncidents(prev => ({
      ...prev,
      [selectedOT.id]: [...(prev[selectedOT.id] || []), newIncident]
    }));

    // Add to history logs
    const newLog = {
      id: Date.now() + 1,
      type: 'incident',
      text: `Incidencia registrada (${newIncidentSeverity}): ${newIncidentText}`,
      date: nowStr,
      icon: 'AlertTriangle'
    };
    setOtLogs(prev => ({
      ...prev,
      [selectedOT.id]: [...(prev[selectedOT.id] || []), newLog]
    }));

    setNewIncidentText('');
    setNewIncidentSeverity('Media');
    setActiveModalView('menu');
  };

  const renderTimeline = (currentEstado) => {
    const currentIndex = stages.indexOf(currentEstado);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0', position: 'relative' }}>
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
              <span style={{ fontSize: '0.65rem', marginTop: '0.5rem', textAlign: 'center', color: isCompletedOrCurrent ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isCompletedOrCurrent ? '600' : '400' }}>
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
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      <div className="flex-row-between" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={28} color="var(--primary-color)" /> Órdenes de Trabajo
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
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <div className="input-group" style={{ position: 'relative', margin: 0 }}>
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(ot => {
          const incidents = otIncidents[ot.id] || [];
          const hasIncidents = incidents.length > 0;
          return (
            <div key={ot.id} className="card hoverable" style={{ margin: 0, cursor: 'pointer', borderLeft: hasIncidents ? '4px solid var(--error-color)' : 'none' }} onClick={() => handleOpenOT(ot)}>
              <div className="flex-row-between" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{ot.id}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ref: {ot.cotizacionId}</span>
                  {hasIncidents && (
                    <span title="Esta orden contiene incidencias activas" style={{ display: 'flex', alignItems: 'center', color: 'var(--error-color)' }}>
                      <span style={{ display: 'inline-flex', padding: '0.2rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '4px' }}>
                        ⚠️ {incidents.length}
                      </span>
                    </span>
                  )}
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
          );
        })}
      </div>

      {selectedOT && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{activeModalView === 'menu' ? 'Acciones de Orden' : activeModalView === 'estatus' ? 'Actualizar Estatus' : activeModalView === 'incidencia' ? 'Registrar Incidencia' : 'Historial y Trazabilidad'}</span>
                  <span style={{ 
                    color: document.body.classList.contains('light-mode') ? '#000000' : '#60a5fa',
                    fontWeight: 'bold',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: document.body.classList.contains('light-mode') ? 'rgba(0, 0, 0, 0.05)' : 'rgba(96, 165, 250, 0.15)'
                  }}>{selectedOT.id}</span>
                </h2>
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.9rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.35rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(var(--primary-color-rgb, 124, 58, 237), 0.05)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--primary-color)'
                }}>
                  <span>Cliente: <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{selectedOT.cliente}</strong> ({selectedOT.tipo})</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Estatus Actual: 
                    <span style={{ 
                      background: `color-mix(in srgb, ${getStatusColor(selectedOT.estado)} 15%, transparent)`, 
                      color: getStatusColor(selectedOT.estado),
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}>{selectedOT.estado}</span>
                  </span>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedOT(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Vista 1: Menú Principal de Acciones */}
            {activeModalView === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.5rem 0' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ height: '48px', fontSize: '0.95rem', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => {
                    setTempEstado(selectedOT.estado);
                    setActiveModalView('estatus');
                  }}
                >
                  ⚙️ Cambiar Estatus
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ height: '48px', fontSize: '0.95rem', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => setActiveModalView('incidencia')}
                >
                  ⚠️ Registrar Incidencia
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ height: '48px', fontSize: '0.95rem', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => setActiveModalView('historial')}
                >
                  ⏳ Ver Historial / Trazabilidad
                </button>
                
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ height: '48px', fontSize: '0.95rem', width: '100%', justifyContent: 'center' }}
                    onClick={() => setSelectedOT(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Vista 2: Cambiar Estatus */}
            {activeModalView === 'estatus' && (
              <div>
                {renderTimeline(tempEstado)}

                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                  <label>Seleccionar Estatus:</label>
                  <select className="input-control" value={tempEstado} onChange={e => setTempEstado(e.target.value)}>
                    {stages.map((stage, index) => {
                      const originalIndex = stages.indexOf(selectedOT.estado);
                      // Permitir revertir a previos o avanzar hasta 1 estatus siguiente
                      if (index <= originalIndex + 1) {
                        return <option key={stage} value={stage}>{stage}</option>;
                      }
                      return null;
                    })}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                    onClick={() => setActiveModalView('menu')}
                  >
                    Atrás
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                    onClick={handleSaveEstado}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {/* Vista 3: Registrar Incidencia */}
            {activeModalView === 'incidencia' && (
              <div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>Nivel de Gravedad:</label>
                  <select className="input-control" value={newIncidentSeverity} onChange={e => setNewIncidentSeverity(e.target.value)}>
                    <option value="Baja">Baja (Informativo / Advertencia)</option>
                    <option value="Media">Media (Retraso en curso)</option>
                    <option value="Alta">Alta (Producción detenida)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Detalle de la Incidencia:</label>
                  <textarea 
                    className="input-control" 
                    rows="4" 
                    placeholder="Describe detalladamente qué ocurrió..."
                    value={newIncidentText}
                    onChange={e => setNewIncidentText(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                    onClick={() => setActiveModalView('menu')}
                  >
                    Atrás
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px', opacity: !newIncidentText.trim() ? 0.5 : 1 }} 
                    disabled={!newIncidentText.trim()}
                    onClick={handleSaveIncident}
                  >
                    Registrar Incidencia
                  </button>
                </div>
              </div>
            )}

            {/* Vista 4: Ver Historial / Trazabilidad */}
            {activeModalView === 'historial' && (
              <div>
                <div style={{ margin: '1rem 0', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {(otLogs[selectedOT.id] || []).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>No hay registros de trazabilidad para esta orden.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem', marginLeft: '0.5rem', position: 'relative' }}>
                      {(() => {
                        const logs = otLogs[selectedOT.id] || [];
                        // Filter to calculate durations only between status changes
                        const statusLogs = logs.filter(l => l.type === 'status');
                        
                        return logs.map((log) => {
                          const isIncident = log.type === 'incident';
                          
                          // Calculate duration if it is a status change log
                          let durationText = '';
                          if (log.type === 'status') {
                            const currentIdx = statusLogs.findIndex(l => l.id === log.id);
                            const parsedCurrentDate = new Date(log.date.replace(' ', 'T'));
                            
                            let nextDate = new Date(); // default to now
                            if (currentIdx !== -1 && currentIdx < statusLogs.length - 1) {
                              nextDate = new Date(statusLogs[currentIdx + 1].date.replace(' ', 'T'));
                            }
                            
                            const diffTime = Math.abs(nextDate - parsedCurrentDate);
                            const diffDays = (diffTime / (1000 * 60 * 60 * 24)).toFixed(1);
                            durationText = `(DURACIÓN: ${diffDays} ${diffDays === '1.0' ? 'día' : 'días'})`;
                          }

                          return (
                            <div key={log.id} style={{ position: 'relative', marginBottom: '0.5rem' }}>
                              <div style={{
                                position: 'absolute',
                                left: '-21px',
                                top: '2px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: isIncident ? 'var(--error-color)' : 'var(--primary-color)',
                                boxShadow: '0 0 0 4px var(--surface-color)'
                              }} />
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{log.date}</span>
                              <p style={{ 
                                margin: '0.2rem 0 0 0', 
                                fontSize: '0.875rem', 
                                color: isIncident ? 'var(--error-color)' : 'var(--text-main)', 
                                fontWeight: isIncident ? '600' : '400',
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <span>{log.text}</span>
                                {durationText && (
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '0.1rem 0.4rem', 
                                    borderRadius: 'var(--radius-sm)', 
                                    backgroundColor: document.body.classList.contains('light-mode') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)', 
                                    color: document.body.classList.contains('light-mode') ? '#059669' : '#34d399',
                                    fontWeight: 'bold',
                                    display: 'inline-block',
                                    border: '1px solid ' + (document.body.classList.contains('light-mode') ? '#a7f3d0' : '#059669')
                                  }}>
                                    {durationText}
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                    onClick={() => setActiveModalView('menu')}
                  >
                    Atrás
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal de Filtros flotante y centrado */}
      {isFilterDrawerOpen && (
        <div className="modal-overlay" onClick={() => setIsFilterDrawerOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <SlidersHorizontal size={20} color="var(--primary-color)" />
                <span>Filtros de Órdenes de Trabajo</span>
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
                  {[...new Set(ordenesTrabajo.map(ot => ot.cliente))].map(cliente => (
                    <option key={cliente} value={cliente}>{cliente}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Rango de Fechas (Entrega)</label>
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
                  <option value="Programación">Programación</option>
                  <option value="Producción">Producción</option>
                  <option value="Revisión">Revisión</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="filterIncidenciaCheckbox" 
                  checked={filterIncidencia} 
                  onChange={e => setFilterIncidencia(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="filterIncidenciaCheckbox" style={{ margin: 0, cursor: 'pointer', userSelect: 'none', fontWeight: '600' }}>
                  ⚠️ Solo Órdenes con Incidencias
                </label>
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
                  setFilterIncidencia(false);
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
      )}
    </div>
  );
}
