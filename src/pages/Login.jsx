import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth Error:', authError);
        setError(`Error de autenticación: ${authError.message}`);
        setLoading(false);
        return;
      }


      // Fetch user profile info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setError('No se encontró un perfil asociado a este usuario.');
        setLoading(false);
        return;
      }

      onLogin({
        ...profile,
        email: data.user.email
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Ocurrió un error inesperado al iniciar sesión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex-center" style={{ 
      padding: '1.5rem', 
      position: 'relative',
      background: 'linear-gradient(to right, var(--bg-color) 0%, rgba(30, 58, 138, 0.7) 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center', marginBottom: '2rem', zIndex: 1, position: 'relative' }}>
        <img src="/logo.png" alt="Comunicación 6" style={{ 
          width: '60%', 
          margin: '0 auto', 
          display: 'block',
          filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.8))'
        }} />
      </div>

      <form onSubmit={handleLogin} autoComplete="off" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <div className="card glass-panel" style={{ width: '100%', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-lg)', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.5rem', lineHeight: '1.3', color: 'white', margin: 0 }}>Sistema de Trazabilidad y Gestión de Pedidos</p>
          </div>
          
          {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
          
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input 
              id="email"
              type="email" 
              className="input-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              id="password"
              type="password" 
              className="input-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-inverted" 
          disabled={loading}
          style={{ width: '100%', fontWeight: 'bold', padding: '1rem', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-md)' }}
        >
          {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.7, zIndex: 1, position: 'relative' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-main)', letterSpacing: '0.05em', fontWeight: '600' }}>
          DESARROLLADO POR CLOUDNETS 2026 - VENEZUELA
        </p>
      </div>
    </div>
  );
}

