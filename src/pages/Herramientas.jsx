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
  Download
} from 'lucide-react';
import { 
  mockRejectionReasonData,
  mockProductionCycleTimeData
} from '../data/mockData';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { supabase } from '../utils/supabaseClient';

export default function Herramientas() {
  const [activeTab, setActiveTab] = useState('reportes');
  const [reportSubTab, setReportSubTab] = useState('cotizaciones');
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(true);

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

        const mappedQuotes = quotesData.map(q => ({
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
          items: q.items.map(item => ({
            id: item.id,
            lineaNegocio: item.line_of_business,
            descripcion: item.description,
            cantidad: item.quantity,
            costoUnitario: item.unit_price,
            ...item.technical_details
          }))
        }));

        setCotizaciones(mappedQuotes);

        // Fetch OTs from localStorage
        const savedOts = localStorage.getItem('comunicaciones_seis_ots');
        if (savedOts) {
          setOrdenesTrabajo(JSON.parse(savedOts));
        } else {
          setOrdenesTrabajo([]);
        }
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
  const totalQuotes = cotizaciones.length;
  const aprobadas = cotizaciones.filter(c => c.estado === 'Aprobada').length;
  const rechazadas = cotizaciones.filter(c => c.estado === 'Rechazada' || c.estado === 'Anulada').length;
  const pendientes = totalQuotes - aprobadas - rechazadas;

  const pctAprobadas = totalQuotes > 0 ? Math.round((aprobadas / totalQuotes) * 100) : 0;
  const pctRechazadas = totalQuotes > 0 ? Math.round((rechazadas / totalQuotes) * 100) : 0;
  const pctPendientes = totalQuotes > 0 ? (100 - pctAprobadas - pctRechazadas) : 0;

  const conversionData = [
    { name: 'Aprobadas', value: pctAprobadas, color: 'var(--success-color)' },
    { name: 'Rechazadas', value: pctRechazadas, color: 'var(--error-color)' },
    { name: 'Pendientes', value: pctPendientes, color: 'var(--warning-color)' }
  ];

  const rejectionReasonData = [
    { name: 'Precio Alto', value: rechazadas > 0 ? 45 : 0, color: '#ff4d4f' },
    { name: 'Competencia', value: rechazadas > 0 ? 25 : 0, color: '#faad14' },
    { name: 'Presupuesto Cancelado', value: rechazadas > 0 ? 20 : 0, color: '#722ed1' },
    { name: 'Tiempos de Entrega', value: rechazadas > 0 ? 10 : 0, color: '#595959' }
  ];

  const clientVolumes = {};
  cotizaciones.forEach(c => {
    clientVolumes[c.cliente] = (clientVolumes[c.cliente] || 0) + (c.monto || 0);
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
                          {item.name}
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
                    <LineChart data={mockProductionCycleTimeData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} />
                      <Tooltip formatter={(value) => `${value} días`} />
                      <Line type="monotone" dataKey="dias" stroke="var(--primary-color)" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
                    style={{ 
                      padding: '0.75rem', 
                      background: 'var(--surface-hover)', 
                      borderRadius: '8px', 
                      borderLeft: '4px solid var(--warning-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem'
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
                      style={{ 
                        padding: '0.75rem', 
                        background: 'var(--surface-hover)', 
                        borderRadius: '8px', 
                        borderLeft: '4px solid var(--error-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
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
      </div>
    </div>
  );
}
