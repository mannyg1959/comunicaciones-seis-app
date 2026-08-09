import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  BarChart2, 
  Calculator, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  User, 
  Clock, 
  ClipboardList, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  FileSpreadsheet,
  Download,
  X
} from 'lucide-react';
import { 
  mockRejectionReasonData
} from '../data/mockData';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { supabase } from '../utils/supabaseClient';

export default function Herramientas({ user }) {
  const [activeTab, setActiveTab] = useState('reportes'); // 'reportes' or 'alertas'
  const [reportSubTab, setReportSubTab] = useState('cotizaciones');
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(true);

  // Alert modals state
  const [selectedAlertCotizacion, setSelectedAlertCotizacion] = useState(null);
  const [selectedAlertOT, setSelectedAlertOT] = useState(null);

  // Export State
  const [exportType, setExportType] = useState('cotizaciones');
  const [exportStatus, setExportStatus] = useState('Todos');
  const [exportClient, setExportClient] = useState('Todos');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch real quotes from Supabase
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select(`
            *,
            client:clients (id, name, contact_name),
            seller:profiles (name),
            items:quote_items (*)
          `)
          .order('created_at', { ascending: false });

        if (quotesError) throw quotesError;

        const mappedQuotes = quotesData.map(q => {
          return {
            id: q.id,
            cliente: q.client?.name || 'Sin Cliente',
            clientId: q.client_id,
            contacto: q.contact_name || q.client?.contact_name || '',
            tipo: q.items && q.items.length > 0 ? q.items[0].line_of_business + (q.items.length > 1 ? ' y otros' : '') : 'Varios',
            monto: q.total,
            estado: q.status,
            fecha: q.created_at.split('T')[0],
            fechaEntrega: q.estimated_delivery_date,
            ejecutivo: q.seller?.name || 'Desconocido',
            sellerId: q.seller_id,
            description: q.description || '',
            motivoRechazo: q.rejection_reason || '',
            detalleRechazo: q.rejection_details || '',
            items: q.items.map(item => ({
              id: item.id,
              lineaNegocio: item.line_of_business,
              descripcion: item.description,
              cantidad: item.quantity,
              costoUnitario: item.unit_price,
              ...item.technical_details
            }))
          };
        });

        setCotizaciones(mappedQuotes);

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
        console.error('Error fetching dashboard tools data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Unique clients for filtering
  const uniqueClients = Array.from(new Set([
    ...cotizaciones.map(c => c.cliente),
    ...ordenesTrabajo.map(ot => ot.cliente)
  ]));

  const getFilteredDataForExport = () => {
    if (exportType === 'cotizaciones') {
      return cotizaciones.filter(c => {
        const matchesStatus = exportStatus === 'Todos' ? true : c.estado === exportStatus;
        const matchesClient = exportClient === 'Todos' ? true : c.cliente === exportClient;
        return matchesStatus && matchesClient;
      });
    } else {
      return ordenesTrabajo.filter(ot => {
        const matchesStatus = exportStatus === 'Todos' ? true : ot.estado === exportStatus;
        const matchesClient = exportClient === 'Todos' ? true : ot.cliente === exportClient;
        return matchesStatus && matchesClient;
      });
    }
  };

  const handleExportCSV = () => {
    const data = getFilteredDataForExport();
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    
    if (exportType === 'cotizaciones') {
      csvContent += 'ID,Cliente,Tipo,Monto,Estado,Fecha,Fecha Entrega,Ejecutivo\r\n';
      data.forEach(item => {
        const row = [
          item.id,
          `"${item.cliente}"`,
          `"${item.tipo}"`,
          item.monto,
          `"${item.estado}"`,
          item.fecha,
          item.fechaEntrega,
          `"${item.ejecutivo || 'No Asignado'}"`
        ];
        csvContent += row.join(',') + '\r\n';
      });
    } else {
      csvContent += 'ID,ID Cotizacion,Cliente,Tipo,Estado,Progreso,Fecha Entrega,Ejecutivo\r\n';
      data.forEach(item => {
        const matchingCot = cotizaciones.find(c => c.id === item.cotizacionId);
        const ejecutivoName = matchingCot?.ejecutivo || 'No Asignado';
        const row = [
          item.id,
          item.cotizacionId,
          `"${item.cliente}"`,
          `"${item.tipo}"`,
          `"${item.estado}"`,
          `"${item.progreso}%"`,
          item.fechaEntrega,
          `"${ejecutivoName}"`
        ];
        csvContent += row.join(',') + '\r\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_${exportType === 'cotizaciones' ? 'Cotizaciones' : 'OrdenesTrabajo'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic computations for charts
  const activeQuotesForStats = cotizaciones.filter(c => !ordenesTrabajo.some(ot => ot.cotizacionId === c.id));
  const totalQuotes = activeQuotesForStats.length;
  const aprobadas = activeQuotesForStats.filter(c => c.estado === 'Aprobada').length;
  const rechazadas = activeQuotesForStats.filter(c => c.estado === 'Rechazada' || c.estado === 'Anulada').length;
  const pendientes = totalQuotes - aprobadas - rechazadas;

  const pctAprobadas = totalQuotes > 0 ? Math.round((aprobadas / totalQuotes) * 100) : 0;
  const pctRechazadas = totalQuotes > 0 ? Math.round((rechazadas / totalQuotes) * 100) : 0;
  const pctPendientes = totalQuotes > 0 ? (100 - pctAprobadas - pctRechazadas) : 0;

  const conversionData = [
    { name: 'Aprobadas', value: pctAprobadas, color: 'var(--success-color)' },
    { name: 'Rechazadas', value: pctRechazadas, color: 'var(--error-color)' },
    { name: 'Pendientes', value: pctPendientes, color: 'var(--warning-color)' }
  ];

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

      const startStr = weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const endStr = weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
    value: typeCounts[name],
    color: colorsList[index % colorsList.length]
  }));

  // Process Alerts dynamically (upcoming within 7 days or overdue)
  const today = new Date();
  today.setHours(0,0,0,0);
  const limitDate = new Date(today);
  limitDate.setDate(limitDate.getDate() + 7);

  const cotizacionesAlertas = cotizaciones.filter(c => 
    (c.estado === 'Pendiente' || c.estado === 'Enviada' || c.estado === 'En Negociación') && 
    c.fechaEntrega && 
    new Date(c.fechaEntrega) <= limitDate
  );

  const otAlertas = ordenesTrabajo.filter(ot => 
    ot.estado !== 'Entregado' && ot.estado !== 'Finalizado' && 
    ot.fechaEntrega && 
    new Date(ot.fechaEntrega) <= limitDate
  );

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Cargando datos operativos...</div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ paddingBottom: '90px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.6rem' }}>
          <Wrench size={28} color="var(--primary-color)" /> Herramientas y Analíticas
        </h1>
      </div>

      {/* Tabs Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem', 
        background: 'var(--surface-color)', 
        padding: '0.35rem', 
        borderRadius: '12px', 
        border: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        <button 
          onClick={() => setActiveTab('reportes')}
          className="btn" 
          style={{ 
            flex: 1, 
            height: '42px', 
            fontSize: '0.9rem',
            padding: '0 1rem',
            background: activeTab === 'reportes' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'reportes' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          <BarChart2 size={16} /> Reportes
        </button>
        <button 
          onClick={() => setActiveTab('exportar')}
          className="btn" 
          style={{ 
            flex: 1, 
            height: '42px', 
            fontSize: '0.9rem',
            padding: '0 1rem',
            background: activeTab === 'exportar' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'exportar' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          <FileSpreadsheet size={16} /> Exportar
        </button>
        <button 
          onClick={() => setActiveTab('alertas')}
          className="btn" 
          style={{ 
            flex: 1, 
            height: '42px', 
            fontSize: '0.9rem',
            padding: '0 1rem',
            background: activeTab === 'alertas' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'alertas' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            position: 'relative'
          }}
        >
          <AlertTriangle size={16} /> Alertas 
          {(cotizacionesAlertas.length + otAlertas.length) > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: '4px', 
              right: '4px', 
              background: 'var(--error-color)', 
              color: '#ffffff', 
              fontSize: '0.7rem', 
              width: '18px', 
              height: '18px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {cotizacionesAlertas.length + otAlertas.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Render - Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', paddingBottom: '20px' }}>
        {activeTab === 'reportes' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {/* Subtabs for Report categories */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            <span 
              onClick={() => setReportSubTab('cotizaciones')}
              style={{ 
                cursor: 'pointer', 
                fontSize: '0.95rem', 
                fontWeight: reportSubTab === 'cotizaciones' ? 'bold' : 'normal',
                color: reportSubTab === 'cotizaciones' ? 'var(--primary-color)' : 'var(--text-muted)',
                borderBottom: reportSubTab === 'cotizaciones' ? '2px solid var(--primary-color)' : '2px solid transparent',
                paddingBottom: '0.25rem'
              }}
            >
              Cotizaciones
            </span>
            <span 
              onClick={() => setReportSubTab('ots')}
              style={{ 
                cursor: 'pointer', 
                fontSize: '0.95rem', 
                fontWeight: reportSubTab === 'ots' ? 'bold' : 'normal',
                color: reportSubTab === 'ots' ? 'var(--primary-color)' : 'var(--text-muted)',
                borderBottom: reportSubTab === 'ots' ? '2px solid var(--primary-color)' : '2px solid transparent',
                paddingBottom: '0.25rem'
              }}
            >
              Órdenes de Trabajo (OT)
            </span>
          </div>

          {reportSubTab === 'cotizaciones' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Conversion and Rejections */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--success-color)" /> Tasa de Conversión y Rechazo
                </h3>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>Distribución actual de cotizaciones por resultado final y motivos principales de pérdida.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', minHeight: '180px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>Efectividad de Cotizaciones</h4>
                    <div style={{ height: '140px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={conversionData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={30} 
                            outerRadius={50}
                          >
                            {conversionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                      {conversionData.map((item, idx) => (
                        <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                          {item.name} ({item.value}%)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>Motivos de Rechazo</h4>
                    {rechazadas === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Sin cotizaciones rechazadas
                      </div>
                    ) : (
                      <div style={{ height: '140px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={rejectionReasonData} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={50}
                            >
                              {rejectionReasonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                      {rejectionReasonData.map((item, idx) => (
                        <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', opacity: rechazadas === 0 ? 0.5 : 1 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                          {item.name} ({item.value}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Clients Bar Chart */}
              <div className="card">
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="var(--primary-color)" /> Ranking de Clientes (Volumen Cotizado)
                </h3>
                <div style={{ height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topClientsData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={10} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} width={70} />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="volumen" fill="var(--primary-color)" radius={[0, 4, 4, 0]}>
                        {topClientsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary-color)' : 'var(--neutral-light)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {totalOTs === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', gap: '1rem', textAlign: 'center' }}>
                  <AlertTriangle size={48} color="var(--warning-color)" style={{ color: 'var(--warning-color)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Sin Órdenes de Trabajo</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                    No hay Órdenes de Trabajo registradas en el sistema. Genera una Orden de Trabajo desde una cotización aprobada para comenzar a visualizar las estadísticas operativas.
                  </p>
                </div>
              ) : (
                <>
                  {/* OT Performance charts */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} color="var(--secondary-color)" /> Rendimiento e Impacto Operativo
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', minHeight: '180px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>Entregas a Tiempo (SLA)</h4>
                        <div style={{ height: '140px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={onTimeDeliveryData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={30} 
                                outerRadius={50}
                              >
                                {onTimeDeliveryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', fontSize: '0.75rem' }}>
                          {onTimeDeliveryData.map((item, idx) => (
                            <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                              {item.name} ({item.value}%)
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>Distribución de Carga (Tipo)</h4>
                        <div style={{ height: '140px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={workloadByTypeData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={50}
                              >
                                {workloadByTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '0.7rem', flexWrap: 'wrap' }}>
                          {workloadByTypeData.map((item, idx) => (
                            <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cycle Time Line chart */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={18} color="var(--tertiary-color)" /> Ciclo Promedio de Producción (Días)
                    </h3>
                    <div style={{ height: '180px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productionCycleTimeData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                          <YAxis stroke="var(--text-muted)" fontSize={10} />
                          <Tooltip formatter={(value) => `${value} días`} />
                          <Line type="monotone" dataKey="dias" stroke="var(--primary-color)" strokeWidth={2} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'exportar' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }} className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={20} color="var(--primary-color)" /> Exportador de Datos Operativos
          </h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Genere y descargue reportes detallados en formato CSV compatibles con Microsoft Excel y hojas de cálculo.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Filter selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tipo de Información</label>
                <select 
                  className="input-control" 
                  value={exportType}
                  onChange={(e) => {
                    setExportType(e.target.value);
                    setExportStatus('Todos'); // reset status filter
                  }}
                >
                  <option value="cotizaciones">Cotizaciones</option>
                  <option value="ots">Órdenes de Trabajo</option>
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filtrar por Estado</label>
                <select 
                  className="input-control" 
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                >
                  <option value="Todos">Todos los estados</option>
                  {exportType === 'cotizaciones' ? (
                    <>
                      <option value="Borrador">Borrador</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Enviada">Enviada</option>
                      <option value="En Negociación">En Negociación</option>
                      <option value="Aprobada">Aprobada</option>
                      <option value="Rechazada">Rechazada</option>
                      <option value="Vencida">Vencida</option>
                      <option value="Anulada">Anulada</option>
                    </>
                  ) : (
                    <>
                      <option value="Programación">Programación</option>
                      <option value="Producción">Producción</option>
                      <option value="Revisión">Revisión</option>
                      <option value="Finalizado">Finalizado</option>
                      <option value="Entregado">Entregado</option>
                    </>
                  )}
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filtrar por Cliente</label>
                <select 
                  className="input-control" 
                  value={exportClient}
                  onChange={(e) => setExportClient(e.target.value)}
                >
                  <option value="Todos">Todos los clientes</option>
                  {uniqueClients.map((client, idx) => (
                    <option key={idx} value={client}>{client}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Preview Area */}
            <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Vista previa de registros a exportar</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  {getFilteredDataForExport().length} registros encontrados
                </span>
              </div>

              {getFilteredDataForExport().length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0', margin: 0 }}>
                  Ningún registro coincide con los filtros seleccionados.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem' }}>ID</th>
                        <th style={{ padding: '0.5rem' }}>Cliente</th>
                        <th style={{ padding: '0.5rem' }}>Tipo</th>
                        <th style={{ padding: '0.5rem' }}>Estado</th>
                        {exportType === 'cotizaciones' ? (
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monto</th>
                        ) : (
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Progreso</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDataForExport().slice(0, 4).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{row.id}</td>
                          <td style={{ padding: '0.5rem' }}>{row.cliente}</td>
                          <td style={{ padding: '0.5rem' }}>{row.tipo}</td>
                          <td style={{ padding: '0.5rem' }}>{row.estado}</td>
                          {exportType === 'cotizaciones' ? (
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>${row.monto.toLocaleString()}</td>
                          ) : (
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>{row.progreso}%</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getFilteredDataForExport().length > 4 && (
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      ... y {getFilteredDataForExport().length - 4} registros más.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export button */}
            <button 
              onClick={handleExportCSV}
              className="btn btn-solid" 
              disabled={getFilteredDataForExport().length === 0}
              style={{ 
                height: '48px', 
                fontSize: '0.95rem',
                opacity: getFilteredDataForExport().length === 0 ? 0.5 : 1,
                cursor: getFilteredDataForExport().length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Download size={18} /> Descargar Reporte CSV (Excel)
            </button>
          </div>
        </div>
      )}

      {activeTab === 'alertas' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Cotizaciones Pendientes Críticas */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={18} color="var(--warning-color)" /> Cotizaciones Pendientes Críticas ({cotizacionesAlertas.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.3' }}>
              Muestra cotizaciones aún sin aprobar que tienen una fecha límite de entrega cercana o vencida, requiriendo seguimiento comercial inmediato.
            </p>
            
            {cotizacionesAlertas.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No hay cotizaciones pendientes con fecha crítica de vencimiento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cotizacionesAlertas.map((cot, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedAlertCotizacion(cot)}
                    style={{ 
                      padding: '0.75rem', 
                      background: 'var(--surface-hover)', 
                      borderRadius: '8px', 
                      borderLeft: '4px solid var(--warning-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{cot.cliente} ({cot.id})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Monto: ${cot.monto.toLocaleString()} • Entrega: {cot.fechaEntrega}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ejecutivo-color)', fontWeight: 500, marginTop: '0.2rem' }}>
                        Ejecutivo: {cot.ejecutivo || 'No Asignado'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)', borderRadius: '4px', fontWeight: 'bold' }}>
                      Acción Requerida
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OTs Retrasadas o Próximas */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--error-color)" /> Órdenes de Trabajo Críticas ({otAlertas.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.3' }}>
              Muestra órdenes activas (en programación, producción o revisión) que tienen su fecha de entrega vencida o muy próxima, permitiendo detectar retrasos en el taller.
            </p>
            
            {otAlertas.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No hay órdenes de trabajo activas con fecha crítica de entrega.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {otAlertas.map((ot, idx) => {
                  const matchingCot = cotizaciones.find(c => c.id === ot.cotizacionId);
                  const ejecutivoName = matchingCot?.ejecutivo || 'No Asignado';
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedAlertOT(ot)}
                      style={{ 
                        padding: '0.75rem', 
                        background: 'var(--surface-hover)', 
                        borderRadius: '8px', 
                        borderLeft: '4px solid var(--error-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{ot.cliente} ({ot.id})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Estado: {ot.estado} • Progreso: {ot.progreso}% • Entrega: {ot.fechaEntrega}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ejecutivo-color)', fontWeight: 500, marginTop: '0.2rem' }}>
                          Ejecutivo: {ejecutivoName}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 110, 0.1)', color: 'var(--error-color)', borderRadius: '4px', fontWeight: 'bold' }}>
                        Urgente
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Cotización */}
      {selectedAlertCotizacion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }} onClick={() => setSelectedAlertCotizacion(null)}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={20} color="var(--warning-color)" />
                Detalles de Cotización
              </h2>
              <button type="button" onClick={() => setSelectedAlertCotizacion(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ID:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertCotizacion.id}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estado:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--warning-color)' }}>{selectedAlertCotizacion.estado}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Cliente:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertCotizacion.cliente}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Monto:</span>
                  <strong style={{ color: 'var(--success-color)', fontSize: '0.95rem' }}>${selectedAlertCotizacion.monto.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ejecutivo:</span>
                  <strong style={{ color: 'var(--ejecutivo-color)', fontSize: '0.95rem' }}>{selectedAlertCotizacion.ejecutivo || 'No Asignado'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha Crítica:</span>
                  <strong style={{ color: 'var(--error-color)', fontSize: '0.95rem' }}>{selectedAlertCotizacion.fechaEntrega || 'N/D'}</strong>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedAlertCotizacion(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para OT */}
      {selectedAlertOT && (() => {
        const matchingCot = cotizaciones.find(c => c.id === selectedAlertOT.cotizacionId);
        const ejecutivoName = matchingCot?.ejecutivo || 'No Asignado';
        
        const today = new Date();
        
        // 1. Días en la etapa actual
        const daysInStage = selectedAlertOT.updatedAt 
          ? Math.max(0, Math.floor((today - new Date(selectedAlertOT.updatedAt)) / (1000 * 60 * 60 * 24)))
          : 0;
          
        // 2. Días restantes
        let daysRemaining = 'N/D';
        if (selectedAlertOT.fechaEntrega && selectedAlertOT.fechaEntrega !== 'Sin fecha') {
          // Adjust for timezones by setting both to midnight
          const targetDate = new Date(selectedAlertOT.fechaEntrega + 'T12:00:00');
          const todayDate = new Date();
          const diff = Math.ceil((targetDate - todayDate) / (1000 * 60 * 60 * 24));
          daysRemaining = diff >= 0 ? diff : `${Math.abs(diff)} (Vencido)`;
        }
        
        // 3. Días desde que entró a producción (Conversión de Cotización a OT)
        const daysSinceStart = selectedAlertOT.createdAt
          ? Math.max(0, Math.floor((today - new Date(selectedAlertOT.createdAt)) / (1000 * 60 * 60 * 24)))
          : 'No iniciada';

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }} onClick={() => setSelectedAlertOT(null)}>
            <div className="card glass-panel" style={{ width: '100%', maxWidth: '600px', margin: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={20} color="var(--error-color)" />
                  Detalles de Orden Crítica
                </h2>
                <button type="button" onClick={() => setSelectedAlertOT(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>OT ID:</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertOT.id}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estado:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--error-color)' }}>{selectedAlertOT.estado}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Cliente:</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertOT.cliente}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Tipo / Servicio:</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertOT.tipo || 'N/D'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Progreso:</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertOT.progreso}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ejecutivo:</span>
                    <strong style={{ color: 'var(--ejecutivo-color)', fontSize: '0.95rem' }}>{ejecutivoName}</strong>
                  </div>
                </div>
                
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={16} /> Métricas de Tiempo
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha Estimada Entrega:</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertOT.fechaEntrega || 'N/D'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Días Restantes:</span>
                      <strong style={{ color: typeof daysRemaining === 'number' && daysRemaining <= 3 ? 'var(--warning-color)' : (typeof daysRemaining === 'string' && daysRemaining.includes('Vencido') ? 'var(--error-color)' : 'var(--text-main)'), fontSize: '0.95rem' }}>
                        {daysRemaining}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Días en Etapa Actual:</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{daysInStage} {daysInStage === 1 ? 'día' : 'días'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Días Producción:</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{daysSinceStart !== 'No iniciada' ? `${daysSinceStart} ${daysSinceStart === 1 ? 'día' : 'días'}` : daysSinceStart}</strong>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedAlertOT(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}
