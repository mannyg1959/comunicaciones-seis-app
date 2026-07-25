import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Home, FileText, Briefcase, User as UserIcon, Settings } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cotizaciones from './pages/Cotizaciones';
import OrdenesTrabajo from './pages/OrdenesTrabajo';
import Perfiles from './pages/Perfiles';
import Ajustes from './pages/Ajustes';

// Bottom Navigation Component
function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: <Home size={24} />, label: 'Inicio' },
    { path: '/cotizaciones', icon: <FileText size={24} />, label: 'Cotizaciones' },
    { path: '/ordenes', icon: <Briefcase size={24} />, label: 'Órdenes' },
    { path: '/perfil', icon: <UserIcon size={24} />, label: 'Perfil' },
    { path: '/ajustes', icon: <Settings size={24} />, label: 'Ajustes' },
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
function AppLayout({ children, user }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="app-container">
      {children}
      <BottomNav />
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
      <Routes>
        <Route path="/" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={<AppLayout user={user}><Dashboard user={user} onLogout={handleLogout} /></AppLayout>} />
        <Route path="/cotizaciones" element={<AppLayout user={user}><Cotizaciones user={user} /></AppLayout>} />
        <Route path="/ordenes" element={<AppLayout user={user}><OrdenesTrabajo /></AppLayout>} />
        <Route path="/perfil" element={<AppLayout user={user}><Perfiles user={user} /></AppLayout>} />
        <Route path="/ajustes" element={<AppLayout user={user}><Ajustes onLogout={handleLogout} /></AppLayout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
