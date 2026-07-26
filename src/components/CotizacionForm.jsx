import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package } from 'lucide-react';
import { mockCotizaciones, mockOrdenesTrabajo, mockOrderStatusData } from '../data/mockData';

export default function CotizacionForm({ initialData, onCancel, onSave, onDelete, user }) {
  const [formData, setFormData] = useState(initialData || {
    id: `COT-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaValidez: '15',
    cliente: '',
    contacto: '',
    ejecutivo: user?.name || 'Admin',
    estado: 'Borrador',
    items: [],
    subtotal: 0,
    impuestos: 0,
    total: 0,
    condicionesPago: '50% anticipo / 50% contra entrega',
    fechaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState('cabecera');
  const [customClients, setCustomClients] = useState([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState({ show: false, message: '' });
  const [newClientData, setNewClientData] = useState({
    empresa: '',
    contacto: '',
    rif: '',
    telefono: '',
    correo: ''
  });

  const handleAddClient = () => {
    setShowNewClientModal(true);
  };

  const executeConvertirOT = () => {
    const newOtId = `OT-500${Math.floor(Math.random() * 100) + 6}`;
    const nuevaOT = {
      id: newOtId,
      cotizacionId: formData.id,
      cliente: formData.cliente || 'Sin Cliente',
      tipo: formData.items.length > 0 ? formData.items[0].lineaNegocio : 'Varios',
      estado: 'Pendiente',
      progreso: 0,
      fechaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    mockOrdenesTrabajo.unshift(nuevaOT);
    
    const pendingStatus = mockOrderStatusData.find(s => s.name === 'Pendiente');
    if (pendingStatus) pendingStatus.cantidad += 1;

    setShowAlertModal({ show: true, message: `La cotización ha sido convertida exitosamente a la Orden de Trabajo ${newOtId}.` });
  };

  const handleConvertirOTClick = () => {
    if (formData.estado !== 'Aprobada') {
      setShowConfirmModal(true);
    } else {
      executeConvertirOT();
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items, 
        { 
          id: Date.now(), 
          lineaNegocio: 'Litografía/Digital', 
          descripcion: '', 
          cantidad: 1, 
          costoUnitario: 0, 
          adjuntos: '',
          // Dynamic fields initialized
          formato: '', sustrato: '', tintas: '', acabados: '',
          dimensiones: '', tipoMaterial: '', resolucion: '', terminaciones: '',
          dimensiones3D: '', materialesEstructurales: '', iluminacion: '', instalacion: 'No',
          materialCorte: '', grosor: '', tipoCorte: '', metraje: ''
        }
      ]
    });
  };

  const removeItem = (id) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id, field, value) => {
    const newItems = formData.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setFormData({ ...formData, items: newItems });
  };

  const renderDynamicFields = (item) => {
    switch(item.lineaNegocio) {
      case 'Litografía/Digital':
        return (
          <>
            <div className="input-group">
              <label>Formato / Tamaño</label>
              <input type="text" className="input-control" value={item.formato} onChange={e => updateItem(item.id, 'formato', e.target.value)} placeholder="Ej. Carta, Tabloide" />
            </div>
            <div className="input-group">
              <label>Sustrato</label>
              <input type="text" className="input-control" value={item.sustrato} onChange={e => updateItem(item.id, 'sustrato', e.target.value)} placeholder="Ej. Glasé 300g" />
            </div>
            <div className="input-group">
              <label>Tintas (Tiro/Retiro)</label>
              <input type="text" className="input-control" value={item.tintas} onChange={e => updateItem(item.id, 'tintas', e.target.value)} placeholder="Ej. 4x4, 4x0" />
            </div>
            <div className="input-group">
              <label>Acabados Especiales</label>
              <input type="text" className="input-control" value={item.acabados} onChange={e => updateItem(item.id, 'acabados', e.target.value)} placeholder="Ej. Plastificado mate" />
            </div>
          </>
        );
      case 'Lona/Vinil':
        return (
          <>
            <div className="input-group">
              <label>Dimensiones (Ancho x Alto)</label>
              <input type="text" className="input-control" value={item.dimensiones} onChange={e => updateItem(item.id, 'dimensiones', e.target.value)} placeholder="Ej. 200x150 cm" />
            </div>
            <div className="input-group">
              <label>Tipo de Material</label>
              <select className="input-control" value={item.tipoMaterial} onChange={e => updateItem(item.id, 'tipoMaterial', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Banner 13oz">Banner 13oz</option>
                <option value="Vinil Adhesivo">Vinil Adhesivo</option>
                <option value="Microperforado">Microperforado</option>
                <option value="Clear">Clear</option>
              </select>
            </div>
            <div className="input-group">
              <label>Resolución de Impresión</label>
              <select className="input-control" value={item.resolucion} onChange={e => updateItem(item.id, 'resolucion', e.target.value)}>
                <option value="Estándar">Estándar</option>
                <option value="Alta resolución">Alta resolución (fotográfica)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Terminaciones</label>
              <input type="text" className="input-control" value={item.terminaciones} onChange={e => updateItem(item.id, 'terminaciones', e.target.value)} placeholder="Ej. Ojetes, Bolsillos" />
            </div>
          </>
        );
      case 'Publicidad Estructural':
        return (
          <>
            <div className="input-group">
              <label>Dimensiones 3D (AlxAnxProf)</label>
              <input type="text" className="input-control" value={item.dimensiones3D} onChange={e => updateItem(item.id, 'dimensiones3D', e.target.value)} placeholder="Ej. 100x200x20 cm" />
            </div>
            <div className="input-group">
              <label>Materiales Estructurales</label>
              <input type="text" className="input-control" value={item.materialesEstructurales} onChange={e => updateItem(item.id, 'materialesEstructurales', e.target.value)} placeholder="Ej. Hierro, Acrílico" />
            </div>
            <div className="input-group">
              <label>Tipo de Iluminación</label>
              <select className="input-control" value={item.iluminacion} onChange={e => updateItem(item.id, 'iluminacion', e.target.value)}>
                <option value="Ninguna">Ninguna</option>
                <option value="Módulos LED">Módulos LED</option>
                <option value="Tubos">Tubos</option>
                <option value="Retroiluminado">Retroiluminado</option>
              </select>
            </div>
            <div className="input-group">
              <label>Servicio de Instalación</label>
              <select className="input-control" value={item.instalacion} onChange={e => updateItem(item.id, 'instalacion', e.target.value)}>
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
          </>
        );
      case 'Corte y Troquelado':
        return (
          <>
            <div className="input-group">
              <label>Material a Procesar</label>
              <input type="text" className="input-control" value={item.materialCorte} onChange={e => updateItem(item.id, 'materialCorte', e.target.value)} placeholder="Ej. Acrílico, Cartón" />
            </div>
            <div className="input-group">
              <label>Grosor del Material (mm)</label>
              <input type="number" className="input-control" value={item.grosor} onChange={e => updateItem(item.id, 'grosor', e.target.value)} placeholder="Ej. 3" />
            </div>
            <div className="input-group">
              <label>Tipo de Corte</label>
              <select className="input-control" value={item.tipoCorte} onChange={e => updateItem(item.id, 'tipoCorte', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Láser">Láser</option>
                <option value="Router CNC">Router CNC</option>
                <option value="Troquel tradicional">Troquel tradicional</option>
              </select>
            </div>
            <div className="input-group">
              <label>Metraje Lineal / Tiempo Estimado</label>
              <input type="text" className="input-control" value={item.metraje} onChange={e => updateItem(item.id, 'metraje', e.target.value)} placeholder="Ej. 50 metros" />
            </div>
          </>
        );
      default: return null;
    }
  };

  useEffect(() => {
    const subtotal = formData.items.reduce((acc, item) => {
      const cant = parseFloat(item.cantidad) || 0;
      const costo = parseFloat(item.costoUnitario) || 0;
      return acc + (cant * costo);
    }, 0);
    const impuestos = subtotal * 0.16; // 16% IVA example
    const total = subtotal + impuestos;
    
    setFormData(prev => {
      // Prevent unnecessary updates if values are the same
      if (prev.subtotal === subtotal && prev.impuestos === impuestos && prev.total === total) {
        return prev;
      }
      return { ...prev, subtotal, impuestos, total };
    });
  }, [formData.items]);

  const getCotizacionStatusColor = (estado) => {
    switch(estado) {
      case 'Borrador': return 'var(--text-muted)';
      case 'Pendiente': return 'var(--warning-color)';
      case 'Enviada': return 'var(--secondary-color)';
      case 'Aprobada': return 'var(--success-color)';
      default: return 'var(--border-color)';
    }
  };

  return (
    <div className="page-content" style={{ paddingBottom: '120px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem' }} onClick={onCancel}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, wordBreak: 'break-word', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {initialData ? <FileEdit size={24} color="var(--primary-color)" /> : <FilePlus size={24} color="var(--primary-color)" />}
            <span>
              {initialData ? `${initialData.id}` : 'Nueva Cotización'}
              {formData.cliente && (
                <> - <strong>{formData.cliente}</strong></>
              )}
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {initialData && (
            <button type="button" className="btn" style={{ background: 'var(--error-color)', padding: '0.75rem', flex: 1, display: 'flex', justifyContent: 'center' }} onClick={onDelete}>
              <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Eliminar
            </button>
          )}
          <button type="button" className="btn" style={{ padding: '0.75rem', flex: 1, display: 'flex', justifyContent: 'center', background: 'var(--secondary-color)' }} onClick={handleConvertirOTClick}>
            <Package size={18} style={{ marginRight: '0.5rem' }} /> Convertir a OT
          </button>
          <button type="button" className="btn" style={{ padding: '0.75rem', flex: 1, display: 'flex', justifyContent: 'center' }} onClick={() => onSave(formData)}>
            <Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar
          </button>
        </div>
      </div>



      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {['Cabecera', 'Detalles', 'Totales'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeTab === tab.toLowerCase() ? 'var(--primary-color)' : 'var(--surface-color)',
              color: activeTab === tab.toLowerCase() ? 'white' : 'var(--text-main)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'cabecera' && (
        <div className="card">
          <div className="input-group">
            <label>ID Cotización</label>
            <input type="text" className="input-control" value={formData.id} disabled />
          </div>
          <div className="input-group" style={{ 
            background: `color-mix(in srgb, ${getCotizacionStatusColor(formData.estado)} 10%, transparent)`, 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            border: `2px solid ${getCotizacionStatusColor(formData.estado)}`,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <label style={{ color: getCotizacionStatusColor(formData.estado), fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Estado de la Cotización
            </label>
            <select 
              className="input-control" 
              style={{ 
                fontWeight: 'bold', 
                color: getCotizacionStatusColor(formData.estado),
                borderColor: getCotizacionStatusColor(formData.estado),
                backgroundColor: 'var(--surface-color)',
                fontSize: '1.125rem'
              }}
              value={formData.estado} 
              onChange={e => setFormData({...formData, estado: e.target.value})}
            >
              <option value="Borrador" style={{ color: 'var(--text-main)' }}>Borrador</option>
              <option value="Pendiente" style={{ color: 'var(--text-main)' }}>Pendiente</option>
              <option value="Enviada" style={{ color: 'var(--text-main)' }}>Enviada</option>
              <option value="Aprobada" style={{ color: 'var(--text-main)' }}>Aprobada</option>
            </select>
          </div>
          <div className="flex-row-between" style={{ gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Fecha de Emisión</label>
              <input type="date" className="input-control" value={formData.fechaEmision} disabled />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Validez (Días)</label>
              <input type="number" className="input-control" value={formData.fechaValidez} onChange={e => setFormData({...formData, fechaValidez: e.target.value})} />
            </div>
          </div>
          <div className="input-group">
            <label>Fecha Estimada de Entrega</label>
            <input 
              type="date" 
              className="input-control" 
              value={formData.fechaEntrega || ''} 
              disabled
            />
          </div>
          <div className="input-group">
            <label>Cliente / Empresa</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="input-control" 
                style={{ flex: 1 }}
                value={formData.cliente} 
                onChange={e => setFormData({...formData, cliente: e.target.value})}
              >
                <option value="">Seleccione un cliente...</option>
                {[...new Set([...mockCotizaciones.map(c => c.cliente), 'Bimbo', 'HUBB', ...customClients])].filter((v, i, a) => a.indexOf(v) === i).map(cliente => (
                  <option key={cliente} value={cliente}>{cliente}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0 1rem', width: 'auto' }}
                onClick={handleAddClient}
                title="Agregar nuevo cliente"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="input-group">
            <label>Contacto del Cliente</label>
            <input type="text" className="input-control" value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Ejecutivo de Ventas</label>
            <input type="text" className="input-control" value={formData.ejecutivo} disabled />
          </div>
        </div>
      )}

      {activeTab === 'detalles' && (
        <div>
          {formData.items.map((item, index) => (
            <div key={item.id} className="card" style={{ position: 'relative', borderLeft: '4px solid var(--primary-color)' }}>
              <button 
                onClick={() => removeItem(item.id)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}
              >
                <Trash2 size={20} />
              </button>
              
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Ítem {index + 1}</h3>
              
              <div className="input-group">
                <label>Línea de Negocio</label>
                <select className="input-control" value={item.lineaNegocio} onChange={e => updateItem(item.id, 'lineaNegocio', e.target.value)}>
                  <option value="Litografía/Digital">Litografía / Impresión Digital</option>
                  <option value="Lona/Vinil">Lona / Vinil (Gran Formato)</option>
                  <option value="Publicidad Estructural">Publicidad Estructural</option>
                  <option value="Corte y Troquelado">Corte y Troquelado</option>
                </select>
              </div>

              <div className="input-group">
                <label>Descripción del Trabajo</label>
                <textarea className="input-control" rows="3" value={item.descripcion} onChange={e => updateItem(item.id, 'descripcion', e.target.value)} placeholder="Ej. Aviso luminoso para fachada..." />
              </div>

              <div className="flex-row-between" style={{ gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Cantidad</label>
                  <input type="number" className="input-control" value={item.cantidad} onChange={e => updateItem(item.id, 'cantidad', e.target.value)} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Costo Unitario ($)</label>
                  <input type="number" className="input-control" value={item.costoUnitario} onChange={e => updateItem(item.id, 'costoUnitario', e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Archivos Adjuntos (URLs)</label>
                <input type="text" className="input-control" value={item.adjuntos} onChange={e => updateItem(item.id, 'adjuntos', e.target.value)} placeholder="Enlaces a Drive, Dropbox..." />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Especificaciones de {item.lineaNegocio.split('/')[0]}</h4>
              
              {renderDynamicFields(item)}
              
            </div>
          ))}

          <button className="btn btn-secondary" onClick={addItem} style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-color)', background: 'transparent' }}>
            <Plus size={20} /> Añadir Ítem
          </button>
        </div>
      )}

      {activeTab === 'totales' && (
        <div className="card">
          <div className="flex-row-between" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <strong style={{ fontSize: '1.125rem' }}>${formData.subtotal.toFixed(2)}</strong>
          </div>
          <div className="flex-row-between" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Impuestos (16%)</span>
            <strong style={{ fontSize: '1.125rem' }}>${formData.impuestos.toFixed(2)}</strong>
          </div>
          <div className="flex-row-between" style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '500' }}>Total a Pagar</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>${formData.total.toFixed(2)}</strong>
          </div>
          
          <div className="input-group">
            <label>Fecha Estimada de Entrega</label>
            <input 
              type="date" 
              className="input-control" 
              value={formData.fechaEntrega || ''} 
              onChange={e => setFormData({...formData, fechaEntrega: e.target.value})} 
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="input-group">
            <label>Condiciones de Pago</label>
            <select className="input-control" value={formData.condicionesPago} onChange={e => setFormData({...formData, condicionesPago: e.target.value})}>
              <option value="50% anticipo / 50% contra entrega">50% anticipo / 50% contra entrega</option>
              <option value="100% anticipo">100% anticipo</option>
              <option value="Crédito 15 días">Crédito 15 días</option>
              <option value="Crédito 30 días">Crédito 30 días</option>
            </select>
          </div>

        </div>
      )}

      {showNewClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Nuevo Cliente</h2>
            <div className="input-group">
              <label>Nombre de la Empresa</label>
              <input type="text" className="input-control" value={newClientData.empresa} onChange={e => setNewClientData({...newClientData, empresa: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Nombre del Contacto</label>
              <input type="text" className="input-control" value={newClientData.contacto} onChange={e => setNewClientData({...newClientData, contacto: e.target.value})} />
            </div>
            <div className="input-group">
              <label>RIF / NIT / RUT</label>
              <input type="text" className="input-control" value={newClientData.rif} onChange={e => setNewClientData({...newClientData, rif: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Número de Teléfono</label>
              <input type="text" className="input-control" value={newClientData.telefono} onChange={e => setNewClientData({...newClientData, telefono: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Correo Electrónico</label>
              <input type="email" className="input-control" value={newClientData.correo} onChange={e => setNewClientData({...newClientData, correo: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setShowNewClientModal(false)}>Cancelar</button>
              <button className="btn" style={{ flex: 1, padding: '0.75rem' }} onClick={() => {
                if (newClientData.empresa.trim()) {
                  setCustomClients(prev => [...prev, newClientData.empresa.trim()]);
                  setFormData({...formData, cliente: newClientData.empresa.trim(), contacto: newClientData.contacto.trim()});
                  setShowNewClientModal(false);
                  setNewClientData({ empresa: '', contacto: '', rif: '', telefono: '', correo: '' });
                }
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Aprobar Cotización</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Debes aprobar la cotización primero. ¿Deseas aprobar la cotización y convertirla a OT ahora?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setShowConfirmModal(false)}>Cancelar</button>
              <button className="btn" style={{ flex: 1, padding: '0.75rem', background: 'var(--secondary-color)' }} onClick={() => {
                setShowConfirmModal(false);
                executeConvertirOT();
              }}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {showAlertModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--success-color)' }}>¡Éxito!</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>{showAlertModal.message}</p>
            <button className="btn" style={{ width: '100%', padding: '0.75rem' }} onClick={() => {
              setShowAlertModal({ show: false, message: '' });
              onSave({...formData, estado: 'Aprobada', convertidaAOT: true});
            }}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}
