import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, FileText, SlidersHorizontal, X, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import CotizacionForm from '../components/CotizacionForm';
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
          client:clients (id, name, contact_name),
          seller:profiles (name),
          items:quote_items (*),
          work_orders:work_orders(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filteredQuotes = data.filter(q => !q.work_orders || q.work_orders.length === 0);
      const mapped = filteredQuotes.map(q => {
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
  }, []);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
    if (c.convertidaAOT) return false;
    
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={28} color="var(--primary-color)" /> Cotizaciones
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {canCreate && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.65rem 1.25rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }} 
                onClick={() => setEditingCotizacion({id: 'NEW'})}
              >
                <Plus size={18} />
                <span>Nueva</span>
              </button>
            )}
            <button 
              className={`btn ${isAnyFilterActive ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ padding: '0.65rem 1.25rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }} 
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <SlidersHorizontal size={18} />
              Filtros {isAnyFilterActive ? '(Activo)' : ''}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.65rem 1.25rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }} 
              onClick={() => setIsHelpOpen(true)}
              title="Ayuda del módulo"
            >
              <HelpCircle size={18} />
              Ayuda
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

      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <HelpCircle size={20} color="var(--primary-color)" />
                <span>Ayuda - Módulo de Cotizaciones</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setIsHelpOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', lineHeight: '1.6' }}>
              <h4 style={{ color: 'var(--text-main)', marginTop: 0 }}>1. Visualización Rápida</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Cada tarjeta representa una cotización. Podrás ver el cliente, monto total, estado y el <strong>GAP de entrega</strong>. El GAP te indica en colores si la fecha estimada de entrega está a tiempo, próxima a vencerse, o ya venció.
              </p>
              
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>💡 RECOMENDACIÓN</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Utiliza el botón de <strong>Filtros</strong> para buscar cotizaciones por cliente, rango de fechas o estatus específico. Esto facilita el seguimiento comercial mensual.</p>
              </div>

              <h4 style={{ color: 'var(--text-main)' }}>2. Creación y Edición</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Haz clic en el botón <strong>"Nueva"</strong> para crear una cotización, o en cualquier tarjeta para ver/editar su detalle.
              </p>

              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--error-color)' }}>⚠️ ADVERTENCIA: Eliminación</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Por reglas de integridad del sistema, <strong>solo se pueden eliminar cotizaciones en estado "Borrador" o "Anulada"</strong>. Para eliminar cotizaciones en otro estado, primero deberás cambiar su estatus a Anulada.</p>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--primary-color)' }}>📌 NOTA: Gráficos y Estadísticas</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Recuerda que solo las cotizaciones en estado <strong>"Aprobada"</strong> sumarán a las estadísticas de volumen de ventas y ranking de clientes en el Dashboard.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsHelpOpen(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
