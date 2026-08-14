import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function Perfiles({ user, setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    cargo: user?.role === 'Admin' ? 'Administrador Principal' : 'Ejecutivo',
    area: user?.role || 'Ventas',
    email: `${user?.username || 'usuario'}@seis.com`,
    phone: user?.phone || '+34 600 123 456',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', text: '' }
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // States for Password Change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    
    try {
      let finalAvatarUrl = user.avatar_url;

      // Si el usuario seleccionó una nueva foto, la subimos a Storage
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id || 'usr'}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error("Error al subir imagen:", uploadError);
          throw new Error('No se pudo subir la foto. Asegúrate de haber creado el bucket "avatars".');
        }

        // Obtenemos la URL pública para guardarla en la base de datos
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        finalAvatarUrl = data?.publicUrl;
      }

      // Si falta user.id, usar un fallback o lanzar error
      if (!user.id) throw new Error('El ID de usuario no está definido en el contexto.');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          cargo: formData.cargo,
          role: formData.area,
          contact_email: formData.email,
          contact_phone: formData.phone,
          avatar_url: finalAvatarUrl
        })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error("Error de Supabase Update:", error);
        throw new Error('Error al guardar en base de datos. ¿Ejecutaste el script alter_profiles.sql?');
      }

      if (!data || data.length === 0) {
        console.warn("Update silencioso: No se actualizó ninguna fila. ID buscado:", user.id);
        throw new Error(`El registro en la tabla 'profiles' no fue actualizado. Es posible que el ID de tu usuario (${user.id}) no exista en la tabla o esté bloqueado por políticas de seguridad (RLS).`);
      }
      
      // Update the global user state so the new avatar and data are immediately reflected everywhere
      if (setUser) {
        setUser(prev => ({ ...prev, ...data[0] }));
      }
      
      setNotification({ type: 'success', text: 'Tus datos personales y foto se han guardado exitosamente.' });
      setAvatarFile(null); // Reseteamos el archivo pendiente
    } catch (err) {
      console.error('Error al actualizar el perfil:', err);
      setNotification({ type: 'error', text: err.message || 'Hubo un error al guardar los cambios.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setNotification({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    if (newPassword.length < 12) {
      setNotification({ type: 'error', text: 'La contraseña debe tener al menos 12 caracteres.' });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setNotification({ type: 'error', text: 'La contraseña debe contener al menos una letra mayúscula.' });
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      setNotification({ type: 'error', text: 'La contraseña debe contener al menos una letra.' });
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(newPassword)) {
      setNotification({ type: 'error', text: 'La contraseña debe contener al menos un carácter especial.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      setNotification({ type: 'success', text: 'Tu contraseña ha sido actualizada correctamente.' });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setNotification({ type: 'error', text: err.message || 'Error al actualizar la contraseña.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch(role) {
      case 'Admin': return { backgroundColor: 'rgba(79, 70, 229, 0.15)', color: '#818cf8', border: '1px solid rgba(79, 70, 229, 0.3)' };
      case 'Ventas': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'Produccion': return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      default: return { backgroundColor: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)' };
    }
  };

  return (
    <div className="page-content">
      
      {/* Modal de Confirmación o Error */}
      {notification && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              {notification.type === 'success' ? (
                <CheckCircle size={48} color="var(--success-color)" />
              ) : (
                <div style={{ color: 'var(--error-color)', fontSize: '3rem', fontWeight: 'bold' }}>!</div>
              )}
            </div>
            <h3 style={{ margin: '0 0 1rem 0', color: notification.type === 'success' ? 'var(--text-main)' : 'var(--error-color)', fontSize: '1.25rem' }}>
              {notification.type === 'success' ? '¡Operación Exitosa!' : 'Error'}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>{notification.text}</p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', color: '#ffffff', height: '48px', fontSize: '0.95rem' }}
              onClick={() => setNotification(null)}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0 }}>
            <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--text-main)', fontSize: '1.25rem' }}>Cambiar Contraseña</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="input-group">
                <label style={{ color: 'var(--text-muted)' }}>Nueva Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-control" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: newPassword.length >= 12 ? 'var(--success-color)' : 'var(--error-color)' 
                  }}>
                    {newPassword.length} / 12+ caracteres
                  </span>
                </div>
              </div>
              <div className="input-group">
                <label style={{ color: 'var(--text-muted)' }}>Confirmar Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="input-control" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); setShowPassword(false); setShowConfirmPassword(false); }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tarjeta 1: Encabezado del Perfil (Compacto) */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', flexWrap: 'wrap' }}>
        
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {(previewUrl || user.avatar_url) ? (
            <img 
              src={previewUrl || user.avatar_url} 
              alt={user.name} 
              style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '14px', 
                objectFit: 'cover',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }} 
            />
          ) : (
            <div style={{ 
              width: '90px', 
              height: '90px', 
              borderRadius: '14px', 
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark-color, #1e1b4b) 100%)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              {user.name.charAt(0)}
            </div>
          )}
          
          <button 
            onClick={handleChangePhoto}
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: '-6px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease, background-color 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = '#6366f1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'var(--primary-color)';
            }}
            title="Cambiar foto de perfil"
          >
            <Edit2 size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="image/*"
          />
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', color: 'var(--text-main)' }}>{formData.name}</h2>
          <p style={{ margin: '0 0 0.75rem 0', color: 'var(--primary-color)', fontSize: '0.95rem', fontWeight: '500' }}>{formData.cargo}</p>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '0.25rem 0.75rem', 
              borderRadius: 'var(--radius-full)',
              fontWeight: '600',
              ...getRoleBadgeStyle(formData.area)
            }}>
              {formData.area === 'Admin' ? 'Administrador' : formData.area === 'Ventas' ? 'Ejecutivo de Ventas' : formData.area === 'Produccion' ? 'Jefe de Producción' : formData.area}
            </span>
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '0.25rem 0.75rem', 
              borderRadius: 'var(--radius-full)',
              fontWeight: '600',
              backgroundColor: 'rgba(16, 185, 129, 0.15)', 
              color: '#34d399', 
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              Activo
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Formulario de Información Personal */}
      <div className="card" style={{ marginTop: '1rem', padding: '1.25rem 1.5rem' }}>
        <h3 style={{ 
          margin: '0 0 1.25rem 0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          color: 'var(--text-main)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary-color)" /> <span style={{ fontSize: '1.15rem' }}>Información Personal</span>
          </div>
          <button 
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            onClick={() => setShowPasswordModal(true)}
          >
            Cambiar Contraseña
          </button>
        </h3>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Nombre Completo</label>
              <input 
                type="text" 
                className="input-control" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Cargo</label>
              <input 
                type="text" 
                className="input-control" 
                value={formData.cargo}
                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Área de Trabajo</label>
              <select 
                className="input-control"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                required
              >
                <option value="Admin">Administración</option>
                <option value="Ventas">Ventas</option>
                <option value="Produccion">Producción</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Correo Electrónico</label>
              <input 
                type="email" 
                className="input-control" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Teléfono</label>
              <input 
                type="tel" 
                className="input-control" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1, justifyContent: 'center', height: '48px', fontSize: '0.95rem' }}
              onClick={() => navigate(-1)}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1, justifyContent: 'center', height: '48px', fontSize: '0.95rem' }}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
