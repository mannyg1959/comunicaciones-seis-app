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
    <div className="app-container flex-center" style={{ padding: '1.5rem', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("/login-bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.4,
        zIndex: 0
      }} />
      <div className="card glass-panel" style={{ width: '100%', position: 'relative', zIndex: 1, padding: '3rem 2rem', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Comunicación 6" style={{ width: '100%', margin: '0 auto', display: 'block', marginBottom: '1.5rem' }} />
          <p style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'white', margin: 0 }}>Sistema de Trazabilidad y Gestión de Pedidos</p>
        </div>
        
        {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleLogin} autoComplete="off">
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
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
