import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Bell, Shield, Moon, Sun, ChevronRight, ChevronLeft, LogOut, 
  Users, Clock, History, Save, Trash2, Search, CheckCircle, AlertTriangle, ArrowLeft, UserPlus, X, SlidersHorizontal 
} from 'lucide-react';
import { defaultPermissions } from '../utils/permissions';
import { logEvent } from '../utils/logs';

export default function Ajustes({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('menu'); // menu, perfil, roles, kpis, logs
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [isLightMode, setIsLightMode] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmClearLogs, setShowConfirmClearLogs] = useState(false);

  // Current logged in user from state or mock
  const [currentUser, setCurrentUser] = useState(() => {
    return user || { name: 'Administrador', role: 'Admin', username: 'admin' };
  });

  // State for Permissions
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('comunicaciones_seis_permissions');
    return saved ? JSON.parse(saved) : defaultPermissions;
  });

  // State for KPIs
  const [kpis, setKpis] = useState(() => {
    const saved = localStorage.getItem('comunicaciones_seis_kpi_targets');
    return saved ? JSON.parse(saved) : { tte: 3, tce: 4, dre: 2 };
  });

  // State for Logs
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const [filterLogFechaInicio, setFilterLogFechaInicio] = useState('');
  const [filterLogFechaFin, setFilterLogFechaFin] = useState('');
  const [filterLogTipo, setFilterLogTipo] = useState('');
  const [filterLogUsuario, setFilterLogUsuario] = useState('');
  const [isLogFilterOpen, setIsLogFilterOpen] = useState(false);

  // State for System Users
  const [usuarios, setUsuarios] = useState(() => {
    const saved = localStorage.getItem('comunicaciones_seis_usuarios');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, role: 'Admin', username: 'admin', name: 'Administrador' },
      { id: 2, role: 'Ventas', username: 'ventas', name: 'Ejecutivo de Ventas' },
      { id: 3, role: 'Produccion', username: 'prod', name: 'Jefe de Producción' }
    ];
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('Ventas');
  const [showConfirmDeleteUser, setShowConfirmDeleteUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('comunicaciones_seis_usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim()) return;

    const newUser = {
      id: Date.now(),
      name: newUserName.trim(),
      username: newUserUsername.trim().toLowerCase(),
      role: newUserRole
    };

    setUsuarios(prev => [...prev, newUser]);
    logEvent(currentUser, 'Creación de Usuario', `Se creó el usuario @${newUser.username} (${newUser.name}) con el rol de ${newUser.role}`);
    
    setNewUserName('');
    setNewUserUsername('');
    setNewUserRole('Ventas');
    setShowAddUserModal(false);
    showNotification('Usuario creado exitosamente');
  };

  const handleDeleteUser = () => {
    if (!showConfirmDeleteUser) return;
    const userToDelete = usuarios.find(u => u.id === showConfirmDeleteUser);
    if (!userToDelete) return;

    setUsuarios(prev => prev.filter(u => u.id !== showConfirmDeleteUser));
    logEvent(currentUser, 'Eliminación de Usuario', `Se eliminó al usuario @${userToDelete.username} (${userToDelete.name})`);
    
    setShowConfirmDeleteUser(null);
    showNotification('Usuario eliminado del sistema');
  };

  useEffect(() => {
    setIsLightMode(document.body.classList.contains('light-mode'));
    loadLogs();
  }, []);

  const loadLogs = () => {
    const savedLogs = localStorage.getItem('comunicaciones_seis_logs');
    setLogs(savedLogs ? JSON.parse(savedLogs) : []);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle('light-mode');
    setIsLightMode(isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    logEvent(currentUser, 'Cambio de Tema', `Se cambió a modo ${isLight ? 'Claro' : 'Oscuro'}`);
  };

  const savePermissions = () => {
    localStorage.setItem('comunicaciones_seis_permissions', JSON.stringify(permissions));
    logEvent(currentUser, 'Modificación de Permisos', 'Se actualizaron las reglas de roles y accesos');
    showNotification('Permisos guardados correctamente');
  };

  const saveKPIs = () => {
    localStorage.setItem('comunicaciones_seis_kpi_targets', JSON.stringify(kpis));
    logEvent(currentUser, 'Configuración de KPIs', `Se actualizaron las metas (TTE: ${kpis.tte}d, TCE: ${kpis.tce}d, DRE: ${kpis.dre}d)`);
    showNotification('Configuración de KPIs guardada');
  };

  const clearLogs = () => {
    localStorage.removeItem('comunicaciones_seis_logs');
    setLogs([]);
    setShowConfirmClearLogs(false);
    logEvent(currentUser, 'Limpieza de Bitácora', 'Se borraron los logs históricos del sistema');
    loadLogs();
    showNotification('Bitácora borrada correctamente');
  };

  const showNotification = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePermissionChange = (role, permissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionKey]: !prev[role][permissionKey]
      }
    }));
  };

  const handleKPIChange = (key, value) => {
    setKpis(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.usuario.toLowerCase().includes(logSearch.toLowerCase());
      
    const matchesTipo = filterLogTipo ? log.action === filterLogTipo : true;
    const matchesUsuario = filterLogUsuario ? log.usuario === filterLogUsuario : true;
    
    const logDate = new Date(log.timestamp);
    logDate.setHours(0,0,0,0);
    
    const startLimit = filterLogFechaInicio ? new Date(filterLogFechaInicio).setHours(0,0,0,0) : null;
    const endLimit = filterLogFechaFin ? new Date(filterLogFechaFin).setHours(23,59,59,999) : null;
    
    const matchesFechaInicio = startLimit ? logDate >= startLimit : true;
    const matchesFechaFin = endLimit ? logDate <= endLimit : true;
    
    return matchesSearch && matchesTipo && matchesUsuario && matchesFechaInicio && matchesFechaFin;
  });

  // Action / Title helper
  const getTabTitle = () => {
    switch (activeTab) {
      case 'roles': return 'Roles y Permisos';
      case 'usuarios': return 'Usuarios del Sistema';
      case 'kpis': return 'Trazabilidad y KPIs';
      case 'logs': return 'Bitácora de Trazabilidad';
      default: return 'Ajustes';
    }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {activeTab !== 'menu' && (
          <button 
            onClick={() => setActiveTab('menu')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 0.25rem'
            }}
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={28} color="var(--primary-color)" /> {getTabTitle()}
        </h1>
      </div>

      {message && (
        <div className="card glass-panel" style={{ 
          borderColor: 'var(--success-color)', 
          color: 'var(--success-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          marginBottom: '1rem'
        }}>
          <CheckCircle size={20} />
          <span>{message}</span>
        </div>
      )}

      {/* Main Settings Menu */}
      {activeTab === 'menu' && (
        <div className="card" style={{ padding: '0', marginBottom: '2rem' }}>
          <div onClick={() => navigate('/perfil')} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              <User size={20} style={{ color: 'var(--text-muted)' }} />
              <span style={menuItemTextStyle}>Mi Perfil</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={() => setActiveTab('roles')} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              <Shield size={20} style={{ color: 'var(--text-muted)' }} />
              <span style={menuItemTextStyle}>Roles y Permisos</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={() => setActiveTab('usuarios')} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              <Users size={20} style={{ color: 'var(--text-muted)' }} />
              <span style={menuItemTextStyle}>Usuarios del Sistema</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={() => setActiveTab('kpis')} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              <Clock size={20} style={{ color: 'var(--text-muted)' }} />
              <span style={menuItemTextStyle}>Trazabilidad y KPIs</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={() => setActiveTab('logs')} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              <History size={20} style={{ color: 'var(--text-muted)' }} />
              <span style={menuItemTextStyle}>Bitácora de Trazabilidad</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={toggleTheme} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              {isLightMode ? <Sun size={20} style={{ color: 'var(--text-muted)' }} /> : <Moon size={20} style={{ color: 'var(--text-muted)' }} />}
              <span style={menuItemTextStyle}>{isLightMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={handleLogout} style={{ ...menuItemStyle, borderBottom: 'none' }}>
            <div style={menuItemLeftStyle}>
              <LogOut size={20} style={{ color: 'var(--error-color)' }} />
              <span style={{ ...menuItemTextStyle, color: 'var(--error-color)' }}>Cerrar Sesión</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--error-color)' }} />
          </div>
        </div>
      )}

      {/* Visual Roles & Permissions configuration screen */}
      {activeTab === 'roles' && (() => {
        const rolesKeys = Object.keys(permissions);
        return (
          <div>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Configura visualmente los permisos asignados a cada uno de los roles principales del sistema de gestión.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', margin: '0 -0.5rem' }}>
              <button 
                className="carousel-nav-btn" 
                onClick={() => setCurrentRoleIndex(prev => (prev - 1 + rolesKeys.length) % rolesKeys.length)}
                aria-label="Anterior"
                style={{ flexShrink: 0 }}
              >
                <ChevronLeft size={24} />
              </button>

              <div style={{ position: 'relative', height: '360px', flex: 1, margin: '0 40px 0 10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {rolesKeys.map((role, idx) => {
                  const offset = (idx - currentRoleIndex + rolesKeys.length) % rolesKeys.length;
                  
                  // Rotation & Scaling for Stack effect (Matching CotizacionForm exactly!)
                  let transformStyle = 'translateX(54px) translateY(24px) scale(0.88) rotate(4.5deg)';
                  let zIndexVal = 0;
                  let opacityVal = 0;
                  let pointerVal = 'none';

                  if (offset === 0) {
                    transformStyle = 'translateX(0) scale(1) rotate(0deg)';
                    zIndexVal = 3;
                    opacityVal = 1;
                    pointerVal = 'auto';
                  } else if (offset === 1) {
                    transformStyle = 'translateX(18px) translateY(8px) scale(0.96) rotate(1.5deg)';
                    zIndexVal = 2;
                    opacityVal = 0.85;
                    pointerVal = 'none';
                  } else if (offset === 2) {
                    transformStyle = 'translateX(36px) translateY(16px) scale(0.92) rotate(3deg)';
                    zIndexVal = 1;
                    opacityVal = 0.6;
                    pointerVal = 'none';
                  }

                  return (
                    <div 
                      key={role} 
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: offset === 0 ? '0 10px 25px -5px rgba(0,0,0,0.3)' : 'none',
                        transform: transformStyle,
                        zIndex: zIndexVal,
                        opacity: opacityVal,
                        pointerEvents: pointerVal,
                        cursor: offset > 0 ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (offset > 0) {
                          setCurrentRoleIndex(idx);
                        }
                      }}
                    >
                      <h3 style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        paddingBottom: '0.75rem', 
                        marginBottom: '1rem',
                        color: isLightMode ? 'var(--primary-color)' : 'rgb(46, 196, 210)'
                      }}>
                        Rol: {role === 'Admin' ? 'Administrador' : role === 'Ventas' ? 'Ejecutivo de Ventas' : 'Jefe de Producción'}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                        <div style={permissionRowStyle}>
                          <label htmlFor={`perm-crear-${role}`} style={{ cursor: 'pointer', margin: 0, fontWeight: '500' }}>Crear y Editar Cotizaciones</label>
                          <input 
                            id={`perm-crear-${role}`}
                            type="checkbox" 
                            checked={permissions[role].crear_cotizaciones}
                            onChange={() => handlePermissionChange(role, 'crear_cotizaciones')}
                            style={checkboxStyle}
                          />
                        </div>

                        <div style={permissionRowStyle}>
                          <label htmlFor={`perm-eliminar-${role}`} style={{ cursor: 'pointer', margin: 0, fontWeight: '500' }}>Eliminar Cotizaciones</label>
                          <input 
                            id={`perm-eliminar-${role}`}
                            type="checkbox" 
                            checked={permissions[role].eliminar_cotizaciones}
                            onChange={() => handlePermissionChange(role, 'eliminar_cotizaciones')}
                            style={checkboxStyle}
                          />
                        </div>

                        <div style={permissionRowStyle}>
                          <label htmlFor={`perm-aprobar-${role}`} style={{ cursor: 'pointer', margin: 0, fontWeight: '500' }}>Aprobar y Anular Cotizaciones</label>
                          <input 
                            id={`perm-aprobar-${role}`}
                            type="checkbox" 
                            checked={permissions[role].aprobar_cotizaciones}
                            onChange={() => handlePermissionChange(role, 'aprobar_cotizaciones')}
                            style={checkboxStyle}
                          />
                        </div>

                        <div style={permissionRowStyle}>
                          <label htmlFor={`perm-ot-${role}`} style={{ cursor: 'pointer', margin: 0, fontWeight: '500' }}>Gestionar Órdenes de Trabajo</label>
                          <input 
                            id={`perm-ot-${role}`}
                            type="checkbox" 
                            checked={permissions[role].gestionar_ordenes}
                            onChange={() => handlePermissionChange(role, 'gestionar_ordenes')}
                            style={checkboxStyle}
                          />
                        </div>

                        <div style={permissionRowStyle}>
                          <label htmlFor={`perm-sys-${role}`} style={{ cursor: 'pointer', margin: 0, fontWeight: '500' }}>Configurar Ajustes y KPIs</label>
                          <input 
                            id={`perm-sys-${role}`}
                            type="checkbox" 
                            checked={permissions[role].configurar_sistema}
                            onChange={() => handlePermissionChange(role, 'configurar_sistema')}
                            style={checkboxStyle}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                className="carousel-nav-btn" 
                onClick={() => setCurrentRoleIndex(prev => (prev + 1) % rolesKeys.length)}
                aria-label="Siguiente"
                style={{ flexShrink: 0 }}
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="carousel-dots">
              {Object.keys(permissions).map((_, idx) => (
                <button 
                  key={idx}
                  className={`carousel-dot ${idx === currentRoleIndex ? 'active' : ''}`}
                  onClick={() => setCurrentRoleIndex(idx)}
                  aria-label={`Ir al rol ${idx + 1}`}
                />
              ))}
            </div>

            <div style={buttonContainerStyle}>
              <button 
                onClick={savePermissions} 
                className="btn btn-solid" 
                style={{ flex: 1 }}
              >
                <Save size={18} /> Guardar Permisos
              </button>
              <button 
                onClick={() => setActiveTab('menu')} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      })()}

      {/* System Users management screen */}
      {activeTab === 'usuarios' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Visualiza y administra las cuentas de usuario y sus roles asignados.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddUserModal(true)}
              style={{ width: 'auto', padding: '0 1rem' }}
            >
              <UserPlus size={18} /> Añadir Usuario
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {usuarios.map(userItem => {
              const userInitials = userItem.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              
              const getRoleBadgeStyle = (role) => {
                switch(role) {
                  case 'Admin': return { backgroundColor: 'rgba(79, 70, 229, 0.15)', color: '#818cf8', border: '1px solid rgba(79, 70, 229, 0.3)' };
                  case 'Ventas': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
                  case 'Produccion': return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
                  default: return { backgroundColor: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)' };
                }
              };

              return (
                <div key={userItem.id} className="card" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--border-color) 100%)',
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}>
                      {userInitials}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{userItem.name}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.1rem 0.5rem', 
                          borderRadius: 'var(--radius-full)',
                          fontWeight: '600',
                          ...getRoleBadgeStyle(userItem.role)
                        }}>
                          {userItem.role === 'Admin' ? 'Administrador' : userItem.role === 'Ventas' ? 'Ejecutivo de Ventas' : 'Jefe de Producción'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        @{userItem.username} • {userItem.username}@seis.com
                      </div>
                    </div>
                  </div>

                  {userItem.username !== currentUser.username && userItem.username !== 'admin' && (
                    <button 
                      onClick={() => setShowConfirmDeleteUser(userItem.id)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--error-color)',
                        padding: '0.5rem'
                      }}
                      title="Eliminar usuario"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={buttonContainerStyle}>
            <button 
              onClick={() => setActiveTab('menu')} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
            >
              Volver al Menú
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <form onSubmit={handleAddUser} className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', margin: 0 }}>
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={20} /> Añadir Nuevo Usuario
            </h3>

            <div className="input-group">
              <label htmlFor="new-user-name">Nombre Completo</label>
              <input 
                id="new-user-name"
                type="text" 
                className="input-control" 
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="new-user-username">Nombre de Usuario (Login)</label>
              <input 
                id="new-user-username"
                type="text" 
                className="input-control" 
                value={newUserUsername}
                onChange={e => setNewUserUsername(e.target.value.replace(/\s+/g, ''))}
                placeholder="Ej. jperez"
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.75rem' }}>
              <label htmlFor="new-user-role">Rol del Sistema</label>
              <select 
                id="new-user-role"
                className="input-control" 
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value)}
              >
                <option value="Ventas">Ejecutivo de Ventas</option>
                <option value="Produccion">Jefe de Producción</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>

            <div style={buttonContainerStyle}>
              <button 
                type="submit" 
                className="btn btn-solid" 
                style={{ flex: 1 }}
              >
                Crear Usuario
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserName('');
                  setNewUserUsername('');
                }} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showConfirmDeleteUser !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--error-color)' }}>
              <AlertTriangle size={32} />
              <h3 style={{ margin: 0 }}>¿Confirmar Acción?</h3>
            </div>
            
            <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              ¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esta acción le impedirá el acceso al sistema.
            </p>
            
            <div style={buttonContainerStyle}>
              <button 
                onClick={handleDeleteUser} 
                className="btn btn-solid" 
                style={{ flex: 1, backgroundColor: 'var(--error-color)' }}
              >
                Sí, eliminar
              </button>
              <button 
                onClick={() => setShowConfirmDeleteUser(null)} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global KPIs configuration screen */}
      {activeTab === 'kpis' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Metas de Trazabilidad</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Ajusta los días y tiempos objetivos globales para monitorear el desempeño del ciclo comercial y operativo.
          </p>

          <div className="input-group">
            <label htmlFor="kpi-tte">Tiempo Total en Etapa (TTE) Objetivo (días)</label>
            <input 
              id="kpi-tte"
              type="number" 
              className="input-control"
              value={kpis.tte} 
              onChange={e => handleKPIChange('tte', e.target.value)}
              min="1"
            />
          </div>

          <div className="input-group">
            <label htmlFor="kpi-tce">Tiempo de Ciclo por Etapa (TCE) Objetivo (días)</label>
            <input 
              id="kpi-tce"
              type="number" 
              className="input-control"
              value={kpis.tce} 
              onChange={e => handleKPIChange('tce', e.target.value)}
              min="1"
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="kpi-dre">Días Restantes para Entrega (DRE) Alerta (días)</label>
            <input 
              id="kpi-dre"
              type="number" 
              className="input-control"
              value={kpis.dre} 
              onChange={e => handleKPIChange('dre', e.target.value)}
              min="1"
            />
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
              Alerta en rojo cuando falten menos de este número de días para la entrega.
            </p>
          </div>

          <div style={buttonContainerStyle}>
            <button 
              onClick={saveKPIs} 
              className="btn btn-solid" 
              style={{ flex: 1 }}
            >
              <Save size={18} /> Guardar Parámetros
            </button>
            <button 
              onClick={() => setActiveTab('menu')} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Audit Log / Event list screen */}
      {activeTab === 'logs' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text" 
                placeholder="Buscar en bitácora..." 
                className="input-control"
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <button 
              onClick={() => setIsLogFilterOpen(true)}
              className={`btn ${(filterLogFechaInicio || filterLogFechaFin || filterLogTipo || filterLogUsuario) ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: 'auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Filtros avanzados"
            >
              <SlidersHorizontal size={18} />
              {(filterLogFechaInicio || filterLogFechaFin || filterLogTipo || filterLogUsuario) && <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>(Activo)</span>}
            </button>
            
            <button 
              onClick={() => setShowConfirmClearLogs(true)} 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Borrar bitácora"
            >
              <Trash2 size={18} color="var(--error-color)" />
            </button>
          </div>

          {/* Log Filter Modal */}
          {isLogFilterOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1.5rem'
            }}>
              <div className="card glass-panel" style={{ width: '100%', maxWidth: '350px', padding: '1.5rem', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                    <SlidersHorizontal size={20} /> Filtros de Bitácora
                  </h3>
                  <button 
                    onClick={() => setIsLogFilterOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="input-group">
                  <label>Fecha de Inicio</label>
                  <input 
                    type="date" 
                    className="input-control" 
                    value={filterLogFechaInicio}
                    onChange={e => setFilterLogFechaInicio(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Fecha de Fin</label>
                  <input 
                    type="date" 
                    className="input-control" 
                    value={filterLogFechaFin}
                    onChange={e => setFilterLogFechaFin(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Tipo de Operación</label>
                  <select 
                    className="input-control" 
                    value={filterLogTipo}
                    onChange={e => setFilterLogTipo(e.target.value)}
                  >
                    <option value="">Todas las Operaciones</option>
                    {[...new Set(logs.map(l => l.action))].map(act => (
                      <option key={act} value={act}>{act}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: '1.75rem' }}>
                  <label>Usuario</label>
                  <select 
                    className="input-control" 
                    value={filterLogUsuario}
                    onChange={e => setFilterLogUsuario(e.target.value)}
                  >
                    <option value="">Todos los Usuarios</option>
                    {[...new Set(logs.map(l => l.usuario))].map(usr => (
                      <option key={usr} value={usr}>{usr}</option>
                    ))}
                  </select>
                </div>

                <div style={buttonContainerStyle}>
                  <button 
                    onClick={() => {
                      setFilterLogFechaInicio('');
                      setFilterLogFechaFin('');
                      setFilterLogTipo('');
                      setFilterLogUsuario('');
                      setIsLogFilterOpen(false);
                    }} 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Limpiar
                  </button>
                  <button 
                    onClick={() => setIsLogFilterOpen(false)} 
                    className="btn btn-solid" 
                    style={{ flex: 1 }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '0', maxHeight: '450px', overflowY: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No se encontraron logs en la bitácora
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} style={{ 
                  padding: '1rem', 
                  borderBottom: '1px solid var(--border-color)', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ color: 'var(--primary-color)' }}>{log.action}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-main)', marginTop: '0.125rem' }}>{log.details}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Usuario: {log.usuario} (@{log.username})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete/Clear logs confirmation modal */}
      {showConfirmClearLogs && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--error-color)' }}>
              <AlertTriangle size={32} />
              <h3 style={{ margin: 0 }}>¿Confirmar Acción?</h3>
            </div>
            
            <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              ¿Estás seguro de que deseas borrar permanentemente todos los registros del historial de auditoría? Esta acción no se puede deshacer.
            </p>
            
            <div style={buttonContainerStyle}>
              <button 
                onClick={clearLogs} 
                className="btn btn-solid" 
                style={{ flex: 1, backgroundColor: 'var(--error-color)' }}
              >
                Sí, borrar bitácora
              </button>
              <button 
                onClick={() => setShowConfirmClearLogs(false)} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling components
const menuItemStyle = {
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  padding: '1.25rem 1rem', 
  borderBottom: '1px solid var(--border-color)',
  cursor: 'pointer',
  transition: 'background var(--transition-fast)'
};

const menuItemLeftStyle = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '1rem'
};

const menuItemTextStyle = {
  fontWeight: '500', 
  color: 'var(--text-main)'
};

const permissionRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px dotted var(--border-color)'
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: 'var(--primary-color)'
};

const buttonContainerStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
  marginTop: '1.5rem'
};
