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
  const isAdmin = user?.role === 'Admin';
  const isVentas = user?.role === 'Ventas';
  const isProduccion = user?.role === 'Produccion';
  
  const navItems = [
    { path: '/dashboard', icon: <Home size={24} />, label: 'Inicio' },
    // Producción NO ve Cotizaciones
    ...(isAdmin || isVentas ? [{ path: '/cotizaciones', icon: <FileText size={24} />, label: 'Cotizaciones' }] : []),
    { path: '/ordenes', icon: <Briefcase size={24} />, label: 'Órdenes' },
    { path: '/herramientas', icon: <Wrench size={24} />, label: 'Herramientas' },
    // Solo Admin ve Ajustes
    ...(isAdmin ? [{ path: '/ajustes', icon: <Settings size={24} />, label: 'Ajustes' }] : []),
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
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.requires_password_change) {
    return <RequirePasswordChange user={user} onComplete={setUser} />;
  }
  
  // Ruteo Protegido (Expulsar si entra por URL a donde no debe)
  const path = location.pathname;
  if (user.role === 'Produccion' && path.startsWith('/cotizaciones')) {
    return <Navigate to="/dashboard" replace />;
  }
  if (user.role !== 'Admin' && path.startsWith('/ajustes')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PermissionsProvider user={user}>
      <div className="app-container">
        {children}
        <BottomNav user={user} />
      </div>
    </PermissionsProvider>
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
    </Router>
  );
}

export default App;
