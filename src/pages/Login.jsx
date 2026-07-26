import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProfiles } from '../data/mockData';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login logic
    const user = mockProfiles.find(p => p.username === username);
    if (user && password === '1234') { // Mock password
      onLogin(user);
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas. Usa "admin" y "1234".');
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
        <div className="card glass-panel" style={{ width: '100%', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-lg)', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.5rem', lineHeight: '1.3', color: 'white', margin: 0 }}>Sistema de Trazabilidad y Gestión de Pedidos</p>
        </div>
        
        {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
        
        <div className="input-group">
            <label htmlFor="username">Usuario</label>
            <input 
              id="username"
              type="text" 
              className="input-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Ej. admin"
              autoComplete="new-password"
              required
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
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        
        <button type="submit" className="btn btn-inverted" style={{ width: '100%', fontWeight: 'bold', padding: '1rem', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-md)' }}>
          Iniciar Sesión
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
