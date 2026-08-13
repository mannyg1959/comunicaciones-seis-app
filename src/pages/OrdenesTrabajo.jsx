import { useState, useEffect } from 'react';
import { Package, Search, SlidersHorizontal, X, CheckCircle, AlertTriangle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { logEvent } from '../utils/logs';
import { usePermissions } from '../contexts/PermissionsContext';
import { supabase } from '../utils/supabaseClient';
import { formatDate, formatDateTime } from '../utils/formatters';

export default function OrdenesTrabajo({ user }) {
  const { hasPermission } = usePermissions();
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

  // State for cotizaciones
  const [cotizaciones, setCotizaciones] = useState([]);

  // State for summary view
  const [selectedOTForSummary, setSelectedOTForSummary] = useState(null);

  // State for OTs
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);

  // State for active incidents per OT
  const [otIncidents, setOtIncidents] = useState({});

  // Initial mockup history logs
  const [otLogs, setOtLogs] = useState({});

  const [kpis, setKpis] = useState({
    ot_alert_hours_unassigned: 2, ot_alert_progress_warning: 80, ot_alert_hours_logistics: 24,
    ot_alert_hours_unassigned_enabled: true, ot_alert_progress_warning_enabled: true, ot_alert_hours_logistics_enabled: true
  });

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*, client:clients(name), seller:profiles(name)');
      if (quotesError) throw quotesError;

      const mappedQuotes = quotesData.map(q => ({
        id: q.id,
        cliente: q.client?.name || 'Sin Cliente',
        monto: q.total,
        estado: q.status,
        fechaEmision: q.created_at.split('T')[0],
        ejecutivo: q.seller?.name || 'Desconocido'
      }));
      setCotizaciones(mappedQuotes);

      const { data: kpiData, error: kpiError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'global_kpis_and_alerts')
        .single();
        
      if (!kpiError && kpiData && kpiData.setting_value) {
        setKpis(prev => ({ ...prev, ...kpiData.setting_value }));
      }

      const { data: otsData, error: otsError } = await supabase
        .from('work_orders')
        .select('*, client:clients(name), quote:quotes(title)');
      if (otsError) throw otsError;

      const mappedOts = otsData.map(ot => ({
        id: ot.id,
        cotizacionId: ot.quote_id,
        cliente: ot.client?.name || 'Sin Cliente',
        tipo: ot.quote?.title || 'Varios',
        estado: ot.status,
        progreso: ot.progress,
        fechaEntrega: ot.estimated_closure ? ot.estimated_closure.split('T')[0] : 'Sin fecha',
        createdAt: ot.created_at,
        tiempoEstimado: ot.estimated_time_minutes || null,
        tiempoTranscurrido: ot.time_elapsed_minutes || 0,
        operarioAsignado: ot.assigned_operative || null,
        isPaused: !!ot.pause_reason,
        pauseMotivo: ot.pause_reason || '',
        finishedAt: ot.finished_at || null,
        rechazoMotivo: ot.rejected_reason || null,
        fechaFinTrabajo: ot.production_deadline ? ot.production_deadline.split('T')[0] : null,
      }));
      setOrdenesTrabajo(mappedOts);

      const { data: incidentsData, error: incidentsError } = await supabase
        .from('work_order_incidents')
        .select('*');
      if (incidentsError) throw incidentsError;

      const mappedIncidents = {};
      incidentsData.forEach(inc => {
        let text = inc.description || '';
        let severity = 'Media';
        try {
          if (inc.description && inc.description.startsWith('{')) {
            const parsed = JSON.parse(inc.description);
            text = parsed.text || '';
            severity = parsed.severity || 'Media';
          }
        } catch (e) {}

        const mappedInc = {
          id: inc.id,
          type: 'incident',
          text,
          severity,
          resolved: inc.resolved,
          resolvedAt: inc.resolved_at,
          createdAt: inc.created_at,
          estado: inc.status || 'Programación'
        };

        if (!mappedIncidents[inc.work_order_id]) {
          mappedIncidents[inc.work_order_id] = [];
        }
        mappedIncidents[inc.work_order_id].push(mappedInc);
      });
      setOtIncidents(mappedIncidents);

      const { data: logsData, error: logsError } = await supabase
        .from('work_order_logs')
        .select('*')
        .order('created_at', { ascending: true });
      if (logsError) throw logsError;

      const mappedLogs = {};
      logsData.forEach(log => {
        let text = log.message || '';
        let icon = 'SlidersHorizontal';
        let estado = '';
        try {
          if (log.message && log.message.startsWith('{')) {
            const parsed = JSON.parse(log.message);
            text = parsed.text || '';
            icon = parsed.icon || 'SlidersHorizontal';
            estado = parsed.estado || '';
          }
        } catch (e) {}

        const mappedLog = {
          id: log.id,
          type: log.type,
          text,
          date: log.created_at ? log.created_at.replace('T', ' ').substring(0, 16) : '',
          icon,
          estado
        };

        if (!mappedLogs[log.work_order_id]) {
          mappedLogs[log.work_order_id] = [];
        }
        mappedLogs[log.work_order_id].push(mappedLog);
      });
      setOtLogs(mappedLogs);

    } catch (err) {
      console.error('Error fetching work orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Programación': return '#64748b';
      case 'Producción': return '#3b82f6';
      case 'Revisión': return '#f59e0b';
      case 'Finalizado': return '#10b981';
      case 'Entregado': return '#a855f7';
      default: return '#64748b';
    }
  };

  const calculateGap = (fechaBase) => {
    if (!fechaBase) return { text: 'Sin asignar', color: 'var(--error-color)' };
    const today = new Date();
    today.setHours(0,0,0,0);
    const [year, month, day] = fechaBase.split('-');
    const deliveryDate = new Date(year, month - 1, day);
    
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Vencido (${Math.abs(diffDays)}d)`, color: 'var(--error-color)' };
    if (diffDays === 0) return { text: '¡Hoy!', color: 'var(--error-color)' };
    if (diffDays <= 2) return { text: `${diffDays} días`, color: 'var(--warning-color)' };
    return { text: `${diffDays} días`, color: 'var(--success-color)' };
  };

  const getStageForLog = (logId, logsList) => {
    const list = logsList || [];
    const logIdx = list.findIndex(l => l.id === logId);
    if (logIdx === -1) return 'Programación';
    for (let j = logIdx; j >= 0; j--) {
      if (list[j].type === 'status') {
        const text = list[j].text;
        if (text === 'Orden Creada') return 'Programación';
        const match = text.match(/Estatus cambiado a (.*)/);
        if (match) return match[1];
      }
    }
    return 'Programación';
  };

  const isAnyFilterActive = filterCliente || filterFechaInicio || filterFechaFin || filterEstadoSelect || filterIncidencia;

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

  // State for Pause/Block
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');
  
  // State for Quality Rejection (Revisión -> Producción)
  const [rechazoMotivoInput, setRechazoMotivoInput] = useState('');

  // State for Assignment
  const [asignacionFechaFin, setAsignacionFechaFin] = useState('');
  const [asignacionOperario, setAsignacionOperario] = useState('');
  const [asignacionError, setAsignacionError] = useState('');

  // State for editing incidents
  const [editingIncidentId, setEditingIncidentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingSeverity, setEditingSeverity] = useState('Media');

  // State for reversion authorization flow
  const [authStep, setAuthStep] = useState('none');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const getAlertStatus = (ot) => {
    if (ot.estado === 'Entregado') return 'normal';
    
    // 5. Alerta de Rechazo de Calidad
    if (ot.rechazoMotivo) {
        return 'retrabajo'; // Magenta
    }

    // 4. Alerta de Bloqueo
    if (ot.isPaused) {
        return 'bloqueo'; // Naranja
    }

    // 1. Alerta de Carga sin Estimación
    if (ot.estado === 'Programación' && kpis.ot_alert_hours_unassigned_enabled) {
        const createdAt = new Date(ot.createdAt).getTime();
        const now = new Date().getTime();
        const hoursElapsed = Math.max(0, (now - createdAt) / (1000 * 60 * 60));
        if (hoursElapsed >= kpis.ot_alert_hours_unassigned && !ot.fechaFinTrabajo) {
            return 'carga'; // Amarillo (Jefe)
        }
    }

    // 2 y 3. Alertas Preventiva y Vencimiento
    if (ot.estado === 'Producción' && ot.fechaFinTrabajo) {
        const created = new Date(ot.createdAt).getTime();
        const deadline = new Date(ot.fechaFinTrabajo).getTime();
        const deadlineEndOfDay = deadline + (24 * 60 * 60 * 1000) - 1; // Ajustar a medianoche del día límite
        const now = new Date().getTime();
        
        const totalDuration = deadlineEndOfDay - created;
        const elapsed = now - created;

        if (totalDuration > 0) {
            const ratio = elapsed / totalDuration;
            if (ratio >= 1.0) {
                return 'vencimiento'; // Rojo
            } else if (kpis.ot_alert_progress_warning_enabled && ratio >= (kpis.ot_alert_progress_warning / 100)) {
                return 'preventiva'; // Amarillo
            }
        }
    }

    // 6. Alerta de Estancamiento
    if (ot.estado === 'Finalizado' && kpis.ot_alert_hours_logistics_enabled && ot.finishedAt) {
        const finished = new Date(ot.finishedAt).getTime();
        const now = new Date().getTime();
        const hoursElapsed = (now - finished) / (1000 * 60 * 60);
        if (hoursElapsed > kpis.ot_alert_hours_logistics) {
            return 'estancamiento'; // Azul
        }
    }

    return 'normal';
  };

  const alertPriority = {
      'vencimiento': 1, // Rojo Intenso (Top Priority)
      'retrabajo': 2,   // Magenta
      'bloqueo': 3,     // Naranja
      'estancamiento': 4, // Azul
      'carga': 5,       // Amarillo
      'preventiva': 6,  // Amarillo suave
      'normal': 7
  };

  const sortedFiltered = [...filtered].sort((a, b) => alertPriority[getAlertStatus(a)] - alertPriority[getAlertStatus(b)]);

  const handleOpenOT = (ot) => {
    setSelectedOT(ot);
    setTempEstado(ot.estado);
    setAuthStep('none');
    setAdminPasswordInput('');
    setAuthError('');
    setNewIncidentText('');
    setActiveModalView('menu');
    setAsignacionFechaFin(ot.fechaFinTrabajo || '');
    setAsignacionOperario(ot.operarioAsignado || '');
    setAsignacionError('');
    setEditingIncidentId(null);
  };

  const handleUpdateIncident = async (incidentId) => {
    if (!selectedOT || !editingText.trim()) return;
    
    try {
      const descriptionPayload = JSON.stringify({
        text: editingText,
        severity: editingSeverity
      });

      const { error: incError } = await supabase
        .from('work_order_incidents')
        .update({
          description: descriptionPayload
        })
        .eq('id', incidentId);

      if (incError) throw incError;

      const logText = `Incidencia registrada (${editingSeverity}): ${editingText}`;
      const logMessagePayload = JSON.stringify({
        text: logText,
        icon: 'AlertTriangle',
        estado: selectedOT.estado
      });

      const { error: logError } = await supabase
        .from('work_order_logs')
        .update({
          message: logMessagePayload
        })
        .eq('id', incidentId);

      if (logError) throw logError;

      await fetchAllData();
      showNotification('Incidencia actualizada correctamente.');
      setEditingIncidentId(null);
      setEditingText('');
    } catch (err) {
      console.error('Error updating incident in Supabase:', err);
    }
  };

  const executeSaveEstado = async (targetEstado, isRetroceder = false) => {
    const index = ordenesTrabajo.findIndex(o => o.id === selectedOT.id);
    if (index !== -1) {
      let progreso = 0;
      switch(targetEstado) {
        case 'Programación': progreso = 0; break;
        case 'Producción': progreso = 30; break;
        case 'Revisión': progreso = 70; break;
        case 'Finalizado': progreso = 90; break;
        case 'Entregado': progreso = 100; break;
      }
      const oldEstado = ordenesTrabajo[index].estado;
      
      try {
        if (isRetroceder) {
          const currentStage = oldEstado;
          const logsForOT = otLogs[selectedOT.id] || [];
          const logsToDelete = logsForOT.filter(log => getStageForLog(log.id, logsForOT) === currentStage);
          
          const logIdsToDelete = logsToDelete.map(l => l.id);
          const incidentIdsToDelete = logsToDelete.filter(l => l.type === 'incident').map(l => l.id);

          if (logIdsToDelete.length > 0) {
            const { error: deleteLogsError } = await supabase
              .from('work_order_logs')
              .delete()
              .in('id', logIdsToDelete);
            if (deleteLogsError) throw deleteLogsError;
          }

          if (incidentIdsToDelete.length > 0) {
            const { error: deleteIncidentsError } = await supabase
              .from('work_order_incidents')
              .delete()
              .in('id', incidentIdsToDelete);
            if (deleteIncidentsError) throw deleteIncidentsError;
          }
        }

        const { error: updateError } = await supabase
          .from('work_orders')
          .update({
            status: targetEstado,
            progress: progreso
          })
          .eq('id', selectedOT.id);

        if (updateError) throw updateError;
        
        if (oldEstado !== targetEstado) {
          const nowStr = new Date().toISOString();
          const messagePayload = JSON.stringify({
            text: `Estatus cambiado a ${targetEstado}`,
            icon: targetEstado === 'Entregado' ? 'Truck' : targetEstado === 'Finalizado' ? 'CheckCircle' : 'SlidersHorizontal',
            estado: targetEstado
          });

          const { error: insertLogError } = await supabase
            .from('work_order_logs')
            .insert([{
              id: crypto.randomUUID(),
              work_order_id: selectedOT.id,
              user_id: user?.id || null,
              type: 'status',
              message: messagePayload,
              created_at: nowStr
            }]);

          if (insertLogError) throw insertLogError;
          logEvent(user, 'Estatus OT Actualizado', `Se cambió el estatus de la orden ${selectedOT.id} de ${oldEstado} a ${targetEstado}`);
        }

        await fetchAllData();
        showNotification('Estatus de la orden actualizado exitosamente.');
      } catch (err) {
        console.error('Error saving state change in Supabase:', err);
      }
    }
    setSelectedOT(null);
    setAuthStep('none');
  };



  const handleSaveEstado = () => {
    if (!selectedOT) return;
    const currentIndex = stages.indexOf(selectedOT.estado);
    const tempIndex = stages.indexOf(tempEstado);

    if (selectedOT.estado === 'Revisión' && tempEstado === 'Producción') {
        setActiveModalView('rechazo');
        return;
    }

    if (tempIndex >= 1 && !selectedOT.fechaFinTrabajo) {
        setAuthError('Debe ingresar la Fecha Estimada Fin del Trabajo en el Panel de Asignación antes de avanzar a Producción.');
        return;
    }

    if (tempIndex < currentIndex) {
      setAuthStep('password');
      setAdminPasswordInput('');
      setAuthError('');
    } else {
      executeSaveEstado(tempEstado);
    }
  };

  const handleValidatePassword = () => {
    if (adminPasswordInput === '1234') {
      setAuthStep('warning');
      setAuthError('');
    } else {
      setAuthError('Clave incorrecta. Intente nuevamente.');
    }
  };

  const executeSaveEstadoRetroceder = () => {
    executeSaveEstado(tempEstado, true);
  };

  const executeSaveEstadoRechazo = async () => {
    if (!selectedOT || !rechazoMotivoInput.trim()) return;
    
    try {
        const { error: updateError } = await supabase
          .from('work_orders')
          .update({
            rejected_reason: rechazoMotivoInput,
            status: 'Producción',
            progress: 30
          })
          .eq('id', selectedOT.id);

        if (updateError) throw updateError;
        
        const nowStr = new Date().toISOString();
        const messagePayload = JSON.stringify({
            text: `RECHAZO DE CALIDAD: ${rechazoMotivoInput}`,
            icon: 'AlertTriangle',
            estado: 'Producción'
        });

        const { error: insertLogError } = await supabase
            .from('work_order_logs')
            .insert([{
                id: crypto.randomUUID(),
                work_order_id: selectedOT.id,
                user_id: user?.id || null,
                type: 'status',
                message: messagePayload,
                created_at: nowStr
            }]);

        if (insertLogError) throw insertLogError;

        logEvent(user, 'Rechazo de Calidad OT', `La orden ${selectedOT.id} fue devuelta a Producción por: ${rechazoMotivoInput}`);
        await fetchAllData();
        showNotification('Rechazo de calidad registrado exitosamente.');
        setSelectedOT(null);
    } catch (err) {
        console.error('Error saving rejection in Supabase:', err);
    }
  };

  const handleTogglePause = async (pauseValue, reason = '') => {
      if (!selectedOT) return;
      try {
          const { error: updateError } = await supabase
              .from('work_orders')
              .update({
                  pause_reason: pauseValue ? reason : null
              })
              .eq('id', selectedOT.id);
          
          if (updateError) throw updateError;

          const logMessage = pauseValue ? `OT Bloqueada: ${reason}` : 'OT Reanudada';
          const nowStr = new Date().toISOString();
          const messagePayload = JSON.stringify({
              text: logMessage,
              icon: pauseValue ? 'Pause' : 'Play',
              estado: selectedOT.estado
          });

          await supabase.from('work_order_logs').insert([{
              id: crypto.randomUUID(),
              work_order_id: selectedOT.id,
              user_id: user?.id || null,
              type: 'incident',
              message: messagePayload,
              created_at: nowStr
          }]);

          logEvent(user, pauseValue ? 'OT Bloqueada' : 'OT Reanudada', `${logMessage} (${selectedOT.id})`);
          await fetchAllData();
          setActiveModalView('menu');
          
          showNotification(`La Orden de Trabajo ha sido ${pauseValue ? 'bloqueada' : 'reanudada'} exitosamente.`);

          if (!pauseValue) {
             setSelectedOT(null); // Close modal on resume
          }
      } catch (err) {
          console.error('Error toggling pause in Supabase:', err);
      }
  };

  const handleSaveAsignacion = async () => {
    if (!selectedOT) return;
    setAsignacionError('');

    if (asignacionFechaFin) {
      const targetDateStr = asignacionFechaFin;
      
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      if (targetDateStr < todayStr) {
        setAsignacionError('La fecha de finalización debe ser igual o mayor a la fecha actual.');
        return;
      }
    }

    try {
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({
          production_deadline: asignacionFechaFin || null,
          assigned_operative: asignacionOperario || null
        })
        .eq('id', selectedOT.id);
        
      if (updateError) throw updateError;
      
      logEvent(user, 'OT Asignación Actualizada', `Se estimó fecha de fin ${asignacionFechaFin} en la OT ${selectedOT.id}`);
      await fetchAllData();
      
      setSelectedOT(prev => ({
          ...prev, 
          fechaFinTrabajo: asignacionFechaFin,
          operarioAsignado: asignacionOperario
      }));
      showNotification('Fecha de fin de trabajo asignada correctamente.');
      setSelectedOT(null);
      setAuthStep('none');
    } catch (err) {
      console.error('Error saving assignment:', err);
      showNotification('Error al guardar: ' + (err.message || JSON.stringify(err)), 'error');
    }
  };

  const handleSaveIncident = async () => {
    if (!selectedOT || !newIncidentText.trim()) return;
    try {
      const nowStr = new Date().toISOString();
      const incidentId = crypto.randomUUID();
      
      const descriptionPayload = JSON.stringify({
        text: newIncidentText,
        severity: newIncidentSeverity
      });

      const { error: incError } = await supabase
        .from('work_order_incidents')
        .insert([{
          id: incidentId,
          work_order_id: selectedOT.id,
          description: descriptionPayload,
          resolved: false,
          created_at: nowStr
        }]);

      if (incError) throw incError;

      const logText = `Incidencia registrada (${newIncidentSeverity}): ${newIncidentText}`;
      const logMessagePayload = JSON.stringify({
        text: logText,
        icon: 'AlertTriangle',
        estado: selectedOT.estado
      });

      const { error: logError } = await supabase
        .from('work_order_logs')
        .insert([{
          id: incidentId,
          work_order_id: selectedOT.id,
          user_id: user?.id || null,
          type: 'incident',
          message: logMessagePayload,
          created_at: nowStr
        }]);

      if (logError) throw logError;

      logEvent(user, 'Incidencia OT Registrada', `Se registró una incidencia (${newIncidentSeverity}) en la orden ${selectedOT.id}: ${newIncidentText}`);

      await fetchAllData();
      showNotification('Incidencia registrada exitosamente.');
      setNewIncidentText('');
      setNewIncidentSeverity('Media');
      setActiveModalView('menu');
    } catch (err) {
      console.error('Error saving incident in Supabase:', err);
    }
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

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--text-main)', fontSize: '1.2rem' }}>Cargando Órdenes de Trabajo...</div>
      </div>
    );
  }

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
            autoComplete="off"
            className="input-control" 
            placeholder="Buscar orden o cliente..." 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedFiltered.map(ot => {
          const incidents = otIncidents[ot.id] || [];
          const hasIncidents = incidents.length > 0;
          const alertStatus = getAlertStatus(ot);
          
          let cardStyle = { margin: 0, cursor: 'pointer', transition: 'all 0.3s' };
          let badgeStyle = { display: 'none' };
          let badgeText = '';
          
          if (alertStatus === 'vencimiento') {
            cardStyle.animation = 'pulse-red 2s infinite';
            cardStyle.border = '2px solid var(--error-color)';
            cardStyle.backgroundColor = 'rgba(239, 68, 68, 0.05)';
            badgeStyle = { display: 'inline-block', backgroundColor: 'var(--error-color)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', animation: 'blink 1s infinite' };
            badgeText = 'VENCIDO (>100%)';
          } else if (alertStatus === 'retrabajo') {
            cardStyle.border = '2px solid #d946ef';
            cardStyle.backgroundColor = 'rgba(217, 70, 239, 0.05)';
            badgeStyle = { display: 'inline-block', backgroundColor: '#d946ef', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            badgeText = 'RETRABAJO';
          } else if (alertStatus === 'bloqueo') {
            cardStyle.border = '2px solid #f97316';
            cardStyle.backgroundColor = 'rgba(249, 115, 22, 0.05)';
            badgeStyle = { display: 'inline-block', backgroundColor: '#f97316', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            badgeText = 'BLOQUEADA';
          } else if (alertStatus === 'estancamiento') {
            cardStyle.border = '2px solid #3b82f6';
            badgeStyle = { display: 'inline-block', backgroundColor: '#3b82f6', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            badgeText = 'ESTANCADA (>24H)';
          } else if (alertStatus === 'carga') {
            cardStyle.border = '2px solid #eab308';
            badgeStyle = { display: 'inline-block', backgroundColor: '#eab308', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            badgeText = 'FALTA ESTIMACIÓN';
          } else if (alertStatus === 'preventiva') {
            cardStyle.animation = 'pulse-yellow 3s infinite';
            cardStyle.border = '1px solid #eab308';
            badgeStyle = { display: 'inline-block', backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#a16207', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            badgeText = `PREVENTIVA (>${kpis.ot_alert_progress_warning}%)`;
          }

          if (hasIncidents && alertStatus === 'normal') {
             cardStyle.borderLeft = '4px solid var(--error-color)';
          }

          return (
            <div key={ot.id} className="card hoverable" style={cardStyle} onClick={() => handleOpenOT(ot)}>
              <div className="flex-row-between" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong>{ot.id}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ref: {ot.cotizacionId}</span>
                  <span style={badgeStyle}>{badgeText}</span>
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
              
              <div className="flex-row-between" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                <span>Entrega: {formatDate(ot.fechaEntrega)}</span>
                <span style={{ 
                  background: `color-mix(in srgb, ${calculateGap(ot.fechaEntrega).color} 15%, transparent)`, 
                  color: calculateGap(ot.fechaEntrega).color,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  GAP: {calculateGap(ot.fechaFinTrabajo).text}
                </span>
              </div>
              
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Ingreso a Prog.: {formatDateTime(ot.createdAt)}
              </div>

              <div className="flex-row-between" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                <span>Fin de Trabajo (Target): <strong style={{ color: ot.fechaFinTrabajo ? 'var(--text-main)' : 'var(--warning-color)' }}>{ot.fechaFinTrabajo ? formatDate(ot.fechaFinTrabajo) : 'Sin Asignar'}</strong></span>
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
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    fontSize: '0.8rem', 
                    height: '32px', 
                    width: 'auto', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    margin: 0
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOTForSummary(ot);
                  }}
                >
                  📄 Ver Resumen de OT
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              {notification.type === 'success' 
                ? <CheckCircle size={48} color="var(--success-color)" />
                : <AlertTriangle size={48} color="var(--error-color)" />
              }
            </div>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1.25rem' }}>
              {notification.type === 'success' ? '¡Operación Exitosa!' : '¡Error!'}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>{notification.message}</p>
            <button 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                justifyContent: 'center',
                color: '#ffffff',
                backgroundColor: notification.type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'
              }}
              onClick={() => setNotification({ show: false, message: '', type: 'success' })}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {selectedOT && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>
                    {activeModalView === 'menu' 
                      ? 'Acciones de Orden' 
                      : activeModalView === 'estatus' 
                        ? (authStep === 'password' ? 'Autorizar Retroceso' : authStep === 'warning' ? 'Confirmar Retroceso' : 'Actualizar Estatus') 
                        : activeModalView === 'incidencia' 
                          ? 'Registrar Incidencia' 
                          : 'Historial y Trazabilidad'}
                  </span>
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
                
                {(selectedOT.estado === 'Programación' || selectedOT.estado === 'Producción' || selectedOT.estado === 'Revisión') && (
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Panel de Asignación</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* El campo Operario está oculto temporalmente a petición del usuario */}
                      <div className="input-group" style={{ margin: 0, display: 'none' }}>
                        <label style={{ fontSize: '0.85rem' }}>Operario Responsable:</label>
                        <select className="input-control" style={{ fontSize: '0.9rem' }} value={asignacionOperario} onChange={e => setAsignacionOperario(e.target.value)}>
                          <option value="">Seleccione operario...</option>
                          <option value="Juan Pérez">Juan Pérez</option>
                          <option value="Carlos Gómez">Carlos Gómez</option>
                          <option value="Luis Martínez">Luis Martínez</option>
                          <option value="Ana Torres">Ana Torres</option>
                        </select>
                      </div>
                      
                      <div className="input-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem' }}>Fecha Estimada Fin del Trabajo:</label>
                        <input 
                          type="date" 
                          className="input-control" 
                          style={{ fontSize: '0.9rem' }}
                          value={asignacionFechaFin} 
                          onChange={e => setAsignacionFechaFin(e.target.value)}
                        />
                      </div>

                      {asignacionError && (
                        <div style={{ color: 'var(--error-color)', fontSize: '0.8rem', padding: '0.5rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>
                          {asignacionError}
                        </div>
                      )}

                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        onClick={handleSaveAsignacion}
                        disabled={!asignacionFechaFin}
                      >
                        Guardar Asignación
                      </button>
                    </div>
                  </div>
                )}

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
                
                <button 
                  className={`btn ${selectedOT.isPaused ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '48px', fontSize: '0.95rem', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: selectedOT.isPaused ? 'var(--success-color)' : '', borderColor: selectedOT.isPaused ? 'var(--success-color)' : '' }}
                  onClick={() => {
                    if (selectedOT.isPaused) {
                      handleTogglePause(false);
                    } else {
                      setBloqueoMotivo('');
                      setActiveModalView('bloqueo');
                    }
                  }}
                >
                  {selectedOT.isPaused ? '▶️ Reanudar Producción' : '⏸️ Pausar / Bloquear OT'}
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
                {authStep === 'none' && (
                  <>
                    {renderTimeline(tempEstado)}

                    <div className="input-group" style={{ marginTop: '1.5rem' }}>
                      <label>Seleccionar Estatus:</label>
                      <select className="input-control" value={tempEstado} onChange={e => setTempEstado(e.target.value)}>
                        {stages.map((stage, index) => {
                          const originalIndex = stages.indexOf(selectedOT.estado);
                          // Permitir exclusivamente retroceder a la inmediatamente anterior, mantenerse, o avanzar a la inmediatamente siguiente
                          if (index >= originalIndex - 1 && index <= originalIndex + 1) {
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
                  </>
                )}

                {authStep === 'password' && (
                  <div style={{ padding: '0.5rem 0' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔒 Autorización Requerida
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                      Para retroceder a la etapa anterior, se requiere ingresar la clave de autorización del administrador.
                    </p>
                    <div className="input-group">
                      <label>Clave de Administrador:</label>
                      <input 
                        type="password" 
                        autoComplete="new-password"
                        className="input-control" 
                        placeholder="Ingrese clave..." 
                        value={adminPasswordInput}
                        onChange={e => {
                          setAdminPasswordInput(e.target.value);
                          setAuthError('');
                        }}
                        style={{ letterSpacing: adminPasswordInput ? '0.3em' : 'normal' }}
                      />
                      {authError && <span style={{ color: 'var(--error-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>⚠️ {authError}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                        onClick={() => {
                          setAuthStep('none');
                          setAdminPasswordInput('');
                          setAuthError('');
                        }}
                      >
                        Cancelar
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                        onClick={handleValidatePassword}
                      >
                        Validar Clave
                      </button>
                    </div>
                  </div>
                )}

                {authStep === 'warning' && (
                  <div style={{ padding: '0.5rem 0' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚠️ Advertencia de Eliminación
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                      Está a punto de retroceder la orden al estatus <strong>{tempEstado}</strong>. 
                      Esta acción <strong>eliminará permanentemente</strong> todas las incidencias y registros de trazabilidad (observaciones) creados durante la etapa actual (<strong>{selectedOT.estado}</strong>).
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      ¿Está seguro de que desea continuar?
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                        onClick={() => {
                          setAuthStep('none');
                          setAdminPasswordInput('');
                        }}
                      >
                        Cancelar
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px', backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }} 
                        onClick={executeSaveEstadoRetroceder}
                      >
                        Confirmar y Retroceder
                      </button>
                    </div>
                  </div>
                )}
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

            {/* Vista Bloqueo */}
            {activeModalView === 'bloqueo' && (
              <div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>Causa Raíz del Bloqueo:</label>
                  <select className="input-control" value={bloqueoMotivo} onChange={e => setBloqueoMotivo(e.target.value)}>
                    <option value="">Seleccione el motivo principal...</option>
                    <option value="Falta de insumos / materiales">Falta de insumos / materiales</option>
                    <option value="Avería o Mantenimiento de Máquina">Avería o Mantenimiento de Máquina</option>
                    <option value="Duda en planos o especificaciones">Duda en planos o especificaciones</option>
                    <option value="Falta de personal">Falta de personal</option>
                    <option value="Otro">Otro</option>
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
                    className="btn btn-primary btn-confirm-bloqueo" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px', backgroundColor: '#f97316', borderColor: '#f97316', opacity: !bloqueoMotivo ? 0.5 : 1 }} 
                    disabled={!bloqueoMotivo}
                    onClick={() => handleTogglePause(true, bloqueoMotivo)}
                  >
                    Confirmar Bloqueo
                  </button>
                </div>
              </div>
            )}

            {/* Vista Rechazo de Calidad */}
            {activeModalView === 'rechazo' && (
              <div>
                <h3 style={{ color: '#d946ef', marginTop: 0 }}>Rechazo de Calidad (Retrabajo)</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                  Está devolviendo la orden de Revisión a Producción. Debe justificar la causa del rechazo.
                </p>
                <div className="input-group">
                  <label>Motivo del Rechazo:</label>
                  <textarea 
                    className="input-control" 
                    rows="3"
                    placeholder="Especifique el defecto de calidad encontrado..."
                    value={rechazoMotivoInput}
                    onChange={e => setRechazoMotivoInput(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px' }} 
                    onClick={() => setActiveModalView('estatus')}
                  >
                    Atrás
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, height: '48px', fontSize: '0.95rem', minWidth: '120px', backgroundColor: '#d946ef', borderColor: '#d946ef', opacity: !rechazoMotivoInput.trim() ? 0.5 : 1 }} 
                    disabled={!rechazoMotivoInput.trim()}
                    onClick={executeSaveEstadoRechazo}
                  >
                    Registrar Retrabajo
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

                          const logStage = getStageForLog(log.id, logs);
                          const incidentStageIndex = stages.indexOf(logStage);
                          const currentStageIndex = stages.indexOf(selectedOT.estado);
                          const isEditableIncident = isIncident && currentStageIndex <= incidentStageIndex;

                          const incidentData = isIncident ? (otIncidents[selectedOT.id] || []).find(inc => inc.id === log.id) : null;
                          const rawText = incidentData ? incidentData.text : '';
                          const severity = incidentData ? incidentData.severity : 'Media';

                          let initialText = rawText;
                          if (isIncident && !initialText) {
                            const matches = log.text.match(/Incidencia registrada \([^)]+\):\s*(.*)/);
                            initialText = matches ? matches[1] : log.text;
                          }
                          let initialSeverity = severity;
                          if (isIncident && !incidentData) {
                            const severityMatch = log.text.match(/Incidencia registrada \(([^)]+)\)/);
                            initialSeverity = severityMatch ? severityMatch[1] : 'Media';
                          }

                          const isEditing = editingIncidentId === log.id;

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
                              
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', margin: '0.5rem 0' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Gravedad:</span>
                                    <select 
                                      className="input-control" 
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto', height: 'auto', margin: 0 }} 
                                      value={editingSeverity} 
                                      onChange={e => setEditingSeverity(e.target.value)}
                                    >
                                      <option value="Baja">Baja</option>
                                      <option value="Media">Media</option>
                                      <option value="Alta">Alta</option>
                                    </select>
                                  </div>
                                  <textarea 
                                    className="input-control" 
                                    rows="2" 
                                    style={{ fontSize: '0.85rem', width: '100%', margin: 0 }} 
                                    value={editingText} 
                                    onChange={e => setEditingText(e.target.value)}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button 
                                      type="button"
                                      className="btn btn-secondary" 
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', height: '30px', width: 'auto', display: 'flex', alignItems: 'center' }} 
                                      onClick={() => setEditingIncidentId(null)}
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      type="button"
                                      className="btn btn-primary" 
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', height: '30px', width: 'auto', display: 'flex', alignItems: 'center' }} 
                                      disabled={!editingText.trim()}
                                      onClick={() => handleUpdateIncident(log.id)}
                                    >
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p 
                                  style={{ 
                                    margin: '0.2rem 0 0 0', 
                                    fontSize: '0.875rem', 
                                    color: isIncident ? 'var(--error-color)' : 'var(--text-main)', 
                                    fontWeight: isIncident ? '600' : '400',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    cursor: isEditableIncident ? 'pointer' : 'default',
                                  }}
                                  onClick={() => {
                                    if (isEditableIncident) {
                                      setEditingIncidentId(log.id);
                                      setEditingText(initialText);
                                      setEditingSeverity(initialSeverity);
                                    }
                                  }}
                                  title={isEditableIncident ? "Haz clic para editar la incidencia" : undefined}
                                >
                                  <span>{log.text}</span>
                                  {isEditableIncident && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>✏️</span>}
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
                              )}
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
      {selectedOTForSummary && (() => {
        const matchingCotizacion = cotizaciones.find(c => c.id === selectedOTForSummary.cotizacionId);
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }} onClick={() => setSelectedOTForSummary(null)}>
            <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📄 Resumen de OT</span>
                  <span style={{ 
                    color: document.body.classList.contains('light-mode') ? '#000000' : '#60a5fa',
                    fontWeight: 'bold',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: document.body.classList.contains('light-mode') ? 'rgba(0, 0, 0, 0.05)' : 'rgba(96, 165, 250, 0.15)'
                  }}>{selectedOTForSummary.id}</span>
                </h2>
                <button 
                  type="button" 
                  onClick={() => setSelectedOTForSummary(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(var(--primary-color-rgb, 124, 58, 237), 0.03)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Información de Origen (Cotización)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>No. Cotización:</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{selectedOTForSummary.cotizacionId}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha de Emisión:</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{matchingCotizacion?.fechaEmision || 'N/D'}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ejecutivo de Ventas:</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{matchingCotizacion?.ejecutivo || 'N/D'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.25rem' }}>
                  
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Nombre del Cliente:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedOTForSummary.cliente}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Tipo de Servicio:</span>
                    <span style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedOTForSummary.tipo}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Estado de OT:</span>
                      <span style={{ 
                        background: `color-mix(in srgb, ${getStatusColor(selectedOTForSummary.estado)} 15%, transparent)`, 
                        color: getStatusColor(selectedOTForSummary.estado),
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        display: 'inline-block'
                      }}>{selectedOTForSummary.estado}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fecha de Entrega:</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{formatDate(selectedOTForSummary.fechaEntrega)}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fin de Trabajo (Target):</span>
                      <span style={{ fontWeight: '600', color: selectedOTForSummary.fechaFinTrabajo ? 'var(--text-main)' : 'var(--warning-color)', fontSize: '0.9rem' }}>{selectedOTForSummary.fechaFinTrabajo ? formatDate(selectedOTForSummary.fechaFinTrabajo) : 'Sin Asignar'}</span>
                    </div>
                  </div>

                  {selectedOTForSummary.isPaused && (
                    <div style={{ margin: '0.25rem 0', backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #f97316' }}>
                      <span style={{ fontSize: '0.75rem', color: '#f97316', display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>ORDEN BLOQUEADA</span>
                      <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Causa: <strong>{selectedOTForSummary.pauseMotivo}</strong></span>
                    </div>
                  )}

                  <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Avance de la Orden (Línea de Tiempo)</span>
                    {renderTimeline(selectedOTForSummary.estado)}
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progreso de la OT:</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedOTForSummary.progreso}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${selectedOTForSummary.progreso}%`, 
                        background: getStatusColor(selectedOTForSummary.estado),
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>

                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ minWidth: '100px', height: '40px', fontSize: '0.9rem' }}
                  onClick={() => setSelectedOTForSummary(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
