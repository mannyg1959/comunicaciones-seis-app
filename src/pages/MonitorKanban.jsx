import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Clock, AlertTriangle, Maximize, AlertCircle } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/formatters';
import MonitorTicker from '../components/MonitorTicker';

export default function MonitorKanban() {
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Excluimos "Entregado" para optimizar el espacio en el TV.
  const stages = ['Programación', 'Producción', 'Revisión', 'Finalizado'];

  const fetchOrders = async () => {
    try {
      const { data: otsData, error: otsError } = await supabase
        .from('work_orders')
        .select('*, client:clients(name), quote:quotes(title)')
        .neq('status', 'Entregado'); // No mostrar entregados en el TV

      if (otsError) throw otsError;

      const { data: incidentsData, error: incidentsError } = await supabase
        .from('work_order_incidents')
        .select('work_order_id, resolved')
        .eq('resolved', false);

      const incidentCounts = {};
      if (!incidentsError && incidentsData) {
        incidentsData.forEach(inc => {
          incidentCounts[inc.work_order_id] = (incidentCounts[inc.work_order_id] || 0) + 1;
        });
      }

      const mappedOts = otsData.map(ot => ({
        id: ot.id,
        cotizacionId: ot.quote_id,
        cliente: ot.client?.name || 'Sin Cliente',
        tipo: ot.quote?.title || 'Varios',
        estado: ot.status,
        progreso: ot.progress || 0,
        fechaEntrega: ot.estimated_closure ? ot.estimated_closure.split('T')[0] : 'Sin fecha',
        fechaFinTrabajo: ot.production_deadline ? ot.production_deadline.split('T')[0] : null,
        updatedAt: ot.updated_at || ot.created_at,
        isPaused: !!ot.pause_reason,
        pauseMotivo: ot.pause_reason || '',
        operarioAsignado: ot.assigned_operative || null,
        incidentes: incidentCounts[ot.id] || 0,
      }));

      // Ordenar: pausadas al final, luego por progreso
      mappedOts.sort((a, b) => {
        if (a.isPaused && !b.isPaused) return 1;
        if (!a.isPaused && b.isPaused) return -1;
        return b.progreso - a.progreso;
      });

      setOrdenesTrabajo(mappedOts);
    } catch (err) {
      console.error('Error fetching orders for monitor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Forzar modo oscuro y ocultar scrollbars para el TV
    document.body.classList.add('monitor-mode');
    
    fetchOrders();

    // Actualizar reloj cada minuto
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Suscripción a Realtime para actualizaciones automáticas
    const channel = supabase
      .channel('public:monitor_kanban_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        (payload) => {
          console.log('Cambio detectado en Órdenes de Trabajo, recargando Monitor...', payload);
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_order_incidents' },
        (payload) => {
          console.log('Cambio detectado en Alertas (Incidentes), recargando Monitor...', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      document.body.classList.remove('monitor-mode');
      clearInterval(clockInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll (marquesina) para las columnas
  useEffect(() => {
    if (loading || ordenesTrabajo.length === 0) return;
    
    let animationFrameId;
    const directions = new Map();
    const speed = 0.4; // Velocidad del scroll (píxeles por frame)

    const animateScroll = () => {
      const containers = document.querySelectorAll('.column-cards-container');
      
      containers.forEach((container, index) => {
        // Solo animar si hay desbordamiento (overflow)
        if (container.scrollHeight > container.clientHeight) {
          let dir = directions.get(index) || 1; // 1 = abajo, -1 = arriba
          
          container.scrollTop += speed * dir;
          
          // Si llega abajo, cambiar dirección hacia arriba
          if (dir === 1 && container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
            directions.set(index, -1);
          } 
          // Si llega arriba, cambiar dirección hacia abajo
          else if (dir === -1 && container.scrollTop <= 0) {
            directions.set(index, 1);
          }
        }
      });
      
      animationFrameId = requestAnimationFrame(animateScroll);
    };

    // Iniciar un poco después para dar tiempo al renderizado de las tarjetas
    const timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animateScroll);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading, ordenesTrabajo]);

  const getOrdersByStage = (stage) => ordenesTrabajo.filter(ot => ot.estado === stage);

  return (
    <div className="monitor-container monitor-with-ticker">
      <header className="monitor-header">
        <h1>MONITOR DE PRODUCCIÓN SEIS</h1>
        <div className="monitor-clock" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{currentTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          <button 
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => console.log(err));
              } else {
                document.exitFullscreen();
              }
            }}
            style={{
              background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)',
              cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Pantalla Completa (F11)"
          >
            <Maximize size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="monitor-loading">
          <div className="spinner"></div>
          <h2>Cargando tablero en vivo...</h2>
        </div>
      ) : (
        <div className="monitor-board">
          {stages.map(stage => {
            const columnOrders = getOrdersByStage(stage);
            return (
              <div key={stage} className={`monitor-column stage-${stage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
                <div className="column-header">
                  <h2>{stage}</h2>
                  <span className="count-badge">{columnOrders.length}</span>
                </div>
                
                <div className="column-cards-container">
                  <div className="cards-scroll-track">
                    {columnOrders.map(ot => (
                      <div key={ot.id} className={`monitor-card-v2 ${ot.isPaused ? 'paused' : ''}`}>
                        
                        {/* Header: ID, Ref, Alertas, Etapa */}
                        <div className="card-header-v2">
                          <div className="id-group">
                            <span className="ot-id">{ot.id}</span>
                            {ot.cotizacionId && <span className="ot-ref">Ref: {ot.cotizacionId}</span>}
                          </div>
                          
                          <div className="badges-group">
                            {ot.incidentes > 0 && (
                              <div className="alert-badge">
                                ⚠️ {ot.incidentes}
                              </div>
                            )}
                            <div className="stage-badge">{ot.estado}</div>
                          </div>
                        </div>
                        
                        {/* Body: Cliente - Tipo */}
                        <h3 className="card-client-v2">{ot.cliente} - {ot.tipo}</h3>
                        
                        {/* Dates and GAP */}
                        <div className="card-info-row">
                          <span className="info-label">Entrega: <span className="info-value">{formatDate(ot.fechaEntrega)}</span></span>
                          <span className={`gap-badge ${!ot.operarioAsignado ? 'unassigned' : ''}`}>
                            GAP: {ot.operarioAsignado ? ot.operarioAsignado.split(' ')[0] : 'Sin asignar'}
                          </span>
                        </div>
                        
                        <div className="card-info-row-small">
                          <span className="info-label-small">Ingreso a Prog.: {ot.updatedAt ? formatDateTime(ot.updatedAt) : ''}</span>
                        </div>
                        
                        <div className="card-info-row-small">
                          <span className="info-label-small">
                            Fin de Trabajo (Target): <span className={`target-value ${!ot.fechaFinTrabajo ? 'missing' : ''}`}>{ot.fechaFinTrabajo ? formatDate(ot.fechaFinTrabajo) : 'Sin Asignar'}</span>
                          </span>
                        </div>
                        
                        {/* Progress */}
                        <div className="card-progress-v2">
                          <div className="progress-bar-bg">
                            <div 
                              className="progress-bar-fill" 
                              style={{ 
                                width: `${ot.progreso}%`,
                                backgroundColor: ot.progreso === 100 ? 'var(--success-color)' : (ot.isPaused ? 'var(--error-color)' : 'var(--primary-color)')
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">{ot.progreso}%</span>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TICKER HORIZONTAL INFERIOR ── */}
      <MonitorTicker />
    </div>
  );
}
