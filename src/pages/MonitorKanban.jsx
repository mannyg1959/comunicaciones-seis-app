import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Clock, AlertTriangle, Maximize, AlertCircle, Lock } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/formatters';
import MonitorTicker from '../components/MonitorTicker';

export default function MonitorKanban() {
  const { token } = useParams();
  const [isTokenValid, setIsTokenValid] = useState(null); // null = verifying, true = ok, false = denied
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Validar el token de la URL
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          setIsTokenValid(false);
          return;
        }
        const { data, error } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'monitor_tv_token')
          .maybeSingle();
        
        if (error) throw error;
        
        if (data && data.setting_value === token) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
        }
      } catch (err) {
        console.error('Error verificando token del monitor:', err);
        setIsTokenValid(false);
      }
    };
    verifyToken();
  }, [token]);

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
    
    // Intentar entrar en pantalla completa automáticamente
    const tryFullScreen = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn(`No se pudo iniciar pantalla completa automáticamente: ${err.message}`);
        });
      }
    };
    
    tryFullScreen();

    // Fallback: si el navegador bloquea el auto-fullscreen por falta de interacción previa, 
    // lo intentamos en el primer clic del usuario en cualquier parte de la pantalla.
    const handleFirstClick = () => {
      tryFullScreen();
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    
    fetchOrders();

    // Actualizar reloj cada segundo
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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
      document.removeEventListener('click', handleFirstClick);
      clearInterval(clockInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const [pageIndexes, setPageIndexes] = useState({});
  const itemsPerPage = 3;

  // Paginación automática (Carrusel) para las columnas
  useEffect(() => {
    if (loading || ordenesTrabajo.length === 0) return;

    const intervalId = setInterval(() => {
      setPageIndexes(prev => {
        const nextIndexes = { ...prev };
        stages.forEach(stage => {
          const columnOrders = ordenesTrabajo.filter(ot => ot.estado === stage);
          const totalPages = Math.ceil(columnOrders.length / itemsPerPage);
          if (totalPages > 1) {
            const current = nextIndexes[stage] || 0;
            nextIndexes[stage] = (current + 1) % totalPages;
          } else {
            nextIndexes[stage] = 0;
          }
        });
        return nextIndexes;
      });
    }, 10000); // Cambiar de página cada 10 segundos

    return () => clearInterval(intervalId);
  }, [loading, ordenesTrabajo]);

  if (isTokenValid === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ textAlign: 'center', background: '#1e293b', padding: '3rem', borderRadius: '16px', border: '1px solid #334155', maxWidth: '500px', width: '100%' }}>
          <Lock size={64} color="#f87171" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#f87171', marginBottom: '1rem', fontSize: '1.75rem' }}>Acceso Denegado</h2>
          <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '1.1rem' }}>
            El enlace que has utilizado es inválido o ha sido revocado por el administrador.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2rem' }}>
            Si eres el administrador, puedes generar un nuevo enlace desde la sección de Ajustes del sistema.
          </p>
        </div>
      </div>
    );
  }

  const getOrdersByStage = (stage) => ordenesTrabajo.filter(ot => ot.estado === stage);

  return (
    <div className="monitor-container monitor-with-ticker">
      <header className="monitor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
          <h1 style={{ margin: 0 }}>Tablero de Control de Producción</h1>
        </div>
        <div className="monitor-clock" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{currentTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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
            const totalPages = Math.ceil(columnOrders.length / itemsPerPage);
            const currentPage = pageIndexes[stage] || 0;
            const paginatedOrders = columnOrders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

            return (
              <div key={stage} className={`monitor-column stage-${stage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
                <div className="column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>{stage}</h2>
                    {totalPages > 1 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        (Pág {currentPage + 1}/{totalPages})
                      </span>
                    )}
                  </div>
                  <span className="count-badge">{columnOrders.length}</span>
                </div>
                
                <div className="column-cards-container">
                  <div className="cards-scroll-track" style={{ transition: 'opacity 0.3s ease-in-out' }}>
                    {paginatedOrders.map(ot => (
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
