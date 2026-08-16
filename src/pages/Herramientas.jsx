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
  X,
  Activity,
  MessageCircle,
  Megaphone,
  Tv,
  Send,
  Trash2
} from 'lucide-react';
import { 
  mockRejectionReasonData
} from '../data/mockData';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { supabase } from '../utils/supabaseClient';
import { formatDate } from '../utils/formatters';

export default function Herramientas({ user }) {
  const [activeTab, setActiveTab] = useState('reportes'); // 'reportes' or 'alertas'
  const [reportSubTab, setReportSubTab] = useState('cotizaciones');
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState({ 
    alert_days_quotes: 7, alert_days_ots: 7,
    tte_enabled: true, tce_enabled: true, dre_enabled: true, alert_quotes_enabled: true, alert_ots_enabled: true 
  });

  // Alert modals state
  const [selectedAlertCotizacion, setSelectedAlertCotizacion] = useState(null);
  const [selectedAlertOT, setSelectedAlertOT] = useState(null);

  // Export State
  const [exportType, setExportType] = useState('cotizaciones');
  const [exportStatus, setExportStatus] = useState('Todos');
  const [exportClient, setExportClient] = useState('Todos');

  // ── Monitor Ticker State ──
  const [tickerMessages, setTickerMessages] = useState([]);
  const [tickerModalOpen, setTickerModalOpen] = useState(false);
  const [tickerText, setTickerText] = useState('');
  const [tickerPriority, setTickerPriority] = useState('normal');
  const [tickerExpiry, setTickerExpiry] = useState('never');
  const [tickerSending, setTickerSending] = useState(false);
  const [tickerSuccess, setTickerSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null); // mensaje que se edita/reenvía

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
            fechaEmision: q.created_at.split('T')[0],
            fechaEntrega: q.estimated_delivery_date,
            fechaAprobacion: q.approved_at || q.updated_at || q.created_at,
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
            quote:quotes (title),
            logs:work_order_status_logs (new_status, changed_at)
          `);

        if (otsError) throw otsError;

        const mappedOts = otsData.map(ot => {
          let statusChangedAt = ot.updated_at;
          if (ot.logs && ot.logs.length > 0) {
            const sortedLogs = [...ot.logs].sort((a,b) => new Date(b.changed_at) - new Date(a.changed_at));
            statusChangedAt = sortedLogs[0].changed_at;
          }
          
          return {
            id: ot.id,
            cotizacionId: ot.quote_id,
            cliente: ot.client?.name || 'Sin Cliente',
            tipo: ot.quote?.title || 'Varios',
            estado: ot.status,
            progreso: ot.progress,
            fechaEntrega: ot.estimated_closure ? ot.estimated_closure.split('T')[0] : 'Sin fecha',
            fechaFinTrabajo: ot.production_deadline ? ot.production_deadline.split('T')[0] : null,
            realStart: ot.real_start,
            realClosure: ot.real_closure,
            createdAt: ot.created_at,
            updatedAt: ot.updated_at,
            statusChangedAt,
            logs: ot.logs || []
          };
        });

        setOrdenesTrabajo(mappedOts);

        // Fetch Settings from Supabase
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'global_kpis_and_alerts')
          .single();
          
        if (!settingsError && settingsData && settingsData.setting_value) {
          setGlobalSettings(prev => ({ ...prev, ...settingsData.setting_value }));
        }
      } catch (err) {
        console.error('Error fetching dashboard tools data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Cargar mensajes del ticker ──
  const fetchTickerMessages = async () => {
    const { data, error } = await supabase
      .from('monitor_ticker')
      .select('id, message, sender_name, priority, is_active, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) setTickerMessages(data);
  };

  useEffect(() => {
    fetchTickerMessages();
  }, []);

  // ── Enviar mensaje al ticker ──
  const handleSendTicker = async () => {
    if (!tickerText.trim()) return;
    setTickerSending(true);
    try {
      let expires_at = null;
      const now = new Date();
      if (tickerExpiry === '1h')  { expires_at = new Date(now.getTime() + 1*60*60*1000).toISOString(); }
      if (tickerExpiry === '4h')  { expires_at = new Date(now.getTime() + 4*60*60*1000).toISOString(); }
      if (tickerExpiry === '8h')  { expires_at = new Date(now.getTime() + 8*60*60*1000).toISOString(); }
      if (tickerExpiry === '24h') { expires_at = new Date(now.getTime() + 24*60*60*1000).toISOString(); }

      const { error } = await supabase.from('monitor_ticker').insert({
        message:     tickerText.trim(),
        sender_name: user?.name || user?.username || 'Usuario',
        priority:    tickerPriority,
        is_active:   true,
        expires_at,
      });

      if (error) throw error;

      setTickerText('');
      setTickerPriority('normal');
      setTickerExpiry('never');
      setTickerModalOpen(false);
      setEditingMessage(null);
      setTickerSuccess(true);
      setTimeout(() => setTickerSuccess(false), 3000);
      fetchTickerMessages();
    } catch (err) {
      console.error('Error al enviar mensaje al ticker:', err);
      alert('Error al enviar el mensaje: ' + err.message);
    } finally {
      setTickerSending(false);
    }
  };

  // ── Desactivar / eliminar mensaje del ticker ──
  const handleDeactivateTicker = async (id) => {
    await supabase.from('monitor_ticker').update({ is_active: false }).eq('id', id);
    setDeleteConfirmId(null);
    fetchTickerMessages();
  };

  // ── Abrir modal pre-cargado con el mensaje a editar ──
  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setTickerText(msg.message);
    setTickerPriority(msg.priority || 'normal');
    setTickerExpiry('never'); // el usuario elige nueva expiración
    setTickerModalOpen(true);
  };

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

  const getAverageTimePerStage = (ots) => {
    let programacionSum = 0, programacionCount = 0;
    let produccionSum = 0, produccionCount = 0;
    let revisionSum = 0, revisionCount = 0;

    ots.forEach(ot => {
      if (!ot.logs || ot.logs.length === 0) return;
      
      const sortedLogs = [...ot.logs].sort((a,b) => new Date(a.changed_at) - new Date(b.changed_at));
      // calculate duration for each stage by finding when they entered the stage and when they entered the next
      for (let i = 0; i < sortedLogs.length; i++) {
        const log = sortedLogs[i];
        const nextLog = sortedLogs[i + 1];
        if (nextLog) {
          const start = new Date(log.changed_at);
          const end = new Date(nextLog.changed_at);
          const diffDays = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
          
          if (log.new_status === 'Programación') { programacionSum += diffDays; programacionCount++; }
          else if (log.new_status === 'Producción') { produccionSum += diffDays; produccionCount++; }
          else if (log.new_status === 'Revisión') { revisionSum += diffDays; revisionCount++; }
        }
      }
    });

    return [
      { name: 'Programación', dias: programacionCount > 0 ? Math.round((programacionSum / programacionCount) * 10) / 10 : 0, color: '#64748b' },
      { name: 'Producción', dias: produccionCount > 0 ? Math.round((produccionSum / produccionCount) * 10) / 10 : 0, color: 'var(--primary-color)' },
      { name: 'Revisión', dias: revisionCount > 0 ? Math.round((revisionSum / revisionCount) * 10) / 10 : 0, color: 'var(--warning-color)' }
    ];
  };

  const bottleneckData = getAverageTimePerStage(ordenesTrabajo);

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
  const workloadByTypeData = Object.keys(typeCounts).map((name, index) => {
    const count = typeCounts[name];
    const percentage = totalOTs > 0 ? Math.round((count / totalOTs) * 100) : 0;
    return {
      name,
      value: percentage, // Ahora el valor es sobre el 100%
      color: colorsList[index % colorsList.length]
    };
  });

  // Process Alerts dynamically (upcoming within X days or overdue)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const quotesLimitDate = new Date(today);
  quotesLimitDate.setDate(quotesLimitDate.getDate() + (globalSettings.alert_days_quotes || 7));

  const otsLimitDate = new Date(today);
  otsLimitDate.setDate(otsLimitDate.getDate() + (globalSettings.alert_days_ots || 7));

  const cotizacionesAlertas = globalSettings.alert_quotes_enabled === false ? [] : cotizaciones.filter(c => {
    const isActiveCommercial = (c.estado === 'Pendiente' || c.estado === 'Enviada' || c.estado === 'En Negociación');
    const isCriticalDate = c.fechaEntrega && new Date(c.fechaEntrega) <= quotesLimitDate;
    
    if (isActiveCommercial && isCriticalDate) {
      return true;
    }
    return false;
  });

  const maxWaitDays = globalSettings.alert_days_approved_quotes !== undefined ? parseInt(globalSettings.alert_days_approved_quotes) : 1;
  const cotizacionesAlertasAprobadas = globalSettings.alert_approved_quotes_enabled === false ? [] : cotizaciones.filter(c => {
    const hasOT = ordenesTrabajo.some(ot => ot.cotizacionId === c.id);
    
    const isApproved = c.estado === 'Aprobada';
    let isDelayedAfterApproval = false;
    if (isApproved && c.fechaAprobacion) {
      const approvalDate = new Date(c.fechaAprobacion);
      approvalDate.setHours(0,0,0,0);
      const diffMs = today - approvalDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= maxWaitDays) {
        isDelayedAfterApproval = true;
      }
    }
    
    if (isApproved && isDelayedAfterApproval && !hasOT) {
      return true;
    }
    return false;
  });

  const otAlertas = globalSettings.alert_ots_enabled === false ? [] : ordenesTrabajo.filter(ot => {
    if (ot.estado === 'Entregado' || ot.estado === 'Finalizado') return false;
    if (!ot.fechaFinTrabajo) return true;
    return new Date(ot.fechaFinTrabajo) <= otsLimitDate;
  });

  const otPreventivas = globalSettings.alert_ots_enabled === false ? [] : ordenesTrabajo.filter(ot => {
    if (ot.estado === 'Producción' && ot.fechaFinTrabajo) {
        const created = new Date(ot.createdAt).getTime();
        const deadline = new Date(ot.fechaFinTrabajo).getTime();
        const deadlineEndOfDay = deadline + (24 * 60 * 60 * 1000) - 1;
        const now = new Date().getTime();
        
        const totalDuration = deadlineEndOfDay - created;
        const elapsed = now - created;
        const percentConsumed = (elapsed / totalDuration) * 100;
        
        const threshold = globalSettings.ot_alert_progress_warning || 80;
        
        if (now <= deadlineEndOfDay && globalSettings.ot_alert_progress_warning_enabled !== false && percentConsumed >= threshold) {
            return true;
        }
    }
    return false;
  });

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
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem', 
        marginBottom: '1.5rem', 
        background: 'var(--surface-color)', 
        padding: '0.5rem', 
        borderRadius: '12px', 
        border: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        <button 
          onClick={() => setActiveTab('reportes')}
          className="btn" 
          style={{ 
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
          {(cotizacionesAlertas.length + cotizacionesAlertasAprobadas.length + otAlertas.length + otPreventivas.length) > 0 && (
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
              {cotizacionesAlertas.length + cotizacionesAlertasAprobadas.length + otAlertas.length + otPreventivas.length}
            </span>
          )}
        </button>
        <button 
          disabled={true}
          className="btn" 
          title="Próximamente"
          style={{ 
            height: '42px', 
            fontSize: '0.9rem',
            padding: '0 1rem',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            opacity: 0.5,
            cursor: 'not-allowed'
          }}
        >
          <Tv size={16} /> Monitor
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
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0, lineHeight: '1.3' }}>
                  Muestra los clientes con mayor facturación basada exclusivamente en cotizaciones aprobadas y ejecutadas.
                </p>
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
                    
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.5rem', lineHeight: '1.3' }}>
                      Evalúa el cumplimiento de las fechas de entrega prometidas (SLA) y la distribución actual de la carga de trabajo por tipo de servicio.
                    </p>
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
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0, lineHeight: '1.3' }}>
                      Visualiza la tendencia histórica del tiempo total promedio que toma completar una Orden desde su inicio hasta la entrega final, agrupado por semanas.
                    </p>
                  </div>
                  
                  {/* Bottleneck Bar chart */}
                  <div className="card">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart2 size={18} color="var(--primary-color)" /> Análisis de Cuellos de Botella (Días por Etapa)
                    </h3>
                    <div style={{ height: '180px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bottleneckData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                          <XAxis type="number" stroke="var(--text-muted)" fontSize={10} />
                          <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} width={80} />
                          <Tooltip formatter={(value) => `${value} días`} />
                          <Bar dataKey="dias" fill="var(--primary-color)" radius={[0, 4, 4, 0]}>
                            {bottleneckData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0, lineHeight: '1.3' }}>
                      Identifica de forma histórica en qué etapa específica del proceso productivo se están demorando más las órdenes en promedio.<br/>
                      <span style={{ fontSize: '0.75rem', opacity: 0.85, fontStyle: 'italic' }}>*Nota: Los tiempos menores a un día (cambios de prueba rápidos) se redondean a 0 días.</span>
                    </p>
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
              Se mostrarán en Alertas cuando falten los días establecidos en la configuración o menos para la Fecha Estimada de Entrega y tienen estado "Pendiente", "Enviada" o "En Negociación". También incluye cotizaciones "Aprobadas" hace más de un día que aún no tienen Orden de Trabajo.
            </p>
            
            {globalSettings.alert_quotes_enabled === false ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <Activity size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Monitoreo desactivado</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Las alertas para Cotizaciones están apagadas en Ajustes.</p>
              </div>
            ) : cotizacionesAlertas.length === 0 ? (
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
                        Monto: ${cot.monto.toLocaleString()} • Entrega: {formatDate(cot.fechaEntrega)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ejecutivo-color)', fontWeight: 500, marginTop: '0.2rem' }}>
                        Ejecutivo: {cot.ejecutivo || 'No Asignado'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--error-color)', fontWeight: 'bold', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} />
                        Fecha de entrega crítica
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

          {/* Cotizaciones Aprobadas sin OT */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: document.body.classList.contains('light-mode') ? 'var(--primary-color)' : 'var(--warning-color)' }}>
              <ClipboardList size={18} color={document.body.classList.contains('light-mode') ? 'var(--primary-color)' : 'var(--warning-color)'} /> Cotizaciones Aprobadas en Espera ({cotizacionesAlertasAprobadas.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.3' }}>
              Cotizaciones que ya fueron "Aprobadas" pero han superado el tiempo máximo de espera sin que se les asigne una Orden de Trabajo (OT).
            </p>
            
            {globalSettings.alert_approved_quotes_enabled === false ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <Activity size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Monitoreo desactivado</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>La alerta para cotizaciones en espera está apagada en Ajustes.</p>
              </div>
            ) : cotizacionesAlertasAprobadas.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No hay cotizaciones aprobadas esperando por Orden de Trabajo.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cotizacionesAlertasAprobadas.map((cot, idx) => {
                  let daysWaiting = 0;
                  if (cot.fechaAprobacion) {
                    const diff = new Date() - new Date(cot.fechaAprobacion);
                    daysWaiting = Math.floor(diff / (1000 * 60 * 60 * 24));
                  }
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedAlertCotizacion(cot)}
                      style={{ 
                        padding: '0.75rem', 
                        background: 'var(--surface-hover)', 
                        borderRadius: '8px', 
                        borderLeft: `4px solid ${document.body.classList.contains('light-mode') ? 'var(--primary-color)' : 'var(--warning-color)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        animation: 'pulse-primary 3s infinite'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{cot.cliente} ({cot.id})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Aprobada hace: {daysWaiting} día(s) • Entrega: {formatDate(cot.fechaEntrega)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ejecutivo-color)', fontWeight: 500, marginTop: '0.2rem' }}>
                          Ejecutivo: {cot.ejecutivo || 'No Asignado'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: document.body.classList.contains('light-mode') ? 'var(--primary-color)' : 'var(--warning-color)', fontWeight: 'bold', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} />
                          Atención: Necesita ser pasada a Programación
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: document.body.classList.contains('light-mode') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: document.body.classList.contains('light-mode') ? 'var(--primary-color)' : 'var(--warning-color)', borderRadius: '4px', fontWeight: 'bold' }}>
                        Pendiente de OT
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* OTs Retrasadas o Próximas */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--error-color)" /> Órdenes de Trabajo Críticas ({otAlertas.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.3' }}>
              Muestra órdenes activas (en programación, producción o revisión) que tienen su fecha de fin de trabajo vencida o muy próxima, o que aún no tienen una fecha asignada, permitiendo detectar retrasos en el taller.
            </p>
            
            {globalSettings.alert_ots_enabled === false ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <Activity size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Monitoreo desactivado</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Las alertas para Órdenes de Trabajo están apagadas en Ajustes.</p>
              </div>
            ) : otAlertas.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No hay órdenes de trabajo operativas con fecha crítica de vencimiento.</p>
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
                          Estado: {ot.estado} • Progreso: {ot.progreso}% • Fin de Trabajo: {ot.fechaFinTrabajo ? formatDate(ot.fechaFinTrabajo) : 'No asignada'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ejecutivo-color)', fontWeight: 500, marginTop: '0.2rem' }}>
                          Ejecutivo: {ejecutivoName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--error-color)', fontWeight: 'bold', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} />
                          {(() => {
                            if (!ot.fechaFinTrabajo) return '⚠️ Falta asignar fecha de fin';
                            const todayDate = new Date();
                            todayDate.setHours(0,0,0,0);
                            const targetDate = new Date(ot.fechaFinTrabajo + 'T12:00:00');
                            targetDate.setHours(0,0,0,0);
                            const diff = Math.ceil((targetDate - todayDate) / (1000 * 60 * 60 * 24));
                            return diff < 0 ? `Vencida hace ${Math.abs(diff)} días` : (diff === 0 ? 'Vence hoy' : `Vence en ${diff} días`);
                          })()}
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

          {/* OTs en Alerta Preventiva */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning-color)' }}>
              <AlertTriangle size={18} color="var(--warning-color)" /> Órdenes en Riesgo Preventivo ({otPreventivas.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.3' }}>
              Muestra órdenes activas en producción cuyo tiempo consumido supera el umbral de seguridad establecido en Ajustes.
            </p>
            
            {globalSettings.alert_ots_enabled === false ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <Activity size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Monitoreo desactivado</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Las alertas para Órdenes de Trabajo están apagadas en Ajustes.</p>
              </div>
            ) : otPreventivas.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No hay órdenes en estado preventivo.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {otPreventivas.map((ot, idx) => {
                  const matchingCot = cotizaciones.find(c => c.id === ot.cotizacionId);
                  const ejecutivoName = matchingCot?.ejecutivo || 'No Asignado';
                  
                  const created = new Date(ot.createdAt).getTime();
                  const deadline = new Date(ot.fechaFinTrabajo).getTime();
                  const deadlineEndOfDay = deadline + (24 * 60 * 60 * 1000) - 1;
                  const now = new Date().getTime();
                  const totalDuration = Math.max(1, deadlineEndOfDay - created);
                  const elapsed = Math.max(0, now - created);
                  const percentConsumed = Math.round((elapsed / totalDuration) * 100);

                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedAlertOT(ot)}
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
                        transition: 'background 0.2s',
                        animation: 'pulse-yellow 3s infinite'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{ot.cliente} ({ot.id})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Estado: {ot.estado} • Consumido: {percentConsumed}% • Target: {formatDate(ot.fechaFinTrabajo)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ejecutivo-color)', fontWeight: 500, marginTop: '0.2rem' }}>
                          Ejecutivo: {ejecutivoName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--warning-color)', fontWeight: 'bold', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} />
                          En riesgo de retraso
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(234, 179, 8, 0.1)', color: 'var(--warning-color)', borderRadius: '4px', fontWeight: 'bold' }}>
                        Preventiva
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
      {selectedAlertCotizacion && (() => {
        let daysRemainingCot = 'N/D';
        if (selectedAlertCotizacion.fechaEntrega) {
          const targetDateCot = new Date(selectedAlertCotizacion.fechaEntrega + 'T12:00:00');
          const todayDateCot = new Date();
          const diffCot = Math.ceil((targetDateCot - todayDateCot) / (1000 * 60 * 60 * 24));
          daysRemainingCot = diffCot >= 0 ? diffCot : `${Math.abs(diffCot)} (Vencido)`;
        }

        let elapsedSinceEmission = 'N/D';
        if (selectedAlertCotizacion.fechaEmision) {
          const emitDateCot = new Date(selectedAlertCotizacion.fechaEmision + 'T12:00:00');
          const todayDateCot = new Date();
          const diffElapsed = Math.floor((todayDateCot - emitDateCot) / (1000 * 60 * 60 * 24));
          elapsedSinceEmission = diffElapsed >= 0 ? diffElapsed : 0;
        }

        return (
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
            
            <div style={{ marginBottom: '1.2rem', padding: '0.6rem 1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', borderLeft: '3px solid var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} color="var(--warning-color)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <strong>Motivo de alerta:</strong> {selectedAlertCotizacion.estado === 'Aprobada' ? 'Aprobada sin OT asignada' : 'Fecha de entrega crítica'}
              </span>
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
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha Crítica:</span>
                  <strong style={{ color: 'var(--error-color)', fontSize: '0.95rem' }}>{formatDate(selectedAlertCotizacion.fechaEntrega)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Días Restantes:</span>
                  <strong style={{ color: 'var(--warning-color)', fontSize: '0.95rem' }}>{daysRemainingCot}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha Emisión:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{formatDate(selectedAlertCotizacion.fechaEmision)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Días Transcurridos:</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{elapsedSinceEmission}</strong>
                </div>

              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
              <button 
                className="btn btn-solid" 
                style={{ backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => {
                  const msg = `🚨 *ALERTA DE COTIZACIÓN*\n*ID:* ${selectedAlertCotizacion.id}\n*Cliente:* ${selectedAlertCotizacion.cliente}\n*Estado:* ${selectedAlertCotizacion.estado}\n*Monto:* $${selectedAlertCotizacion.monto.toLocaleString()}\n*Ejecutivo:* ${selectedAlertCotizacion.ejecutivo || 'No Asignado'}\n*Vencimiento:* ${formatDate(selectedAlertCotizacion.fechaEntrega)}\n\nPor favor revisar el estado de esta cotización.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
              >
                <MessageCircle size={18} /> Enviar por WhatsApp
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedAlertCotizacion(null)}>Cerrar</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal para OT */}
      {selectedAlertOT && (() => {
        const matchingCot = cotizaciones.find(c => c.id === selectedAlertOT.cotizacionId);
        const ejecutivoName = matchingCot?.ejecutivo || 'No Asignado';
        
        const today = new Date();
        
        // 1. Días en la etapa actual (Usando el historial preciso)
        const daysInStage = selectedAlertOT.statusChangedAt 
          ? Math.max(0, Math.floor((today - new Date(selectedAlertOT.statusChangedAt)) / (1000 * 60 * 60 * 24)))
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
              
              <div style={{ marginBottom: '1.2rem', padding: '0.6rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', borderLeft: '3px solid var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} color="var(--error-color)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <strong>Motivo de alerta:</strong> {(() => {
                    if (!selectedAlertOT.fechaFinTrabajo) return '⚠️ Falta asignar fecha de fin';
                    const todayDate = new Date();
                    todayDate.setHours(0,0,0,0);
                    const targetDate = new Date(selectedAlertOT.fechaFinTrabajo + 'T12:00:00');
                    targetDate.setHours(0,0,0,0);
                    const diff = Math.ceil((targetDate - todayDate) / (1000 * 60 * 60 * 24));
                    return diff < 0 ? `Vencida hace ${Math.abs(diff)} días` : (diff === 0 ? 'Vence hoy' : `Vence en ${diff} días`);
                  })()}
                </span>
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
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha de Fin de Trabajo:</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedAlertOT.fechaFinTrabajo || 'No asignada'}</strong>
                    </div>

                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
                <button 
                  className="btn btn-solid" 
                  style={{ backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => {
                    const msg = `⚠️ *ALERTA DE ORDEN DE TRABAJO*\n*OT ID:* ${selectedAlertOT.id}\n*Cliente:* ${selectedAlertOT.cliente}\n*Estado:* ${selectedAlertOT.estado}\n*Progreso:* ${selectedAlertOT.progreso}%\n*Fin de Trabajo:* ${selectedAlertOT.fechaFinTrabajo || 'No asignada'}\n\nSe requiere atención para evitar retrasos en la entrega.`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                >
                  <MessageCircle size={18} /> Enviar por WhatsApp
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedAlertOT(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════
          TAB: MONITOR — Control del Ticker del TV
      ════════════════════════════════════════════════════ */}
      {activeTab === 'monitor' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Notificación de éxito */}
          {tickerSuccess && (
            <div style={{
              background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success-color)',
              borderRadius: '10px', padding: '0.9rem 1.2rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--success-color)', fontWeight: 600
            }}>
              ✅ Mensaje enviado al Monitor TV correctamente.
            </div>
          )}

          {/* Header card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tv size={22} color="#4f46e5" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Ticker del Monitor TV</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Envía mensajes que aparecerán en la banda inferior del Monitor de Producción en tiempo real.
                </p>
              </div>
            </div>
            <button
              className="btn btn-solid"
              style={{ height: 48, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
              onClick={() => setTickerModalOpen(true)}
            >
              <Megaphone size={18} /> Nuevo Mensaje
            </button>
          </div>

          {/* Lista de mensajes activos/recientes */}
          <div className="card">
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="var(--primary-color)" /> Mensajes Recientes
            </h4>

            {tickerMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No hay mensajes en el ticker. Crea uno con el botón "Nuevo Mensaje".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tickerMessages.map(msg => {
                  const isExpired = msg.expires_at && new Date(msg.expires_at) < new Date();
                  const statusLabel = !msg.is_active ? 'Desactivado' : isExpired ? 'Expirado' : 'Activo';
                  const statusColor = !msg.is_active || isExpired ? 'var(--text-muted)' : 'var(--success-color)';

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleEditMessage(msg)}
                      title="Clic para editar y reenviar"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'var(--surface-color)',
                        borderRadius: '8px',
                        border: `1px solid ${msg.priority === 'urgente' ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}`,
                        opacity: (!msg.is_active || isExpired) ? 0.55 : 1,
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = msg.priority === 'urgente' ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}
                    >
                      {/* Icono prioridad */}
                      <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' }}>
                        {msg.priority === 'urgente' ? '🚨' : '📢'}
                      </span>

                      {/* Contenido */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                          {msg.message}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                          {msg.sender_name && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              👤 {msg.sender_name}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            🕐 {new Date(msg.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          {msg.expires_at && (
                            <span style={{ fontSize: '0.75rem', color: isExpired ? 'var(--error-color)' : 'var(--warning-color)' }}>
                              ⏱ Expira: {new Date(msg.expires_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: statusColor }}>
                            ● {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Botón editar + desactivar — detener propagación para no disparar el onClick del card */}
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        {msg.is_active && !isExpired && (
                          deleteConfirmId === msg.id ? (
                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                              <button
                                className="btn"
                                style={{ height: 32, fontSize: '0.78rem', background: 'var(--error-color)', color: '#fff', border: 'none', padding: '0 0.75rem' }}
                                onClick={() => handleDeactivateTicker(msg.id)}
                              >
                                Confirmar
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ height: 32, fontSize: '0.78rem', padding: '0 0.75rem' }}
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              title="Desactivar mensaje"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', flexShrink: 0 }}
                              onClick={() => setDeleteConfirmId(msg.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL: Redactar nuevo mensaje para el ticker
      ════════════════════════════════════════════════════ */}
      {tickerModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface-color)', borderRadius: '16px',
            border: '1px solid var(--border-color)', padding: '1.75rem',
            width: '100%', maxWidth: '480px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <Megaphone size={20} color="#4f46e5" />
                {editingMessage ? 'Editar y Reenviar Mensaje' : 'Nuevo Mensaje al Monitor'}
              </h3>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => { setTickerModalOpen(false); setEditingMessage(null); }}>
                <X size={20} />
              </button>
            </div>

            {/* Mensaje */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Mensaje *
              </label>
              <textarea
                value={tickerText}
                onChange={e => setTickerText(e.target.value)}
                maxLength={280}
                placeholder="Escribe el mensaje que aparecerá en la banda del monitor TV..."
                rows={3}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-color)',
                  color: 'var(--text-main)', fontSize: '0.95rem', resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tickerText.length}/280 caracteres
              </span>
            </div>

            {/* Prioridad */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Prioridad
              </label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {[
                  { value: 'normal',  label: '📢 Normal',  desc: 'Texto estándar' },
                  { value: 'urgente', label: '🚨 Urgente', desc: 'Barra roja + texto destacado' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setTickerPriority(opt.value)}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: '8px', cursor: 'pointer',
                      border: `2px solid ${tickerPriority === opt.value ? (opt.value === 'urgente' ? 'var(--error-color)' : 'var(--primary-color)') : 'var(--border-color)'}`,
                      background: tickerPriority === opt.value ? (opt.value === 'urgente' ? 'rgba(239,68,68,0.1)' : 'rgba(79,70,229,0.1)') : 'transparent',
                      color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600
                    }}>
                    {opt.label}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '0.15rem' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tiempo de expiración */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Tiempo de Expiración
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {[
                  { value: 'never', label: 'Sin límite' },
                  { value: '1h',    label: '1 hora' },
                  { value: '4h',    label: '4 horas' },
                  { value: '8h',    label: '8 horas' },
                  { value: '24h',   label: '24 horas' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setTickerExpiry(opt.value)}
                    style={{
                      padding: '0.5rem 0.25rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${tickerExpiry === opt.value ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      background: tickerExpiry === opt.value ? 'rgba(79,70,229,0.15)' : 'transparent',
                      color: tickerExpiry === opt.value ? 'var(--primary-color)' : 'var(--text-muted)',
                      fontSize: '0.78rem', fontWeight: tickerExpiry === opt.value ? 700 : 400
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ height: 48 }} onClick={() => { setTickerModalOpen(false); setEditingMessage(null); }}>
                Cancelar
              </button>
              <button
                className="btn btn-solid"
                style={{ height: 48, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: !tickerText.trim() || tickerSending ? 0.6 : 1 }}
                disabled={!tickerText.trim() || tickerSending}
                onClick={handleSendTicker}
              >
                <Send size={16} /> {tickerSending ? 'Enviando...' : editingMessage ? 'Reenviar Mensaje' : 'Enviar al Monitor'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
