import React, { useState, useEffect } from 'react';
import { UserPlus, FileEdit, X, Building2, CreditCard, User, Phone, Mail, Navigation, MapPin, Map, MessageSquare } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSave, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState({
    empresa: '',
    rif: '',
    direccion: '',
    ciudad: '',
    estado: '',
    observaciones: '',
    contactos: [{ id: crypto.randomUUID(), nombre: '', telefono: '', correo: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ show: false, type: '', message: '' });

  // Estados para el sub-modal de contactos
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactData, setEditingContactData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let parsedContactos = [];
        if (initialData.contactos && initialData.contactos.length > 0) {
          parsedContactos = initialData.contactos;
        } else if (initialData.contacto) {
          parsedContactos = [{
            id: crypto.randomUUID(),
            nombre: initialData.contacto || '',
            telefono: initialData.telefono || '',
            correo: initialData.correo || ''
          }];
        } else {
          parsedContactos = [{ id: crypto.randomUUID(), nombre: '', telefono: '', correo: '' }];
        }

        setFormData({
          id: initialData.id || '',
          empresa: initialData.empresa || '',
          rif: initialData.rif || '',
          direccion: initialData.direccion || '',
          ciudad: initialData.ciudad || '',
          estado: initialData.estado || '',
          observaciones: initialData.observaciones || '',
          contactos: parsedContactos
        });
      } else {
        setFormData({
          empresa: '',
          rif: '',
          direccion: '',
          ciudad: '',
          estado: '',
          observaciones: '',
          contactos: [{ id: crypto.randomUUID(), nombre: '', telefono: '', correo: '' }]
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isFormValid = () => {
    const isMainValid = (
      (formData.empresa || '').trim() !== '' &&
      (formData.rif || '').trim() !== '' &&
      (formData.ciudad || '').trim() !== '' &&
      (formData.estado || '').trim() !== ''
    );
    const areContactsValid = formData.contactos.length > 0 && formData.contactos.every(c => 
      (c.nombre || '').trim() !== '' && 
      (c.telefono || '').trim() !== '' && 
      (c.correo || '').trim() !== ''
    );
    return isMainValid && areContactsValid;
  };

  const handleAddContact = () => {
    setEditingContactData(null);
    setShowContactModal(true);
  };

  const handleEditContact = (contacto) => {
    setEditingContactData(contacto);
    setShowContactModal(true);
  };

  const handleRemoveContact = (id) => {
    setFormData(prev => ({
      ...prev,
      contactos: prev.contactos.filter(c => c.id !== id)
    }));
  };

  const handleSaveContact = (contactData) => {
    if (editingContactData) {
      // Edit
      setFormData(prev => ({
        ...prev,
        contactos: prev.contactos.map(c => c.id === contactData.id ? contactData : c)
      }));
    } else {
      // Add
      setFormData(prev => ({
        ...prev,
        contactos: [...prev.contactos, contactData]
      }));
    }
    setShowContactModal(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!isFormValid()) {
      setFeedbackModal({ show: true, type: 'error', message: 'Por favor, complete todos los campos obligatorios marcados con un asterisco rojo (*).' });
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      setFeedbackModal({ show: true, type: 'success', message: 'Cliente guardado exitosamente.' });
    } catch (err) {
      console.error('Error guardando cliente:', err);
      setFeedbackModal({ show: true, type: 'error', message: 'Ocurrió un error al guardar el cliente: ' + (err.message || 'Error desconocido') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '1rem' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '560px', margin: 0, maxHeight: '92vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', padding: '1.5rem' }}>
        
        {/* Cabecera: Título + Botón de Cerrar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isEditing ? <FileEdit size={22} color="var(--primary-color)" /> : <UserPlus size={22} color="var(--primary-color)" />}
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Botones de Acción (Justo debajo del Título) */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px' }} 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px' }} 
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar')}
          </button>
        </div>

        <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0 0 1.25rem 0' }} />

        {/* Formulario */}
        <form onSubmit={handleSubmit}>

          {/* Sección 1: Datos de la Empresa */}
          <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-color)', margin: '0 0 0.75rem 0' }}>
            Datos de la Empresa
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
                Empresa <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Alimentos Polar, C.A." 
                  style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
                  value={formData.empresa} 
                  onChange={e => setFormData({ ...formData, empresa: e.target.value })} 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
                RIF / NIT / RUT <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. J-12345678-9" 
                  style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
                  value={formData.rif} 
                  onChange={e => setFormData({ ...formData, rif: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Datos del Contacto */}
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.75rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-color)', margin: 0 }}>
              Datos del Contacto
            </p>
            <button 
              type="button" 
              onClick={handleAddContact}
              style={{ background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              + Añadir Contacto
            </button>
          </div>
          
          {formData.contactos.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>No hay contactos asociados.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {formData.contactos.map((contacto) => (
                <div key={contacto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <p style={{ margin: '0 0 0.35rem 0', fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>{contacto.nombre}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={12} /> {contacto.telefono}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} /> {contacto.correo}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => handleEditContact(contacto)}
                      style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      title="Editar Contacto"
                    >
                      <FileEdit size={16} />
                    </button>
                    {formData.contactos.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveContact(contacto.id)}
                        style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-color)', color: 'var(--error-color)', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        title="Eliminar Contacto"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sección 3: Ubicación */}
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.75rem 0' }} />
          <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-color)', margin: '0 0 0.75rem 0' }}>
            Ubicación
          </p>
          <div className="input-group" style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
              Dirección
            </label>
            <div style={{ position: 'relative' }}>
              <Navigation size={15} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
              <textarea 
                className="input-control" 
                rows="2" 
                placeholder="Ej. Av. Principal, Edif. Centro, Piso 3..." 
                style={{ paddingLeft: '2.25rem', paddingTop: '0.6rem', resize: 'vertical', fontSize: '0.875rem' }} 
                value={formData.direccion} 
                onChange={e => setFormData({ ...formData, direccion: e.target.value })} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
                Ciudad <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Caracas" 
                  style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
                  value={formData.ciudad} 
                  onChange={e => setFormData({ ...formData, ciudad: e.target.value })} 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
                Estado <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Map size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  className="input-control"
                  style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem', appearance: 'none', backgroundColor: 'var(--bg-color)' }}
                  value={formData.estado}
                  onChange={e => setFormData({ ...formData, estado: e.target.value })}
                >
                  <option value="" disabled>Seleccione un estado...</option>
                  <option value="Amazonas">Amazonas</option>
                  <option value="Anzoátegui">Anzoátegui</option>
                  <option value="Apure">Apure</option>
                  <option value="Aragua">Aragua</option>
                  <option value="Barinas">Barinas</option>
                  <option value="Bolívar">Bolívar</option>
                  <option value="Carabobo">Carabobo</option>
                  <option value="Cojedes">Cojedes</option>
                  <option value="Delta Amacuro">Delta Amacuro</option>
                  <option value="Dependencias Federales">Dependencias Federales</option>
                  <option value="Distrito Capital">Distrito Capital</option>
                  <option value="Falcón">Falcón</option>
                  <option value="Guárico">Guárico</option>
                  <option value="La Guaira">La Guaira</option>
                  <option value="Lara">Lara</option>
                  <option value="Mérida">Mérida</option>
                  <option value="Miranda">Miranda</option>
                  <option value="Monagas">Monagas</option>
                  <option value="Nueva Esparta">Nueva Esparta</option>
                  <option value="Portuguesa">Portuguesa</option>
                  <option value="Sucre">Sucre</option>
                  <option value="Táchira">Táchira</option>
                  <option value="Trujillo">Trujillo</option>
                  <option value="Yaracuy">Yaracuy</option>
                  <option value="Zulia">Zulia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 4: Observaciones */}
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.75rem 0' }} />
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
              Observaciones
            </label>
            <div style={{ position: 'relative' }}>
              <MessageSquare size={15} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
              <textarea 
                className="input-control" 
                rows="2" 
                placeholder="Detalles u observaciones adicionales..." 
                style={{ paddingLeft: '2.25rem', paddingTop: '0.6rem', fontSize: '0.875rem' }} 
                value={formData.observaciones} 
                onChange={e => setFormData({ ...formData, observaciones: e.target.value })} 
              />
            </div>
          </div>

        </form>
      </div>

      {/* Modal de Validación / Feedback */}
      {feedbackModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem' }}>
                {feedbackModal.type === 'error' ? (
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error-color)' }}>
                    <X size={28} />
                  </div>
                ) : (
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>
                {feedbackModal.type === 'error' ? 'Acción Incompleta' : '¡Éxito!'}
              </h3>
              <p style={{ marginBottom: '1.75rem', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {feedbackModal.message}
              </p>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', fontWeight: '600' }} 
                onClick={() => {
                  if (feedbackModal.type === 'success') {
                    setFeedbackModal({ show: false, type: '', message: '' });
                    onClose();
                  } else {
                    setFeedbackModal({ show: false, type: '', message: '' });
                  }
                }}
              >
                {feedbackModal.type === 'error' ? 'Entendido' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showContactModal && (
        <ContactFormModal
          isOpen={showContactModal}
          initialData={editingContactData}
          onClose={() => setShowContactModal(false)}
          onSave={handleSaveContact}
        />
      )}
    </div>
  );
}

function ContactFormModal({ isOpen, initialData, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    telefono: '',
    correo: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          id: crypto.randomUUID(),
          nombre: '',
          telefono: '',
          correo: ''
        });
      }
      setErrorMsg('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (!formData.nombre.trim() || !formData.telefono.trim() || !formData.correo.trim()) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300, padding: '1rem' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="var(--primary-color)" />
            {initialData ? 'Editar Contacto' : 'Nuevo Contacto'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--error-color)', borderRadius: '4px', color: 'var(--error-color)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <div className="input-group">
          <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
            Nombre del Contacto <span style={{ color: 'var(--error-color)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="Ej. Juan Pérez" 
              style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
              value={formData.nombre} 
              onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
            />
          </div>
        </div>

        <div className="input-group">
          <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
            Teléfono <span style={{ color: 'var(--error-color)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="Ej. +58 412-1234567" 
              style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
              value={formData.telefono} 
              onChange={e => setFormData({ ...formData, telefono: e.target.value })} 
            />
          </div>
        </div>

        <div className="input-group">
          <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block', color: '#ffffff' }}>
            Correo Electrónico <span style={{ color: 'var(--error-color)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              className="input-control" 
              placeholder="Ej. contacto@empresa.com" 
              style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
              value={formData.correo} 
              onChange={e => setFormData({ ...formData, correo: e.target.value })} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ flex: 1, height: '40px', fontSize: '0.9rem' }} 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            style={{ flex: 1, height: '40px', fontSize: '0.9rem' }} 
            onClick={handleSaveClick}
          >
            Guardar Contacto
          </button>
        </div>

      </div>
    </div>
  );
}
