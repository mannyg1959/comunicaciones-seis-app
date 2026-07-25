import { LogOut, Bell, Shield, Moon, Sun, ChevronRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Ajustes({ onLogout }) {
  const navigate = useNavigate();
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    setIsLightMode(document.body.classList.contains('light-mode'));
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle('light-mode');
    setIsLightMode(isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  };

  const settingsItems = [
    { icon: <Bell size={20} />, label: 'Notificaciones' },
    { icon: <Shield size={20} />, label: 'Privacidad y Seguridad' },
    { icon: isLightMode ? <Sun size={20} /> : <Moon size={20} />, label: isLightMode ? 'Modo Claro' : 'Modo Oscuro', onClick: toggleTheme },
  ];

  return (
    <div className="page-content">
      <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Settings size={28} color="var(--primary-color)" /> Ajustes
      </h1>
      
      <div className="card" style={{ padding: '0', marginBottom: '2rem' }}>
        {settingsItems.map((item, index) => (
          <div key={index} onClick={item.onClick} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem', 
            borderBottom: index < settingsItems.length - 1 ? '1px solid var(--border-color)' : 'none',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>{item.icon}</div>
              <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.label}</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}
      </div>

      <button 
        className="btn" 
        onClick={handleLogout}
        style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: 'var(--error-color)',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}
      >
        <LogOut size={20} />
        Cerrar Sesión
      </button>
    </div>
  );
}
