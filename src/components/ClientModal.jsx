import React, { useState, useEffect } from 'react';
import { UserPlus, FileEdit, X, Building2, CreditCard, User, Phone, Mail, Navigation, MapPin, Map, MessageSquare } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSave, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState({
    empresa: '',
    contacto: '',
    rif: '',
    telefono: '',
    correo: '',
    direccion: '',
    ciudad: '',
    estado: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          id: initialData.id || '',
          empresa: initialData.empresa || '',
          contacto: initialData.contacto || '',
          rif: initialData.rif || '',
          telefono: initialData.telefono || '',
          correo: initialData.correo || '',
          direccion: initialData.direccion || '',
          ciudad: initialData.ciudad || '',
          estado: initialData.estado || '',
          observaciones: initialData.observaciones || ''
        });
      } else {
        setFormData({
          empresa: '',
          contacto: '',
          rif: '',
          telefono: '',
          correo: '',
          direccion: '',
          ciudad: '',
          estado: '',
          observaciones: ''
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isFormValid = () => {
    const e = (formData.empresa || '').trim();
    const c = (formData.contacto || '').trim();
    const r = (formData.rif || '').trim();
    const t = (formData.telefono || '').trim();
    const m = (formData.correo || '').trim();
    const ci = (formData.ciudad || '').trim();
    const es = (formData.estado || '').trim();
    return e && c && r && t && m && ci && es;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid() || loading) return;

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error guardando cliente:', err);
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
            style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px', opacity: isFormValid() ? 1 : 0.5 }} 
            disabled={!isFormValid() || loading}
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
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
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
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
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
          <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-color)', margin: '0 0 0.75rem 0' }}>
            Datos del Contacto
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
                Nombre del Contacto <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Juan Pérez" 
                  style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
                  value={formData.contacto} 
                  onChange={e => setFormData({ ...formData, contacto: e.target.value })} 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
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
          </div>

          <div className="input-group" style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
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

          {/* Sección 3: Ubicación */}
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.75rem 0' }} />
          <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-color)', margin: '0 0 0.75rem 0' }}>
            Ubicación
          </p>
          <div className="input-group" style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
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
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
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
              <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
                Estado <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Map size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Miranda" 
                  style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }} 
                  value={formData.estado} 
                  onChange={e => setFormData({ ...formData, estado: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Observaciones */}
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.75rem 0' }} />
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', display: 'block' }}>
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
    </div>
  );
}
