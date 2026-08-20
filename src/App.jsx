import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Home, FileText, Briefcase, User as UserIcon, Settings, Wrench } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cotizaciones from './pages/Cotizaciones';
import OrdenesTrabajo from './pages/OrdenesTrabajo';
import Perfiles from './pages/Perfiles';
import Ajustes from './pages/Ajustes';
import Herramientas from './pages/Herramientas';
import MonitorKanban from './pages/MonitorKanban';
import RequirePasswordChange from './components/RequirePasswordChange';
import { PermissionsProvider, usePermissions } from './contexts/PermissionsContext';

function BottomNav({ user }) {
  const location = useLocation();
  const { permissions } = usePermissions();
  
  const canSeeCotizaciones = permissions?.cotizaciones?.ver;
  const canSeeOrdenes = permissions?.ordenes_trabajo?.ver;
  const canSeeAjustes = permissions?.ajustes?.acceso || permissions?.ajustes?.configurar_monitor; // Mostrar si tiene acceso a ajustes o al menos configurar monitor
  const canSeeHerramientas = Object.values(permissions?.herramientas_analiticas || {}).some(v => v);

  const navItems = [
    { path: '/dashboard', icon: <Home size={24} />, label: 'Inicio' },
    ...(canSeeCotizaciones ? [{ path: '/cotizaciones', icon: <FileText size={24} />, label: 'Cotizaciones' }] : []),
    ...(canSeeOrdenes ? [{ path: '/ordenes', icon: <Briefcase size={24} />, label: 'Órdenes' }] : []),
    ...(canSeeHerramientas ? [{ path: '/herramientas', icon: <Wrench size={24} />, label: 'Herramientas' }] : []),
    ...(canSeeAjustes ? [{ path: '/ajustes', icon: <Settings size={24} />, label: 'Ajustes' }] : []),
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// Layout wrapper for authenticated pages
function AppLayout({ children, user, setUser }) {
  const location = useLocation();
  const { permissions, loading: permsLoading } = usePermissions();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.requires_password_change) {
    return <RequirePasswordChange user={user} onComplete={setUser} />;
  }
  
  if (permsLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Ruteo Protegido (Expulsar si entra por URL a donde no debe)
  const path = location.pathname;
  if (path.startsWith('/cotizaciones') && !permissions?.cotizaciones?.ver) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const canSeeAjustes = permissions?.ajustes?.acceso || permissions?.ajustes?.configurar_monitor;
  if (path.startsWith('/ajustes') && !canSeeAjustes) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-container">
      {children}
      <BottomNav user={user} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <PermissionsProvider user={user}>
        <Routes>
          <Route path="/" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/dashboard" replace />} />
          
          {/* Rutas Públicas */}
          <Route path="/monitor-kanban/:token" element={<MonitorKanban />} />
          <Route path="/monitor-kanban" element={<Navigate to="/" replace />} />
          
          <Route path="/dashboard" element={<AppLayout user={user} setUser={setUser}><Dashboard user={user} onLogout={handleLogout} /></AppLayout>} />
          <Route path="/cotizaciones" element={<AppLayout user={user} setUser={setUser}><Cotizaciones user={user} /></AppLayout>} />
          <Route path="/ordenes" element={<AppLayout user={user} setUser={setUser}><OrdenesTrabajo user={user} /></AppLayout>} />
          <Route path="/perfil" element={<AppLayout user={user} setUser={setUser}><Perfiles user={user} setUser={setUser} /></AppLayout>} />
          <Route path="/herramientas" element={<AppLayout user={user} setUser={setUser}><Herramientas user={user} /></AppLayout>} />
          <Route path="/ajustes" element={<AppLayout user={user} setUser={setUser}><Ajustes user={user} onLogout={handleLogout} /></AppLayout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PermissionsProvider>
    </Router>
  );
}

export default App;
