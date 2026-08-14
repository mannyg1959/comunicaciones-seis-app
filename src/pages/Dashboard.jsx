import React, { useState, useEffect, useRef } from 'react';
import { 
  mockTimeToCloseData,
  mockRejectionReasonData,
  mockTopClientsData,
  mockOnTimeDeliveryData,
  mockWorkloadByTypeData
} from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Package, User, LayoutDashboard, LogOut, TrendingUp, PieChart as PieChartIcon, BarChart2, Users, CheckCircle, Activity, Plus, ClipboardList, ArrowUp, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { supabase } from '../utils/supabaseClient';
import { formatDate } from '../utils/formatters';

export default function Dashboard({ user, onLogout }) {
  const [activeKpiTab, setActiveKpiTab] = useState('cotizaciones');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            *,
            client:clients (name),
            items:quote_items (*)
          `);
        
        if (error) throw error;
        
        if (data) {
          const mapped = data.map(q => {
            return {
              id: q.id,
              cliente: q.client?.name || 'Sin Cliente',
              tipo: q.items && q.items.length > 0 ? q.items[0].line_of_business : 'Varios',
              monto: q.total,
              estado: q.status,
              fecha: q.created_at.split('T')[0],
              fechaEntrega: q.estimated_delivery_date,
              approvedAt: q.approved_at,
              createdAt: q.created_at,
              description: q.description || '',
              motivoRechazo: q.rejection_reason || '',
              detalleRechazo: q.rejection_details || ''
            };
          });
          setCotizaciones(mapped);
        }

        // Fetch OTs from Supabase
        const { data: otsData, error: otsError } = await supabase
          .from('work_orders')
          .select(`
            *,
            client:clients (name),
            quote:quotes (title)
          `);

        if (otsError) throw otsError;

        const mappedOts = otsData.map(ot => ({
          id: ot.id,
          cotizacionId: ot.quote_id,
          cliente: ot.client?.name || 'Sin Cliente',
          tipo: ot.quote?.title || 'Varios',
          estado: ot.status,
          progreso: ot.progress,
          fechaEntrega: ot.estimated_closure ? ot.estimated_closure.split('T')[0] : 'Sin fecha',
          realStart: ot.real_start,
          realClosure: ot.real_closure,
          createdAt: ot.created_at,
          updatedAt: ot.updated_at
        }));

        setOrdenesTrabajo(mappedOts);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  const activeQuotesForStats = cotizaciones.filter(c => !ordenesTrabajo.some(ot => ot.cotizacionId === c.id));
  const cotizacionStatusCounts = {
    'Borrador': 0,
    'Pendiente': 0,
    'Enviada': 0,
    'En Negociación': 0,
    'Aprobada': 0,
    'Rechazada': 0,
    'Anulada': 0
  };
  activeQuotesForStats.forEach(c => {
    if (cotizacionStatusCounts[c.estado] !== undefined) {
      cotizacionStatusCounts[c.estado]++;
    }
  });

  const cotizacionesList = [
    { name: 'Borrador', count: cotizacionStatusCounts['Borrador'], color: 'var(--text-muted)' },
    { name: 'Pendiente', count: cotizacionStatusCounts['Pendiente'], color: 'var(--warning-color)' },
    { name: 'Enviada', count: cotizacionStatusCounts['Enviada'], color: 'var(--secondary-color)' }, 
    { name: 'En Negociación', count: cotizacionStatusCounts['En Negociación'], color: 'var(--tertiary-color)' }, 
    { name: 'Aprobada', count: cotizacionStatusCounts['Aprobada'], color: 'var(--success-color)' },
    { name: 'Rechazada', count: cotizacionStatusCounts['Rechazada'], color: 'var(--error-color)' },
    { name: 'Anulada', count: cotizacionStatusCounts['Anulada'], color: 'var(--text-muted)' }
  ];

  const orderStatusCounts = {
    'Programación': 0,
    'Producción': 0,
    'Revisión': 0,
    'Finalizado': 0,
    'Entregado': 0
  };
  
  ordenesTrabajo.forEach(ot => {
    if (orderStatusCounts[ot.estado] !== undefined) {
      orderStatusCounts[ot.estado]++;
    }
  });

  const ordenesList = [
    { name: 'Programación', count: orderStatusCounts['Programación'], color: 'var(--status-pendiente)' },
    { name: 'Producción', count: orderStatusCounts['Producción'], color: 'var(--status-produccion)' },
    { name: 'Revisión', count: orderStatusCounts['Revisión'], color: 'var(--status-revision)' },
    { name: 'Finalizado', count: orderStatusCounts['Finalizado'], color: 'var(--status-finalizado)' },
    { name: 'Entregado', count: orderStatusCounts['Entregado'], color: 'var(--status-entregado)' }
  ];

  const dynamicOrderStatusData = [
    { name: 'Programación', cantidad: orderStatusCounts['Programación'] },
    { name: 'Producción', cantidad: orderStatusCounts['Producción'] },
    { name: 'Revisión', cantidad: orderStatusCounts['Revisión'] },
    { name: 'Finalizado', cantidad: orderStatusCounts['Finalizado'] },
    { name: 'Entregado', cantidad: orderStatusCounts['Entregado'] },
  ];

  const filteredOrderStatusData = dynamicOrderStatusData.filter(item => item.name !== 'Entregado');
  const totalOrders = filteredOrderStatusData.reduce((sum, item) => sum + item.cantidad, 0);

  const totalQuotes = activeQuotesForStats.length;
  const aprobadas = activeQuotesForStats.filter(c => c.estado === 'Aprobada').length;
  const rechazadas = activeQuotesForStats.filter(c => c.estado === 'Rechazada' || c.estado === 'Anulada').length;
  const pendientes = totalQuotes - aprobadas - rechazadas;

  const totalActiveQuotes = activeQuotesForStats.length;
  const conversionData = [
    { name: 'Borrador', value: totalActiveQuotes > 0 ? Math.round((cotizacionStatusCounts['Borrador'] / totalActiveQuotes) * 100) : 0, color: '#94a3b8' },
    { name: 'Pendiente', value: totalActiveQuotes > 0 ? Math.round((cotizacionStatusCounts['Pendiente'] / totalActiveQuotes) * 100) : 0, color: 'var(--warning-color)' },
    { name: 'Enviada', value: totalActiveQuotes > 0 ? Math.round((cotizacionStatusCounts['Enviada'] / totalActiveQuotes) * 100) : 0, color: 'var(--secondary-color)' },
    { name: 'En Negociación', value: totalActiveQuotes > 0 ? Math.round((cotizacionStatusCounts['En Negociación'] / totalActiveQuotes) * 100) : 0, color: 'var(--tertiary-color)' },
    { name: 'Aprobada', value: totalActiveQuotes > 0 ? Math.round((cotizacionStatusCounts['Aprobada'] / totalActiveQuotes) * 100) : 0, color: 'var(--success-color)' },
    { name: 'Rechazada', value: totalActiveQuotes > 0 ? Math.round((cotizacionStatusCounts['Rechazada'] / totalActiveQuotes) * 100) : 0, color: 'var(--error-color)' },
    { name: 'Anulada', value: totalActiveQuotes > 0 ? Math.round((cotizacionStatusCounts['Anulada'] / totalActiveQuotes) * 100) : 0, color: '#64748b' }
  ].filter(item => item.value > 0);

  const rechazadasQuotes = cotizaciones.filter(c => c.estado === 'Rechazada');
  const totalRechazadas = rechazadasQuotes.length;

  const countInterno = rechazadasQuotes.filter(c => c.motivoRechazo === 'Rechazo Interno').length;
  const countCliente = rechazadasQuotes.filter(c => c.motivoRechazo === 'Rechazo por Parte del Cliente').length;
  const countAutomatico = rechazadasQuotes.filter(c => c.motivoRechazo === 'Rechazo Automático').length;

  const pctInterno = totalRechazadas > 0 ? Math.round((countInterno / totalRechazadas) * 100) : 0;
  const pctCliente = totalRechazadas > 0 ? Math.round((countCliente / totalRechazadas) * 100) : 0;
  const pctAutomatico = totalRechazadas > 0 ? Math.round((countAutomatico / totalRechazadas) * 100) : 0;

  const rejectionReasonData = [
    { name: 'Rechazo Interno', value: pctInterno, color: '#ff4d4f' },
    { name: 'Rechazo por Parte del Cliente', value: pctCliente, color: '#faad14' },
    { name: 'Rechazo Automático', value: pctAutomatico, color: '#722ed1' }
  ];

  const clientVolumes = {};
  cotizaciones.forEach(c => {
    const hasOT = ordenesTrabajo.some(ot => ot.cotizacionId === c.id);
    if (c.estado === 'Aprobada' && hasOT) {
      clientVolumes[c.cliente] = (clientVolumes[c.cliente] || 0) + (c.monto || 0);
    }
  });
  const topClientsData = Object.keys(clientVolumes)
    .map(name => ({ name, volumen: clientVolumes[name] }))
    .sort((a, b) => b.volumen - a.volumen)
    .slice(0, 5);

  const totalOTs = ordenesTrabajo.length;
  const delayedOTs = ordenesTrabajo.filter(ot => {
    if (ot.estado === 'Entregado' || ot.estado === 'Finalizado') return false;
    if (!ot.fechaEntrega) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const [y, m, d] = ot.fechaEntrega.split('-');
    const deliveryDate = new Date(y, m - 1, d);
    return deliveryDate < today;
  }).length;
  const onTimeOTs = totalOTs - delayedOTs;
  
  const pctOnTime = totalOTs > 0 ? Math.round((onTimeOTs / totalOTs) * 100) : 100;
  const pctDelayed = totalOTs > 0 ? (100 - pctOnTime) : 0;
  
  const onTimeDeliveryData = [
    { name: 'A Tiempo', value: pctOnTime, color: 'var(--success-color)' },
    { name: 'Con Retraso', value: pctDelayed, color: 'var(--error-color)' }
  ];

  const getDynamicCycleTimeData = (ots) => {
    const data = [];
    const todayVal = new Date();
    
    const completedOts = ots.filter(ot => 
      (ot.estado === 'Finalizado' || ot.estado === 'Entregado')
    );

    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(todayVal);
      weekStart.setDate(todayVal.getDate() - (i + 1) * 7);
      const weekEnd = new Date(todayVal);
      weekEnd.setDate(todayVal.getDate() - i * 7);
      
      const otsInWeek = completedOts.filter(ot => {
        const completionDate = new Date(ot.realClosure || ot.updatedAt || ot.fechaEntrega);
        return completionDate >= weekStart && completionDate < weekEnd;
      });

      let avgDays = 0;
      if (otsInWeek.length > 0) {
        const sumDays = otsInWeek.reduce((sum, ot) => {
          const start = new Date(ot.realStart || ot.createdAt || ot.fechaEntrega);
          const end = new Date(ot.realClosure || ot.updatedAt || ot.fechaEntrega);
          const diffTime = Math.max(0, end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
          return sum + diffDays;
        }, 0);
        avgDays = Math.round((sumDays / otsInWeek.length) * 10) / 10;
      }

      const startStr = formatDate(weekStart);
      const endStr = formatDate(weekEnd);
      data.push({
        name: `${startStr} - ${endStr}`,
        dias: avgDays
      });
    }
    return data;
  };

  const productionCycleTimeData = getDynamicCycleTimeData(ordenesTrabajo);

  const typeCounts = {};
  ordenesTrabajo.forEach(ot => {
    const t = ot.tipo || 'Varios';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const colorsList = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
  const workloadByTypeData = Object.keys(typeCounts).map((name, index) => ({
    name,
    value: totalOTs > 0 ? Math.round((typeCounts[name] / totalOTs) * 100) : 0,
    color: colorsList[index % colorsList.length]
  }));

  const approvedQuotes = cotizaciones.filter(c => c.estado === 'Aprobada' && c.approvedAt && c.createdAt);
  const timeToCloseData = [];
  const todayVal = new Date();
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(todayVal);
    weekStart.setDate(todayVal.getDate() - (i + 1) * 7);
    const weekEnd = new Date(todayVal);
    weekEnd.setDate(todayVal.getDate() - i * 7);
    
    const quotesInWeek = approvedQuotes.filter(q => {
      const appDate = new Date(q.approvedAt);
      return appDate >= weekStart && appDate < weekEnd;
    });
    
    let avgDays = 0;
    if (quotesInWeek.length > 0) {
      const sumDays = quotesInWeek.reduce((sum, q) => {
        const diffMs = new Date(q.approvedAt) - new Date(q.createdAt);
        const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      avgDays = parseFloat((sumDays / quotesInWeek.length).toFixed(1));
    }
    
    const startStr = formatDate(weekStart);
    const endStr = formatDate(weekEnd);
    timeToCloseData.push({
      name: `${startStr} - ${endStr}`,
      dias: avgDays
    });
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Cargando panel...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="page-content">
      <div style={{
        position: 'sticky',
        top: '-1.5rem',
        zIndex: 100,
        backgroundColor: 'var(--bg-color)',
        margin: '-1.5rem -1.5rem 1rem -1.5rem',
        padding: '1.5rem 1.5rem 0.25rem 1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', margin: '0 0 0.75rem 0', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={28} color="var(--primary-color)" /> Panel de Control
          </h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)' }}>
            {(() => {
              const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
              const today = new Date();
              return `${days[today.getDay()]}, ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}`;
            })()}
          </span>

          <div className="logo-container" onClick={() => window.location.reload()} title="Recargar Panel" style={{ padding: 0 }}>
            <img src="/logo-flowlog.png" alt="Logo" style={{ height: '36px', mixBlendMode: 'normal', display: 'block' }} />
          </div>
        </div>
      </div>

      <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '1.5rem', background: 'var(--surface-hover)' }}>
        <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
          <img 
            src={user?.avatar_url || '/FotoPerfilPlantilla.jpg'} 
            alt={user?.name || 'Usuario'}
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              backgroundColor: 'var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div style={{ 
            display: 'none',
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark-color, #1e1b4b) 100%)', 
            color: 'white', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--text-main)' }}>{user?.name || 'Administrador'}</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.35rem' }}>
            <p className="dashboard-username">Usuario: @{user?.username || 'admin'}</p>
            <span className="dashboard-role">
              {user?.role === 'Admin' ? 'Administrador' : user?.role === 'Ventas' ? 'Ejecutivo de Ventas' : user?.role === 'Produccion' ? 'Jefe de Producción' : 'Administrador'}
            </span>
          </div>
        </div>
        {onLogout && (
          <button className="btn-icon btn-icon-red" onClick={onLogout} title="Cerrar sesión" style={{ cursor: 'pointer', border: 'none' }}>
            <LogOut size={20} />
          </button>
        )}
      </div>

      {hasError ? (
        <div className="card glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={48} color="var(--error-color)" />
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Sin información disponible por falla de conexión</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: '1.4' }}>
            Hubo un problema al cargar las estadísticas desde la base de datos de Supabase. Por favor, verifica tu conexión e inténtalo de nuevo.
          </p>
          <button 
            type="button"
            className="btn btn-solid" 
            style={{ padding: '0 1.5rem', height: '48px', fontSize: '0.95rem', marginTop: '0.5rem' }} 
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Acciones Rápidas</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <button 
              className="btn btn-solid" 
              onClick={() => navigate('/cotizaciones?new=true')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1, padding: '0.75rem' }}
            >
              <Plus size={18} />
              <span>Nueva Cotización</span>
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/ordenes')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1, padding: '0.75rem' }}
            >
              <ClipboardList size={18} />
              <span>Ver Órdenes</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* COTIZACIONES */}
            <div className="card glass-panel" style={{ padding: '1rem', margin: 0 }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="var(--primary-color)" /> Cotizaciones
                </div>
                <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--surface-color)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  Total: {activeQuotesForStats.length}
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cotizacionesList.map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></div>
                      <span style={{ fontSize: '0.875rem' }}>{item.name}</span>
                    </div>
                    <strong style={{ fontSize: '1rem' }}>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
            
            {/* ORDENES DE TRABAJO */}
            <div className="card glass-panel" style={{ padding: '1rem', margin: 0 }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={20} color="var(--primary-color)" /> Órdenes (OT)
                </div>
                <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--surface-color)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  Total: {totalOTs}
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ordenesList.map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></div>
                      <span style={{ fontSize: '0.875rem' }}>{item.name}</span>
                    </div>
                    <strong style={{ fontSize: '1rem' }}>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KPI CHARTS SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', margin: '2rem 0 1.5rem 0' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={24} color="var(--primary-color)" /> Indicadores Clave (KPIs)
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--surface-hover)', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
              <button 
                className={`btn ${activeKpiTab === 'cotizaciones' ? 'btn-solid' : 'btn-text'}`}
                style={{ padding: '0.5rem 1rem', margin: 0, fontSize: '0.875rem' }}
                onClick={() => setActiveKpiTab('cotizaciones')}
              >
                Cotizaciones
              </button>
              <button 
                className={`btn ${activeKpiTab === 'produccion' ? 'btn-solid' : 'btn-text'}`}
                style={{ padding: '0.5rem 1rem', margin: 0, fontSize: '0.875rem' }}
                onClick={() => setActiveKpiTab('produccion')}
              >
                Producción
              </button>
            </div>
          </div>
          
          {activeKpiTab === 'cotizaciones' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* KPI 1: Tasa de Conversión */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieChartIcon size={18} color="var(--success-color)" /> Situación de Cotizaciones sin OT
                </h3>
                <div style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {conversionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        itemStyle={{ color: 'var(--text-main)' }}
                        formatter={(value) => `${value}%`}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(value, entry) => `${value}: ${entry.payload.value}%`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '35%', left: '0', right: '0', textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalActiveQuotes}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Activas</div>
                  </div>
                </div>
              </div>
              <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                  Muestra la distribución porcentual y situación actual de todas las cotizaciones cargadas en el sistema que todavía no se han convertido en una Orden de Trabajo (OT).
                </p>
              </div>
            </div>

            {/* KPI 2: Tiempo Medio de Cierre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="var(--primary-color)" /> Tiempo Medio de Cierre
                </h3>
                {aprobadas === 0 && rechazadas === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Sin datos de cierre registrados
                  </div>
                ) : (
                  <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeToCloseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="d" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                          itemStyle={{ color: 'var(--text-main)' }}
                          cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Line type="monotone" dataKey="dias" name="Días" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                  Mide el promedio de días que transcurren desde que se emite una cotización hasta que el cliente la acepta o rechaza.
                </p>
              </div>
            </div>

            {/* KPI 3: Tasa de Cotizaciones Rechazadas por Motivo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart2 size={18} color="var(--error-color)" /> Rechazos por Motivo
                </h3>
                {rechazadas === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Sin cotizaciones rechazadas
                  </div>
                ) : (
                  <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rejectionReasonData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                        <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                        <YAxis dataKey="name" type="category" stroke="var(--text-main)" fontSize={11} tickLine={false} axisLine={false} width={120} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                          itemStyle={{ color: 'var(--text-main)' }}
                          cursor={{ fill: 'var(--surface-hover)' }}
                        />
                        <Bar dataKey="value" name="Porcentaje" radius={[0, 4, 4, 0]}>
                          {rejectionReasonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <LabelList dataKey="value" position="right" formatter={(val) => `${val}%`} style={{ fill: 'var(--text-muted)', fontSize: '0.75rem' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                  Analiza las razones principales por las cuales los clientes no aprueban las cotizaciones, ayudando a identificar áreas de mejora.
                </p>
              </div>
            </div>

            {/* KPI 4: Top Clientes por Volumen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--secondary-color)" /> Top Clientes (Volumen $)
                </h3>
                <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topClientsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        itemStyle={{ color: 'var(--text-main)' }}
                        cursor={{ fill: 'var(--surface-hover)' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Volumen']}
                      />
                      <Bar dataKey="volumen" fill="var(--secondary-color)" radius={[4, 4, 0, 0]}>
                        <LabelList 
                          dataKey="volumen" 
                          position="top" 
                          formatter={(val) => `$${(val/1000).toFixed(1)}k`}
                          style={{ fill: 'var(--text-main)', fontSize: '0.75rem', fontWeight: '500' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                  Muestra los clientes que generan el mayor volumen de ingresos proyectados a partir de las cotizaciones aprobadas.
                </p>
              </div>
            </div>
          </div>
          )}

          {activeKpiTab === 'produccion' && (
            totalOTs === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', gap: '1rem', textAlign: 'center', marginBottom: '2rem' }}>
                <AlertTriangle size={48} color="var(--warning-color)" style={{ color: 'var(--warning-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Sin Órdenes de Trabajo</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  No hay Órdenes de Trabajo registradas en el sistema. Genera una Orden de Trabajo desde una cotización aprobada para comenzar a visualizar las estadísticas operativas en este panel.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* KPI 1: On-Time Delivery */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} color="var(--success-color)" /> Índice de Entregas a Tiempo
                    </h3>
                    <div style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={onTimeDeliveryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {onTimeDeliveryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                            itemStyle={{ color: 'var(--text-main)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: '40%', left: '0', right: '0', textAlign: 'center', pointerEvents: 'none' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{pctOnTime}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                      Porcentaje de Órdenes de Trabajo que se completan y entregan al cliente en o antes de la fecha límite acordada.
                    </p>
                  </div>
                </div>

                {/* KPI 2: Production Cycle Time */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} color="var(--primary-color)" /> Ciclo de Producción
                    </h3>
                    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productionCycleTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="d" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                            itemStyle={{ color: 'var(--text-main)' }}
                            cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '3 3' }}
                          />
                          <Line type="monotone" dataKey="dias" name="Días" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                      Cantidad promedio de días que una Orden de Trabajo pasa estrictamente en el estado de Producción.
                    </p>
                  </div>
                </div>

                {/* KPI 3: Workload Distribution */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="card glass-panel" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', margin: 0 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} color="var(--secondary-color)" /> Carga por Servicio
                    </h3>
                    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadByTypeData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                          <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                          <YAxis dataKey="name" type="category" stroke="var(--text-main)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}
                            itemStyle={{ color: 'var(--text-main)' }}
                            cursor={{ fill: 'var(--surface-hover)' }}
                          />
                          <Bar dataKey="value" name="Volumen" radius={[0, 4, 4, 0]}>
                            {workloadByTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" position="right" formatter={(val) => `${val}%`} style={{ fill: 'var(--text-muted)', fontSize: '0.75rem' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card glass-panel" style={{ padding: '0.75rem 1rem', margin: 0, backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                      Porcentaje de volumen de trabajo por línea de negocio o tipo de servicio sobre el total de órdenes de trabajo activas.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </>
      )}

      {showScrollTop && (
        <button 
          type="button"
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '7.5rem',
            right: '1.5rem',
            backgroundColor: 'var(--primary-color)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'all 0.3s ease',
            opacity: 0.9
          }}
          title="Regresar al inicio"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
