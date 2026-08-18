import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, FileText, SlidersHorizontal, X, CheckCircle, AlertTriangle, HelpCircle, FileDown } from 'lucide-react';
import CotizacionForm from '../components/CotizacionForm';
import HelpDrawer from '../components/HelpDrawer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { logEvent } from '../utils/logs';
import { usePermissions } from '../contexts/PermissionsContext';
import { supabase } from '../utils/supabaseClient';
import { formatDate } from '../utils/formatters';

export default function Cotizaciones({ user }) {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('cotizaciones', 'crear');
  const canDelete = hasPermission('cotizaciones', 'eliminar');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const filterEstadoUrl = searchParams.get('estado');
  
  const [filterCliente, setFilterCliente] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState(null);
  const [filterFechaFin, setFilterFechaFin] = useState(null);
  const [filterEstadoSelect, setFilterEstadoSelect] = useState(filterEstadoUrl || '');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [editingCotizacion, setEditingCotizacion] = useState(searchParams.get('new') === 'true' ? { id: 'NEW' } : null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
  };

  const fetchCotizaciones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients (id, name, contact_name, address),
          seller:profiles (name),
          items:quote_items (*),
          work_orders:work_orders(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = data.map(q => {
        return {
          id: q.id,
          cliente: q.client?.name || 'Sin Cliente',
          clientId: q.client_id,
          contacto: q.contact_name || q.client?.contact_name || '',
          direccionCliente: q.client?.address || '',
          tipo: q.items && q.items.length > 0 ? q.items[0].line_of_business + (q.items.length > 1 ? ' y otros' : '') : 'Varios',
          monto: q.total,
          estado: q.status,
          fecha: q.created_at.split('T')[0],
          fechaEntrega: q.estimated_delivery_date,
          ejecutivo: q.seller?.name || 'Desconocido',
          sellerId: q.seller_id,
          hasWorkOrder: q.work_orders && q.work_orders.length > 0,
          items: q.items.map(item => ({
            id: item.id,
            lineaNegocio: item.line_of_business,
            descripcion: item.description,
            cantidad: item.quantity,
            costoUnitario: item.unit_price,
            ...item.technical_details
          })),
          subtotal: q.subtotal,
          impuestos: q.taxes,
          total: q.total,
          condicionesPago: q.payment_terms,
          description: q.description || '',
          motivoRechazo: q.rejection_reason || '',
          detalleRechazo: q.rejection_details || ''
        };
      });

      setCotizaciones(mapped);
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotizaciones();
    const fetchEmpresa = async () => {
      try {
        const { data, error } = await supabase
          .from('empresa')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setEmpresa(data);
        }
      } catch (err) {
        console.error('Error fetching company data:', err);
      }
    };
    fetchEmpresa();
  }, []);

  const loadHtml2Pdf = () => {
    return new Promise((resolve) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      document.body.appendChild(script);
    });
  };

  const formatCurrencyDisplay = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '$0,00';
    const parts = Number(num).toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1];
    return `$${integerPart},${decimalPart}`;
  };

  const generateSingleQuotePDF = async (quote) => {
    try {
      const response = await fetch('/PlantillaCotizacion.html');
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla de cotización.');
      }
      let htmlText = await response.text();

      const senderAddr = empresa?.direccion || "Av. Francisco de Miranda, Edif. Centro Seguros Sudamérica, El Rosal, Caracas, Venezuela";
      const clientAddr = quote.direccionCliente || "Dirección por definir, Venezuela";

      htmlText = htmlText.replace(/\[campo1\]/gi, quote.id || 'N/A');
      htmlText = htmlText.replace(/\[campo2\]/gi, quote.fecha || 'N/A');
      htmlText = htmlText.replace(/\[campo3\]/gi, empresa?.razon_social || 'Comunicaciones 6');
      htmlText = htmlText.replace(/\[campo4\]/gi, senderAddr);
      htmlText = htmlText.replace(/\[campo5\]/gi, quote.cliente || 'Sin Cliente');
      htmlText = htmlText.replace(/\[campo6\]/gi, clientAddr);
      htmlText = htmlText.replace(/src="\/logo\.png"/gi, `src="${window.location.origin}/logo.png"`);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const table = doc.getElementById('items-table');

      if (table) {
        let tableHTML = `
          <thead>
            <tr>
              <th style="background:#1e3a5f;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;padding:4pt 6pt;border:1px solid #1e3a5f;text-align:center;width:34pt;">REF.</th>
              <th style="background:#1e3a5f;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;padding:4pt 6pt;border:1px solid #1e3a5f;text-align:left;">DESCRIPCIÓN</th>
              <th style="background:#1e3a5f;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;padding:4pt 6pt;border:1px solid #1e3a5f;text-align:center;width:38pt;">CANT.</th>
              <th style="background:#1e3a5f;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;padding:4pt 6pt;border:1px solid #1e3a5f;text-align:right;width:84pt;">PRECIO UNIT.</th>
            </tr>
          </thead>
          <tbody>
        `;

        quote.items.forEach((item, index) => {
          let details = item.descripcion || '';
          const price = formatCurrencyDisplay(parseFloat(item.costoUnitario) || 0);
          const rowBg = index % 2 === 0 ? '#f8fafc' : '#ffffff';

          tableHTML += `
            <tr style="background:${rowBg};">
              <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#1a2e4a;padding:2.5pt 6pt;border:1px solid #e2e8f0;text-align:center;vertical-align:top;">${index + 1}</td>
              <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#1a2e4a;padding:2.5pt 6pt;border:1px solid #e2e8f0;vertical-align:top;white-space:pre-wrap;">${details}</td>
              <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#1a2e4a;padding:2.5pt 6pt;border:1px solid #e2e8f0;text-align:center;vertical-align:top;">${item.cantidad}</td>
              <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#1a2e4a;padding:2.5pt 6pt;border:1px solid #e2e8f0;text-align:right;vertical-align:top;">${price}</td>
            </tr>
          `;
        });

        const subtotalFormatted = formatCurrencyDisplay(quote.subtotal);
        const taxesFormatted = formatCurrencyDisplay(quote.impuestos);
        const totalFormatted = formatCurrencyDisplay(quote.total);

        tableHTML += `
            <tr>
              <td colspan="3" style="font-family:'Segoe UI',Arial,sans-serif;padding:2.5pt 6pt;border:1px solid #dbe4ef;background:#f0f5fa;text-align:right;font-size:7.5pt;color:#64748b;font-style:italic;">Subtotal:</td>
              <td style="font-family:'Segoe UI',Arial,sans-serif;padding:2.5pt 6pt;border:1px solid #dbe4ef;background:#f0f5fa;text-align:right;font-size:7.5pt;font-weight:600;color:#1a2e4a;">${subtotalFormatted}</td>
            </tr>
            <tr>
              <td colspan="3" style="font-family:'Segoe UI',Arial,sans-serif;padding:2.5pt 6pt;border:1px solid #dbe4ef;background:#f0f5fa;text-align:right;font-size:7.5pt;color:#64748b;font-style:italic;">IVA (16%):</td>
              <td style="font-family:'Segoe UI',Arial,sans-serif;padding:2.5pt 6pt;border:1px solid #dbe4ef;background:#f0f5fa;text-align:right;font-size:7.5pt;font-weight:600;color:#1a2e4a;">${taxesFormatted}</td>
            </tr>
            <tr>
              <td colspan="3" style="font-family:'Segoe UI',Arial,sans-serif;padding:4pt 6pt;border:1px solid #1e3a5f;background:#1e3a5f;text-align:right;font-size:8.5pt;font-weight:700;color:#ffffff;letter-spacing:0.3px;">TOTAL DE PRESUPUESTO:</td>
              <td style="font-family:'Segoe UI',Arial,sans-serif;padding:4pt 6pt;border:1px solid #1e3a5f;background:#1e3a5f;text-align:right;font-size:8.5pt;font-weight:700;color:#ffffff;">${totalFormatted}</td>
            </tr>
          </tbody>
        `;

        table.innerHTML = tableHTML;
      }

      const finalHtml = doc.documentElement.outerHTML;
      const html2pdfLib = await loadHtml2Pdf();
      
      const element = document.createElement('div');
      element.innerHTML = finalHtml;
      
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `cotizacion_${quote.id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      await html2pdfLib().set(opt).from(element).save();
      showNotification(`PDF de Cotización ${quote.id} generado con éxito.`);
    } catch (err) {
      console.error(err);
      showNotification('Error al generar el PDF: ' + err.message, 'error');
    }
  };

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
      case 'Enviada': return 'badge badge-primary';
      case 'En Negociación': return 'badge badge-warning';
      case 'Rechazada': return 'badge badge-danger';
      case 'Anulada': return 'badge badge-muted';
      default: return 'badge badge-primary';
    }
  };

  const filtered = cotizaciones.filter(c => {
    if (c.hasWorkOrder) return false;
    
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
      ...cotizacion,
      id: cotizacion.id,
      fechaEmision: cotizacion.fecha || cotizacion.fechaEmision || new Date().toISOString().split('T')[0],
      fechaValidez: cotizacion.fechaValidez || '15',
      cliente: cotizacion.cliente,
      clientId: cotizacion.clientId,
      contacto: cotizacion.contacto || '',
      ejecutivo: cotizacion.ejecutivo || user?.name || 'Admin',
      estado: cotizacion.estado,
      items: cotizacion.items || [],
      subtotal: cotizacion.subtotal || cotizacion.monto,
      impuestos: cotizacion.impuestos || 0,
      total: cotizacion.total || cotizacion.monto,
      condicionesPago: cotizacion.condicionesPago || '50% anticipo / 50% contra entrega',
      fechaEntrega: cotizacion.fechaEntrega || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: cotizacion.description || ''
    });
  };

  const handleSave = async (nuevaCotizacion) => {
    try {
      let finalId = nuevaCotizacion.id;

      const isRechazada = (nuevaCotizacion.estado === 'Rechazada') || (nuevaCotizacion.status === 'Rechazada');
      const rejectionReason = isRechazada ? nuevaCotizacion.motivoRechazo : null;
      const rejectionDetails = isRechazada ? nuevaCotizacion.detalleRechazo : null;

      let client_email = null;
      let client_phone = null;
      let client_address = null;
      
      if (nuevaCotizacion.clientId) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('contact_email, contact_phone, address')
          .eq('id', nuevaCotizacion.clientId)
          .single();
          
        if (clientData) {
          client_email = clientData.contact_email;
          client_phone = clientData.contact_phone;
          client_address = clientData.address;
        }
      }

      if (nuevaCotizacion._isNew) {
        const { data: insertedQuote, error: insertError } = await supabase
          .from('quotes')
          .insert([{
            client_id: nuevaCotizacion.clientId,
            contact_name: nuevaCotizacion.contacto,
            contact_email: client_email,
            contact_phone: client_phone,
            address: client_address,
            status: nuevaCotizacion.estado,
            seller_id: user.id,
            title: nuevaCotizacion.items.length > 0 ? nuevaCotizacion.items[0].lineaNegocio : 'Varios',
            subtotal: nuevaCotizacion.subtotal,
            taxes: nuevaCotizacion.impuestos,
            total: nuevaCotizacion.total,
            payment_terms: nuevaCotizacion.condicionesPago,
            estimated_delivery_date: nuevaCotizacion.fechaEntrega,
            description: nuevaCotizacion.description || '',
            rejection_reason: rejectionReason,
            rejection_details: rejectionDetails,
            approved_at: nuevaCotizacion.estado === 'Aprobada' ? new Date().toISOString() : null,
            version: 1
          }])
          .select('id')
          .single();

        if (insertError) throw insertError;
        finalId = insertedQuote.id;
        logEvent(user, 'Creación de Cotización', `Se creó la cotización ${finalId} (Monto: $${nuevaCotizacion.total.toFixed(2)})`);
      } else {
        const targetStatus = nuevaCotizacion.status || nuevaCotizacion.estado;
        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            client_id: nuevaCotizacion.clientId,
            contact_name: nuevaCotizacion.contacto,
            contact_email: client_email,
            contact_phone: client_phone,
            address: client_address,
            status: targetStatus,
            title: nuevaCotizacion.items.length > 0 ? nuevaCotizacion.items[0].lineaNegocio : 'Varios',
            subtotal: nuevaCotizacion.subtotal,
            taxes: nuevaCotizacion.impuestos,
            total: nuevaCotizacion.total,
            payment_terms: nuevaCotizacion.condicionesPago,
            estimated_delivery_date: nuevaCotizacion.fechaEntrega,
            description: nuevaCotizacion.description || '',
            rejection_reason: rejectionReason,
            rejection_details: rejectionDetails,
            approved_at: targetStatus === 'Aprobada' ? (nuevaCotizacion.approvedAt || new Date().toISOString()) : null,
            version: (nuevaCotizacion.version || 1) + 1
          })
          .eq('id', nuevaCotizacion.id);

        if (updateError) throw updateError;
        
        const { error: deleteItemsError } = await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', finalId);

        if (deleteItemsError) throw deleteItemsError;
        const changes = [];
        if (editingCotizacion.cliente && editingCotizacion.cliente !== nuevaCotizacion.cliente) changes.push(`Cliente`);
        if (editingCotizacion.estado && editingCotizacion.estado !== (nuevaCotizacion.status || nuevaCotizacion.estado)) changes.push(`Estado`);
        if (editingCotizacion.monto !== undefined && editingCotizacion.monto !== nuevaCotizacion.total) changes.push(`Monto`);
        if (editingCotizacion.fechaEntrega !== nuevaCotizacion.fechaEntrega) changes.push(`Fecha de Entrega`);
        
        let changesStr = changes.length > 0 ? ` Campos actualizados: ${changes.join(', ')}.` : '';
        logEvent(user, 'Modificación de Cotización', `Se modificó la cotización ${finalId}${changesStr}`);
      }

      const itemsToInsert = nuevaCotizacion.items.map(item => {
        const { id, lineaNegocio, descripcion, cantidad, costoUnitario, ...details } = item;
        // Clean details of extra attributes if necessary
        return {
          quote_id: finalId,
          line_of_business: lineaNegocio,
          description: descripcion,
          quantity: parseFloat(cantidad) || 1,
          unit_price: parseFloat(costoUnitario) || 0,
          technical_details: details
        };
      });

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      fetchCotizaciones();
      showNotification('Cotización guardada exitosamente.');
      setEditingCotizacion(null);
    } catch (err) {
      console.error('Error saving quote:', err);
      showNotification(`Error al guardar la cotización: ${err.message || 'Error desconocido'}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      logEvent(user, 'Eliminación de Cotización', `Se eliminó la cotización ${id}`);
      fetchCotizaciones();
      showNotification('Cotización eliminada exitosamente.');
      setEditingCotizacion(null);
    } catch (err) {
      console.error('Error deleting quote:', err);
      showNotification(`No se pudo eliminar la cotización: ${err.message || 'Error de permisos/estado'}`, 'error');
    }
  };

  if (editingCotizacion) {
    return <CotizacionForm 
      initialData={editingCotizacion.id !== 'NEW' ? editingCotizacion : null} 
      onCancel={() => setEditingCotizacion(null)} 
      onSave={handleSave} 
      onDelete={handleDelete}
      user={user}
    />;
  }

  const isAnyFilterActive = filterCliente || filterFechaInicio || filterFechaFin || filterEstadoSelect;

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      <div style={{
        position: 'sticky',
        top: '-1.5rem',
        zIndex: 100,
        backgroundColor: 'var(--bg-color)',
        margin: '-1.5rem -1.5rem 1.5rem -1.5rem',
        padding: '1.5rem 1.5rem 0.5rem 1.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>

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

        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
              <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={28} color="var(--primary-color)" /> Cotizaciones
              </h1>
              <HelpDrawer module="cotizaciones" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', width: '100%' }}>
              {canCreate && (
                <button 
                  className="btn btn-primary" 
                  style={{ height: '48px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }} 
                  onClick={() => setEditingCotizacion({id: 'NEW'})}
                >
                  <Plus size={18} />
                  <span>Nueva</span>
                </button>
              )}
              <button 
                className={`btn ${isAnyFilterActive ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ height: '48px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }} 
                onClick={() => setIsFilterDrawerOpen(true)}
              >
                <SlidersHorizontal size={18} />
                <span>Filtros {isAnyFilterActive ? '(Activo)' : ''}</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ 
                  height: '48px', 
                  width: '100%', 
                  gridColumn: canCreate ? 'span 2' : 'span 1', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.95rem' 
                }} 
                onClick={() => setIsReportModalOpen(true)}
              >
                <FileDown size={18} />
                <span>Reporte PDF</span>
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
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
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
              {cotizacion.tipo} • Ejecutivo: {cotizacion.ejecutivo}
            </p>
            <div className="flex-row-between" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Emisión: {formatDate(cotizacion.fecha)}</span>
              <strong style={{ color: 'var(--primary-color)' }}>${cotizacion.monto.toFixed(2)}</strong>
            </div>
            <div className="flex-row-between" style={{ fontSize: '0.8rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--secondary-color)' }}>
                Entrega est.: {formatDate(cotizacion.fechaEntrega)}
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
                    <option value="En Negociación">En Negociación</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                    <option value="Anulada">Anulada</option>
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



      {isReportModalOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'var(--bg-color)', 
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden'
        }}>
          <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', borderRadius: 0 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FileDown size={20} color="var(--primary-color)" />
              <span>Cotizaciones Generadas (Con OT)</span>
            </h3>
            <button className="modal-close-btn" onClick={() => setIsReportModalOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
            {cotizaciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
                No hay cotizaciones registradas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {cotizaciones.map(c => (
                  <div 
                    key={c.id} 
                    className="report-list-row"
                    style={{ 
                      padding: '1.25rem 1.5rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                    onClick={() => {
                      generateSingleQuotePDF(c);
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{c.id}</strong>
                        {c.hasWorkOrder && (
                          <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>OT Asignada</span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{c.cliente}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Emisión: {formatDate(c.fecha)} • Ejecutivo: {c.ejecutivo}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{formatCurrencyDisplay(c.total)}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileDown size={14} /> Descargar PDF
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', borderRadius: 0 }}>
            <button className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)} style={{ height: '48px', fontSize: '0.95rem', width: '100%', justifyContent: 'center' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
