import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Lock, AlertTriangle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const RequirePasswordChange = ({ user, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe contener al menos una letra mayúscula.');
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      setError('La contraseña debe contener al menos una letra.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(newPassword)) {
      setError('La contraseña debe contener al menos un carácter especial.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword === 'Password123!') {
      setError('Debes elegir una contraseña diferente a la genérica.');
      return;
    }

    setLoading(true);

    try {
      // 1. Actualizar la contraseña en Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Apagar el flag requires_password_change en la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ requires_password_change: false })
        .eq('id', user.id);

      if (profileError) {
        console.error("Error actualizando perfil:", profileError);
      }

      // Notificamos a la App principal para que lo deje pasar
      onComplete({ ...user, requires_password_change: false });
      
    } catch (err) {
      console.error(err);
      setError('Hubo un error al cambiar la contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex-center" style={{ 
      padding: '1.5rem', 
      background: 'linear-gradient(to right, var(--bg-color) 0%, rgba(30, 58, 138, 0.7) 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 1 }}>
        <div className="card glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1rem auto', 
              position: 'relative', flexShrink: 0 
            }}>
              <img 
                src={user.avatar_url || '/FotoPerfilPlantilla.jpg'} 
                alt={user.name}
                style={{ 
                  width: '72px', 
                  height: '72px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  backgroundColor: 'var(--border-color)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ 
                display: 'none',
                width: '72px', 
                height: '72px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark-color, #1e1b4b) 100%)', 
                color: 'white', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Cambio de Clave Obligatorio</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
              Hola <strong>{user.name}</strong>. Por motivos de seguridad, debes configurar una contraseña personal antes de acceder al sistema.
            </p>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: 'var(--error-color)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', 
              display: 'flex', alignItems: 'center', gap: '0.5rem' 
            }}>
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label htmlFor="new-password">Nueva Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  className="input-control" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 12 caracteres"
                  required
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
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

            <div className="input-group" style={{ margin: 0 }}>
              <label htmlFor="confirm-password">Confirmar Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="input-control" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Vuelve a escribir la contraseña"
                  required
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
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

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', height: '48px' }}>
              {loading ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequirePasswordChange;
