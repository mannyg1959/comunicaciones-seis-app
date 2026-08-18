import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Bell, Shield, Moon, Sun, ChevronRight, ChevronLeft, LogOut, 
  Users, Clock, History, Save, Trash2, Search, CheckCircle, AlertTriangle, ArrowLeft, UserPlus, X, SlidersHorizontal, Key, Edit2, Building2
} from 'lucide-react';
import HelpDrawer from '../components/HelpDrawer';
import { defaultPermissions } from '../utils/permissions';
import { logEvent } from '../utils/logs';
import { supabase } from '../utils/supabaseClient';
import { formatDateTime } from '../utils/formatters';

// Mapeo amigable de módulos y acciones para la UI
const moduleMap = {
  cotizaciones: {
    title: 'Cotizaciones',
    actions: { ver: 'Ver Listado', crear: 'Crear', editar: 'Editar', cambiar_estatus: 'Cambiar Estatus', anular: 'Anular', eliminar: 'Eliminar', imprimir: 'Imprimir/Exportar', gestionar_clientes: 'Gestionar Clientes' }
  },
  ordenes_trabajo: {
    title: 'Órdenes de Trabajo (OT)',
    actions: { ver: 'Ver Listado', crear: 'Crear', editar: 'Editar', asignar_tecnicos: 'Asignar Técnicos', cambiar_estatus: 'Cambiar Estatus', imprimir: 'Imprimir/Exportar', eliminar: 'Eliminar' }
  },
  dashboard: {
    title: 'Dashboard (Métricas)',
    actions: { ver_general: 'Acceso General', ver_financieros: 'Ver KPIs Financieros', ver_operativos: 'Ver Métricas Operativas' }
  },
  herramientas_analiticas: {
    title: 'Herramientas y Analíticas',
    actions: { ver_reportes: 'Ver Reportes Avanzados', exportar_datos: 'Exportar a CSV', ver_alertas: 'Ver Panel de Alertas' }
  },
  ajustes: {
    title: 'Ajustes de Sistema',
    actions: { acceso: 'Acceso a Configuración', gestionar_usuarios: 'Gestionar Usuarios', gestionar_roles: 'Configurar Roles y Permisos', configurar_kpis: 'Configurar KPIs y Metas', ver_logs: 'Ver Log de Auditoría' }
  }
};

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
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Fetch permissions from Supabase
  useEffect(() => {
    const fetchAllPermissions = async () => {
      try {
        const { data, error } = await supabase.from('roles_permissions').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          const permMap = {};
          data.forEach(row => {
            permMap[row.role_name] = row.permissions;
          });
          setPermissions(permMap);
        }
      } catch (err) {
        console.error('Error fetching all permissions:', err);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchAllPermissions();
  }, []);

  // State for KPIs and Alerts
  const [kpiTab, setKpiTab] = useState('cotizaciones'); // 'cotizaciones' or 'ots'
  const [kpis, setKpis] = useState({ 
    tte: 3, tce: 7, dre: 2, alert_days_quotes: 7, alert_days_ots: 7,
    tte_enabled: true, tce_enabled: true, dre_enabled: true, alert_quotes_enabled: true, alert_ots_enabled: true,
    ot_alert_hours_unassigned: 2, ot_alert_progress_warning: 80, ot_alert_hours_logistics: 24,
    ot_alert_hours_unassigned_enabled: true, ot_alert_progress_warning_enabled: true, ot_alert_hours_logistics_enabled: true
  });
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);

  // State for Logs
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const [filterLogFechaInicio, setFilterLogFechaInicio] = useState('');
  const [filterLogFechaFin, setFilterLogFechaFin] = useState('');
  const [filterLogTipo, setFilterLogTipo] = useState('');
  const [filterLogUsuario, setFilterLogUsuario] = useState('');
  const [isLogFilterOpen, setIsLogFilterOpen] = useState(false);

  // State for System Users
  const [usuarios, setUsuarios] = useState([]);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(true);

  // Cargar usuarios desde la base de datos (profiles)
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, username, role, cargo, avatar_url, contact_phone');
        
        if (error) throw error;
        if (data) {
          setUsuarios(data);
        }
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
      } finally {
        setIsLoadingUsuarios(false);
      }
    };
    
    if (activeTab === 'usuarios') {
      fetchUsuarios();
    }
  }, [activeTab]);

  // ── State for Datos de la Empresa ──────────────────────────
  const empresaInitial = {
    razon_social: '', rif: '', direccion: '',
    telefono: '', email: '', sitio_web: ''
  };
  const [empresaData,          setEmpresaData]          = useState(empresaInitial);
  const [empresaId,            setEmpresaId]            = useState(null);
  const [isLoadingEmpresa,     setIsLoadingEmpresa]     = useState(false);
  const [isSavingEmpresa,      setIsSavingEmpresa]      = useState(false);
  const [showEmpresaSuccess,   setShowEmpresaSuccess]   = useState(false);

  // Cargar datos de empresa desde Supabase
  useEffect(() => {
    if (activeTab !== 'empresa') return;
    const fetchEmpresa = async () => {
      setIsLoadingEmpresa(true);
      try {
        const { data, error } = await supabase
          .from('empresa')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setEmpresaId(data.id);
          setEmpresaData({
            razon_social: data.razon_social || '',
            rif:          data.rif          || '',
            direccion:    data.direccion    || '',
            telefono:     data.telefono     || '',
            email:        data.email        || '',
            sitio_web:    data.sitio_web    || '',
          });
        }
      } catch (err) {
        console.error('Error al cargar datos de la empresa:', err);
      } finally {
        setIsLoadingEmpresa(false);
      }
    };
    fetchEmpresa();
  }, [activeTab]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('Ventas');
  const [newUserCargo, setNewUserCargo] = useState('Ejecutivo');
  const [newUserPhone, setNewUserPhone] = useState('+58 ');
  const [showConfirmDeleteUser, setShowConfirmDeleteUser] = useState(null);

  // Edit User State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserUsername, setEditingUserUsername] = useState('');
  const [editingUserRole, setEditingUserRole] = useState('Ventas');
  const [editingUserCargo, setEditingUserCargo] = useState('');
  const [editingUserPhone, setEditingUserPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editAvatarInputRef = useRef(null);

  const openEditUserModal = (userItem) => {
    setEditingUserId(userItem.id);
    setEditingUserName(userItem.name || '');
    setEditingUserUsername(userItem.username || '');
    setEditingUserRole(userItem.role || 'Ventas');
    setEditingUserCargo(userItem.cargo || '');
    setEditingUserPhone(userItem.contact_phone || '');
    setEditAvatarUrl(userItem.avatar_url || '/FotoPerfilPlantilla.jpg');
    setEditAvatarFile(null);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      let finalAvatarUrl = editAvatarUrl;

      if (editAvatarFile) {
        const fileExt = editAvatarFile.name.split('.').pop();
        const fileName = `${editingUserId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, editAvatarFile, { upsert: true });

        if (uploadError) throw new Error('No se pudo subir la foto.');

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        finalAvatarUrl = data?.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editingUserName.trim(),
          role: editingUserRole,
          cargo: editingUserCargo.trim(),
          contact_phone: editingUserPhone.trim(),
          avatar_url: finalAvatarUrl
        })
        .eq('id', editingUserId);

      if (error) throw error;

      setUsuarios(prev => prev.map(u => 
        u.id === editingUserId ? { ...u, name: editingUserName.trim(), role: editingUserRole, cargo: editingUserCargo.trim(), contact_phone: editingUserPhone.trim(), avatar_url: finalAvatarUrl } : u
      ));
      
      logEvent(currentUser, 'Edición de Usuario', `Se actualizó el perfil de @${editingUserUsername}`);
      showNotification('Usuario actualizado exitosamente');
      setEditingUserId(null);
    } catch (err) {
      console.error('Error al editar usuario:', err);
      showNotification(err.message || 'Error al guardar los cambios. Asegúrate de tener permisos.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim()) return;

    try {
      // Llamada a la Edge Function segura para crear el usuario en Supabase Auth
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: `${newUserUsername.trim().toLowerCase()}@seis.com`, // Email autogenerado para el login
          password: 'Password123!', // Contraseña por defecto
          name: newUserName.trim(),
          username: newUserUsername.trim().toLowerCase(),
          role: newUserRole,
          cargo: newUserCargo.trim(),
          contact_phone: newUserPhone.trim()
        }
      });

      if (error) throw new Error(error.message || 'Error invocando la función');

      // Agregar visualmente a la lista sin recargar
      const newUser = {
        id: data?.user?.id || Date.now().toString(),
        name: newUserName.trim(),
        username: newUserUsername.trim().toLowerCase(),
        role: newUserRole
      };

      setUsuarios(prev => [...prev, newUser]);
      logEvent(currentUser, 'Creación de Usuario', `Se creó el usuario @${newUser.username} (${newUser.name}) con el rol de ${newUser.role}`);
      
      setNewUserName('');
      setNewUserUsername('');
      setNewUserRole('Ventas');
      setNewUserCargo('Ejecutivo');
      setNewUserPhone('+58 ');
      setShowAddUserModal(false);
      showNotification('Usuario creado exitosamente (Contraseña por defecto: Password123!)');
    } catch (err) {
      console.error('Error creando usuario:', err);
      showNotification('Hubo un error al crear el usuario. Asegúrate de haber desplegado la Edge Function.', 'error');
    }
  };

  const handleDeleteUser = () => {
    if (!showConfirmDeleteUser) return;
    setUsuarios(prev => prev.filter(u => u.id !== showConfirmDeleteUser));
    logEvent(currentUser, 'Eliminación de Usuario', `Se eliminó un usuario del sistema`);
    setShowConfirmDeleteUser(null);
    showNotification('Usuario eliminado exitosamente');
  };

  const handleResetPassword = async (userId) => {
    try {
      const { error } = await supabase.functions.invoke('reset-password', {
        body: { userId }
      });
      if (error) throw error;
      showNotification('Contraseña reseteada a: Password123!');
      logEvent(currentUser, 'Reset de Contraseña', `Se reseteó la contraseña del usuario ${userId}`);
    } catch (err) {
      console.error('Error reseteando clave:', err);
      showNotification('Error al resetear la clave', 'error');
    }
  };

  useEffect(() => {
    setIsLightMode(document.body.classList.contains('light-mode'));
    loadLogs();
    loadKpisFromSupabase();
  }, []);

  const loadKpisFromSupabase = async () => {
    try {
      setIsLoadingKpis(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'global_kpis_and_alerts')
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.setting_value) {
        setKpis(prev => ({ ...prev, ...data.setting_value }));
      }
    } catch (err) {
      console.error('Error loading KPIs from Supabase:', err);
    } finally {
      setIsLoadingKpis(false);
    }
  };

  const loadLogs = async () => {
    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .gte('timestamp', twoWeeksAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs from Supabase:', err);
    }
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

  const savePermissions = async () => {
    try {
      // Loop over the keys (Admin, Ventas, Produccion) and update
      const promises = Object.keys(permissions).map(role => {
        return supabase.from('roles_permissions')
          .update({ permissions: permissions[role] })
          .eq('role_name', role);
      });
      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res.error) throw res.error;
      });
      logEvent(currentUser, 'Modificación de Permisos', 'Se actualizaron las reglas de roles y accesos');
      showNotification('Permisos guardados correctamente');
    } catch (err) {
      console.error('Error saving permissions:', err);
      showNotification('Error al guardar permisos');
    }
  };

  const saveKPIs = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'global_kpis_and_alerts',
          setting_value: kpis,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      
      logEvent(currentUser, 'Configuración de KPIs y Alertas', `Se actualizaron las metas globales.`);
      showNotification('Configuración guardada en la base de datos');
      setActiveTab('menu');
    } catch (err) {
      console.error('Error saving KPIs to Supabase:', err);
      showNotification('Error al guardar la configuración');
    }
  };

  const clearLogs = async () => {
    try {
      // Delete all records in Supabase (using a condition that is always true)
      await supabase.from('system_logs').delete().neq('action', 'DUMMY_ACTION_NEVER_MATCH');
      setLogs([]);
      setShowConfirmClearLogs(false);
      logEvent(currentUser, 'Limpieza de Bitácora', 'Se borraron los logs históricos del sistema');
      loadLogs();
      showNotification('Bitácora borrada correctamente');
    } catch (err) {
      console.error('Error clearing logs in Supabase:', err);
    }
  };

  const showNotification = (text) => {
    setMessage(text);
  };

  // ── Handlers: Datos de la Empresa ───────────────────────
  const handleEmpresaChange = (field, value) => {
    setEmpresaData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEmpresa = async () => {
    setIsSavingEmpresa(true);
    try {
      const payload = {
        ...empresaData,
        updated_at: new Date().toISOString(),
      };

      if (empresaId) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('empresa')
          .update(payload)
          .eq('id', empresaId);
        if (error) throw error;
      } else {
        // Crear primer registro
        const { data, error } = await supabase
          .from('empresa')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        if (data?.id) setEmpresaId(data.id);
      }

      logEvent(currentUser, 'Actualización de Datos de la Empresa', `Razón Social: ${empresaData.razon_social}`);
      setShowEmpresaSuccess(true);
    } catch (err) {
      console.error('Error al guardar datos de la empresa:', err);
      showNotification('Error al guardar los datos de la empresa');
    } finally {
      setIsSavingEmpresa(false);
    }
  };

  const handlePermissionChange = (role, module, action) => {
    setPermissions(prev => {
      const currentModule = prev[role]?.[module] || {};
      const currentValue = currentModule[action] || false;
      return {
        ...prev,
        [role]: {
          ...prev[role],
          [module]: {
            ...currentModule,
            [action]: !currentValue
          }
        }
      };
    });
  };

  const handleSelectAllModule = (role, module, value) => {
    setPermissions(prev => {
      const updatedModule = { ...prev[role]?.[module] };
      const actions = Object.keys(moduleMap[module].actions);
      actions.forEach(action => {
        updatedModule[action] = value;
      });
      return {
        ...prev,
        [role]: {
          ...prev[role],
          [module]: updatedModule
        }
      };
    });
  };

  const handleKPIChange = (key, value) => {
    setKpis(prev => ({
      ...prev,
      [key]: value === '' ? '' : (typeof value === 'boolean' ? value : (parseFloat(value) || 0))
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
      case 'empresa': return 'Datos de la Empresa';
      case 'kpis': return 'Parámetros de Trazabilidad';
      case 'logs': return 'Log de Transacciones';
      default: return 'Ajustes';
    }
  };

  return (
    <div className="page-content">
      <div style={{
        position: 'sticky',
        top: '-1.5rem',
        zIndex: 100,
        backgroundColor: 'var(--bg-color)',
        margin: '-1.5rem -1.5rem 1.5rem -1.5rem',
        padding: '1.5rem 1.5rem 0.5rem 1.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activeTab === 'usuarios' ? '1rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <HelpDrawer module="ajustes" />
        </div>

        {activeTab === 'usuarios' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
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
        )}
      </div>

      {message && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle size={48} color="var(--success-color)" />
            </div>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1.25rem' }}>¡Operación Exitosa!</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>{message}</p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', color: isLightMode ? '#ffffff' : '#000000' }}
              onClick={() => setMessage('')}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Main Settings Menu */}
      {activeTab === 'menu' && (
        <>
          <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>
            Administra la configuración general de la plataforma, roles, usuarios, datos de la empresa y preferencias del sistema.
          </p>
          <div className="card" style={{ padding: '0', marginBottom: '2rem' }}>
            <div onClick={() => navigate('/perfil')} style={menuItemStyle}>
              <div style={menuItemLeftStyle}>
                <User size={38} style={{ color: 'var(--text-muted)' }} />
                <span style={menuItemTextStyle}>Mi Perfil</span>
              </div>
              <ChevronRight size={32} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div onClick={() => setActiveTab('usuarios')} style={menuItemStyle}>
              <div style={menuItemLeftStyle}>
                <Users size={38} style={{ color: 'var(--text-muted)' }} />
                <span style={menuItemTextStyle}>Usuarios del Sistema</span>
              </div>
              <ChevronRight size={32} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div onClick={() => setActiveTab('empresa')} style={menuItemStyle}>
              <div style={menuItemLeftStyle}>
                <Building2 size={38} style={{ color: 'var(--text-muted)' }} />
                <span style={menuItemTextStyle}>Datos de la Empresa</span>
              </div>
              <ChevronRight size={32} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div onClick={() => setActiveTab('roles')} style={menuItemStyle}>
              <div style={menuItemLeftStyle}>
                <Shield size={38} style={{ color: 'var(--text-muted)' }} />
                <span style={menuItemTextStyle}>Roles y Permisos</span>
              </div>
              <ChevronRight size={32} style={{ color: 'var(--text-muted)' }} />
            </div>

          <div onClick={() => setActiveTab('kpis')} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              <Clock size={38} style={{ color: 'var(--text-muted)' }} />
              <span style={menuItemTextStyle}>Parámetros de Trazabilidad</span>
            </div>
            <ChevronRight size={32} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={() => setActiveTab('logs')} style={menuItemStyle}>
            <div style={menuItemLeftStyle}>
              <History size={38} style={{ color: 'var(--text-muted)' }} />
              <span style={menuItemTextStyle}>Log de Transacciones</span>
            </div>
            <ChevronRight size={32} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div onClick={toggleTheme} style={{ ...menuItemStyle, borderBottom: 'none' }}>
            <div style={menuItemLeftStyle}>
              {isLightMode ? <Sun size={38} style={{ color: 'var(--text-muted)' }} /> : <Moon size={38} style={{ color: 'var(--text-muted)' }} />}
              <span style={menuItemTextStyle}>{isLightMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </div>
            <ChevronRight size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
        </>
      )}

      {/* Visual Roles & Permissions configuration screen */}
      {activeTab === 'roles' && (() => {
        const rolesKeys = Object.keys(permissions);
        const currentRole = rolesKeys[currentRoleIndex];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
            <div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Configura detalladamente los permisos de acceso y acciones permitidas para cada módulo del sistema.
              </p>

              {/* Selector de Rol (Tabs) */}
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {rolesKeys.map((role, idx) => (
                  <button
                    key={role}
                    onClick={() => setCurrentRoleIndex(idx)}
                    className="btn"
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: idx === currentRoleIndex ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: idx === currentRoleIndex ? 'color-mix(in srgb, var(--primary-color) 10%, transparent)' : 'var(--surface-color)',
                      color: idx === currentRoleIndex ? 'var(--primary-color)' : 'var(--text-muted)',
                      fontWeight: idx === currentRoleIndex ? 'bold' : 'normal',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {role === 'Admin' ? 'Administrador' : role === 'Ventas' ? 'Ventas' : 'Producción'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Paneles de Módulos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}>
              {Object.keys(moduleMap).map(moduleKey => {
                const moduleDef = moduleMap[moduleKey];
                return (
                  <div key={moduleKey} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>
                        {moduleDef.title}
                      </h4>
                      {(() => {
                        const isAllChecked = Object.keys(moduleDef.actions).every(actionKey => permissions[currentRole]?.[moduleKey]?.[actionKey]);
                        return (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Todos
                            <input 
                              type="checkbox" 
                              checked={isAllChecked}
                              onChange={(e) => handleSelectAllModule(currentRole, moduleKey, e.target.checked)}
                              style={{ margin: 0 }}
                            />
                          </label>
                        );
                      })()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      {Object.keys(moduleDef.actions).map(actionKey => {
                        const isChecked = permissions[currentRole]?.[moduleKey]?.[actionKey] || false;
                        return (
                          <div key={actionKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0' }}>
                            <label htmlFor={`perm-${currentRole}-${moduleKey}-${actionKey}`} style={{ cursor: 'pointer', margin: 0, fontSize: '0.85rem', color: isChecked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                              {moduleDef.actions[actionKey]}
                            </label>
                            <input
                              id={`perm-${currentRole}-${moduleKey}-${actionKey}`}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePermissionChange(currentRole, moduleKey, actionKey)}
                              style={{ ...checkboxStyle, transform: 'scale(0.9)', margin: 0 }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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

      {/* Datos de la Empresa screen */}
      {activeTab === 'empresa' && (
        <div>

          {isLoadingEmpresa ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏢</div>
              Cargando datos de la empresa...
            </div>
          ) : (
            <div className="card" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>

              {/* Encabezado visual */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginBottom: '1.75rem', paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary-color), #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Building2 size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    {empresaData.razon_social || 'Empresa sin nombre'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {empresaId ? 'Registro existente · haz clic en Guardar para actualizar' : 'Registro nuevo · completa los campos y guarda'}
                  </span>
                </div>
              </div>

              {/* Formulario */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {/* Razón Social */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="empresa-razon-social" style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Razón Social *
                  </label>
                  <input
                    id="empresa-razon-social"
                    type="text"
                    className="input-control"
                    placeholder="Ej: Comunicaciones SEIS, C.A."
                    value={empresaData.razon_social}
                    onChange={e => handleEmpresaChange('razon_social', e.target.value)}
                  />
                </div>

                {/* RIF */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="empresa-rif" style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    RIF / NIT
                  </label>
                  <input
                    id="empresa-rif"
                    type="text"
                    className="input-control"
                    placeholder="Ej: J-12345678-9"
                    value={empresaData.rif}
                    onChange={e => handleEmpresaChange('rif', e.target.value)}
                  />
                </div>

                {/* Dirección */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="empresa-direccion" style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Dirección
                  </label>
                  <textarea
                    id="empresa-direccion"
                    className="input-control"
                    placeholder="Ej: Av. Principal, Edif. Centro Empresarial, Piso 3, Caracas"
                    value={empresaData.direccion}
                    onChange={e => handleEmpresaChange('direccion', e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical', minHeight: '60px' }}
                  />
                </div>

                {/* Teléfono y Email en fila */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="empresa-telefono" style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Teléfono
                    </label>
                    <input
                      id="empresa-telefono"
                      type="tel"
                      className="input-control"
                      placeholder="Ej: +58 212 555-0000"
                      value={empresaData.telefono}
                      onChange={e => handleEmpresaChange('telefono', e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="empresa-email" style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Email
                    </label>
                    <input
                      id="empresa-email"
                      type="email"
                      className="input-control"
                      placeholder="Ej: contacto@empresa.com"
                      value={empresaData.email}
                      onChange={e => handleEmpresaChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Sitio Web */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="empresa-sitio-web" style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Sitio Web
                  </label>
                  <input
                    id="empresa-sitio-web"
                    type="url"
                    className="input-control"
                    placeholder="Ej: https://www.empresa.com"
                    value={empresaData.sitio_web}
                    onChange={e => handleEmpresaChange('sitio_web', e.target.value)}
                  />
                </div>

              </div>{/* end form fields */}

              {/* Botón Guardar */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
                <button
                  id="empresa-btn-cancelar"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('menu')}
                  style={{ width: 'auto', padding: '0 1.25rem', height: '48px', fontSize: '0.95rem' }}
                >
                  Cancelar
                </button>
                <button
                  id="empresa-btn-guardar"
                  className="btn btn-primary"
                  onClick={handleSaveEmpresa}
                  disabled={isSavingEmpresa || !empresaData.razon_social.trim()}
                  style={{ width: 'auto', padding: '0 1.5rem', height: '48px', fontSize: '0.95rem' }}
                >
                  {isSavingEmpresa ? 'Guardando...' : (<><Save size={16} style={{ marginRight: '0.4rem' }} />Guardar Cambios</>)}
                </button>
              </div>

            </div>
          )}

          {/* Modal de confirmación de guardado exitoso */}
          {showEmpresaSuccess && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}>
              <div className="card" style={{
                padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center',
                border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}>
                  <CheckCircle size={32} color="#22c55e" />
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  ¡Datos Guardados!
                </h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Los datos de la empresa se actualizaron exitosamente en la base de datos.
                </p>
                <button
                  id="empresa-success-ok"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowEmpresaSuccess(false);
                    setActiveTab('menu');
                  }}
                  style={{ width: '100%', height: '48px', fontSize: '0.95rem' }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* System Users management screen */}
      {activeTab === 'usuarios' && (
        <div>
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
                <div 
                  key={userItem.id} 
                  className="card hoverable" 
                  onClick={() => openEditUserModal(userItem)}
                  style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                      <img 
                        src={userItem.avatar_url || '/FotoPerfilPlantilla.jpg'} 
                        alt={userItem.name}
                        style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          backgroundColor: 'var(--border-color)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div style={{ 
                        display: 'none',
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--border-color) 100%)',
                        color: 'white', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {userInitials}
                      </div>
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

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Botón de Reset de Clave */}
                    {userItem.username !== currentUser.username && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleResetPassword(userItem.id); }} 
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          color: 'var(--primary-color)',
                          padding: '0.5rem'
                        }}
                        title="Resetear contraseña a Password123!"
                      >
                        <Key size={18} />
                      </button>
                    )}

                    {/* Botón de Eliminar */}
                    {userItem.username !== currentUser.username && userItem.username !== 'admin' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowConfirmDeleteUser(userItem.id); }} 
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
          <div className="card glass-panel" style={{ 
            width: '100%', 
            maxWidth: '600px', 
            padding: '0', 
            margin: 0, 
            overflowY: 'auto', 
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Header / Foto por Defecto */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: '1rem', 
              padding: '1rem', 
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img 
                  src="/FotoPerfilPlantilla.jpg" 
                  alt="Perfil por Defecto" 
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '14px', 
                    objectFit: 'cover',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    backgroundColor: 'var(--border-color)'
                  }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback si la imagen no se encuentra */}
                <div style={{ 
                  display: 'none',
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark-color, #1e1b4b) 100%)', 
                  color: 'white', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <User size={32} />
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem', color: 'var(--text-main)' }}>
                  Añadir Nuevo Usuario
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Complete los datos personales y de acceso del nuevo empleado.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddUser} style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="new-user-name" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Nombre Completo</label>
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

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="new-user-cargo" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Cargo</label>
                  <input 
                    id="new-user-cargo"
                    type="text" 
                    className="input-control" 
                    value={newUserCargo}
                    onChange={e => setNewUserCargo(e.target.value)}
                    placeholder="Ej. Especialista en Ventas"
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="new-user-role" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Área de Trabajo (Rol)</label>
                  <select 
                    id="new-user-role"
                    className="input-control" 
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                  >
                    <option value="Ventas">Ventas</option>
                    <option value="Produccion">Producción</option>
                    <option value="Admin">Administración</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="new-user-username" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Nombre de Usuario (Login)</label>
                  <input 
                    id="new-user-username"
                    type="text" 
                    className="input-control" 
                    value={newUserUsername}
                    onChange={e => setNewUserUsername(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Ej. jperez"
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                    Correo autogenerado: {newUserUsername ? `${newUserUsername.toLowerCase()}@seis.com` : '...@seis.com'}
                  </small>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="new-user-phone" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Teléfono</label>
                  <input 
                    id="new-user-phone"
                    type="tel" 
                    className="input-control" 
                    value={newUserPhone}
                    onChange={e => setNewUserPhone(e.target.value)}
                    placeholder="Ej. +58 414 1234567"
                  />
                </div>

              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserName('');
                    setNewUserUsername('');
                    setNewUserCargo('Ejecutivo');
                    setNewUserPhone('+58 ');
                  }} 
                  className="btn btn-secondary" 
                  style={{ flex: '1 1 120px', justifyContent: 'center' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: '1 1 120px', justifyContent: 'center' }}
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUserId && (
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
          <div className="card glass-panel" style={{ 
            width: '100%', 
            maxWidth: '600px', 
            padding: '0', 
            margin: 0, 
            overflowY: 'auto', 
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: '1rem', 
              padding: '1rem', 
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}>
              <div 
                style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => editAvatarInputRef.current?.click()}
              >
                <img 
                  src={editAvatarFile ? URL.createObjectURL(editAvatarFile) : editAvatarUrl} 
                  alt="Perfil" 
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '14px', 
                    objectFit: 'cover',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    backgroundColor: 'var(--border-color)'
                  }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ 
                  display: 'none',
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark-color, #1e1b4b) 100%)', 
                  color: 'white', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <User size={32} />
                </div>
                <div 
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <Edit2 color="white" size={24} />
                </div>
                <input 
                  type="file" 
                  ref={editAvatarInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditAvatarFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem', color: 'var(--text-main)' }}>
                  Editar Usuario
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Modifique los datos personales y foto del empleado.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="edit-user-name" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Nombre Completo</label>
                  <input 
                    id="edit-user-name"
                    type="text" 
                    className="input-control" 
                    value={editingUserName}
                    onChange={e => setEditingUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="edit-user-cargo" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Cargo</label>
                  <input 
                    id="edit-user-cargo"
                    type="text" 
                    className="input-control" 
                    value={editingUserCargo}
                    onChange={e => setEditingUserCargo(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="edit-user-role" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Área de Trabajo (Rol)</label>
                  <select 
                    id="edit-user-role"
                    className="input-control" 
                    value={editingUserRole}
                    onChange={e => setEditingUserRole(e.target.value)}
                  >
                    <option value="Ventas">Ventas</option>
                    <option value="Produccion">Producción</option>
                    <option value="Admin">Administración</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="edit-user-username" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Nombre de Usuario (Login)</label>
                  <input 
                    id="edit-user-username"
                    type="text" 
                    className="input-control" 
                    value={editingUserUsername}
                    disabled
                    style={{ backgroundColor: 'var(--bg-secondary)', opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="edit-user-phone" style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Teléfono</label>
                  <input 
                    id="edit-user-phone"
                    type="tel" 
                    className="input-control" 
                    value={editingUserPhone}
                    onChange={e => setEditingUserPhone(e.target.value)}
                  />
                </div>

              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => setEditingUserId(null)} 
                  className="btn btn-secondary" 
                  style={{ flex: '1 1 120px', justifyContent: 'center' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSavingEdit}
                  style={{ flex: '1 1 120px', justifyContent: 'center' }}
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
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
        <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {isLoadingKpis ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando configuración...</div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button 
                  className={`btn ${kpiTab === 'cotizaciones' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', width: 'auto' }}
                  onClick={() => setKpiTab('cotizaciones')}
                >
                  Cotizaciones
                </button>
                <button 
                  className={`btn ${kpiTab === 'ots' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', width: 'auto' }}
                  onClick={() => setKpiTab('ots')}
                >
                  Órdenes de Trabajo
                </button>
              </div>

              {kpiTab === 'cotizaciones' && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Configura la anticipación (en días) con la que deseas que las Cotizaciones aparezcan en el panel de Alertas críticas, antes de su fecha límite.
                  </p>

              <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', opacity: kpis.alert_quotes_enabled === false ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label htmlFor="kpi-alert-quotes" style={{ margin: 0, fontWeight: 600 }}>Días críticos para alerta de Cotizaciones</label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={kpis.alert_quotes_enabled !== false} onChange={e => handleKPIChange('alert_quotes_enabled', e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <div style={{ width: '36px', height: '20px', backgroundColor: kpis.alert_quotes_enabled !== false ? 'var(--primary-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: 'background-color 0.2s' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: kpis.alert_quotes_enabled !== false ? '18px' : '2px', transition: 'left 0.2s' }}></div>
                      </div>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, color: 'var(--text-muted)' }}>
                    Se mostrarán en Alertas cuando falten {kpis.alert_days_quotes !== undefined && kpis.alert_days_quotes !== '' ? kpis.alert_days_quotes : 7} días o menos para la Fecha Estimada de Entrega y tienen estado "Pendiente", "Enviada" o "En Negociación".
                  </p>
                </div>
                <input 
                  id="kpi-alert-quotes"
                  type="number" 
                  className="input-control"
                  value={kpis.alert_days_quotes !== undefined ? kpis.alert_days_quotes : 7} 
                  onChange={e => handleKPIChange('alert_days_quotes', e.target.value)}
                  disabled={kpis.alert_quotes_enabled === false}
                  min="1"
                  style={{ margin: 0, cursor: kpis.alert_quotes_enabled === false ? 'not-allowed' : 'text' }}
                />
              </div>

              <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', opacity: kpis.alert_approved_quotes_enabled === false ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label htmlFor="kpi-alert-approved-quotes" style={{ margin: 0, fontWeight: 600 }}>Espera máxima para pasar a Programación</label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={kpis.alert_approved_quotes_enabled !== false} onChange={e => handleKPIChange('alert_approved_quotes_enabled', e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <div style={{ width: '36px', height: '20px', backgroundColor: kpis.alert_approved_quotes_enabled !== false ? 'var(--primary-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: 'background-color 0.2s' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: kpis.alert_approved_quotes_enabled !== false ? '18px' : '2px', transition: 'left 0.2s' }}></div>
                      </div>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, color: 'var(--text-muted)' }}>
                    Alerta si una cotización Aprobada pasa {kpis.alert_days_approved_quotes !== undefined && kpis.alert_days_approved_quotes !== '' ? kpis.alert_days_approved_quotes : 1} día(s) sin que se genere su Orden de Trabajo.
                  </p>
                </div>
                <input 
                  id="kpi-alert-approved-quotes"
                  type="number" 
                  className="input-control"
                  value={kpis.alert_days_approved_quotes !== undefined ? kpis.alert_days_approved_quotes : 1} 
                  onChange={e => handleKPIChange('alert_days_approved_quotes', e.target.value)}
                  disabled={kpis.alert_approved_quotes_enabled === false}
                  min="0"
                  style={{ margin: 0, cursor: kpis.alert_approved_quotes_enabled === false ? 'not-allowed' : 'text' }}
                />
              </div>
            </div>
          )}

          {kpiTab === 'ots' && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Configura las métricas y los umbrales para el sistema de semaforización de las Órdenes de Trabajo (OT).
              </p>

              <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', opacity: kpis.alert_ots_enabled === false ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label htmlFor="kpi-alert-ots" style={{ margin: 0, fontWeight: 600 }}>Días críticos para alerta de Órdenes (OT)</label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={kpis.alert_ots_enabled !== false} onChange={e => handleKPIChange('alert_ots_enabled', e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <div style={{ width: '36px', height: '20px', backgroundColor: kpis.alert_ots_enabled !== false ? 'var(--primary-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: 'background-color 0.2s' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: kpis.alert_ots_enabled !== false ? '18px' : '2px', transition: 'left 0.2s' }}></div>
                      </div>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, color: 'var(--text-muted)' }}>
                    Las OT se mostrarán en Alertas cuando falten {kpis.alert_days_ots !== undefined && kpis.alert_days_ots !== '' ? kpis.alert_days_ots : 7} días o menos.
                  </p>
                </div>
                <input 
                  id="kpi-alert-ots"
                  type="number" 
                  className="input-control"
                  value={kpis.alert_days_ots !== undefined ? kpis.alert_days_ots : 7} 
                  onChange={e => handleKPIChange('alert_days_ots', e.target.value)}
                  disabled={kpis.alert_ots_enabled === false}
                  min="1"
                  style={{ margin: 0, cursor: kpis.alert_ots_enabled === false ? 'not-allowed' : 'text' }}
                />
              </div>

              <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', opacity: kpis.ot_alert_hours_unassigned_enabled === false ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label htmlFor="kpi-alert-ot-unassigned" style={{ margin: 0, fontWeight: 600 }}>Alerta de Carga sin Estimación (Horas)</label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={kpis.ot_alert_hours_unassigned_enabled !== false} onChange={e => handleKPIChange('ot_alert_hours_unassigned_enabled', e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <div style={{ width: '36px', height: '20px', backgroundColor: kpis.ot_alert_hours_unassigned_enabled !== false ? 'var(--primary-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: 'background-color 0.2s' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: kpis.ot_alert_hours_unassigned_enabled !== false ? '18px' : '2px', transition: 'left 0.2s' }}></div>
                      </div>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, color: 'var(--text-muted)' }}>
                    Avisar al Jefe de Producción si una OT nueva pasa más de {kpis.ot_alert_hours_unassigned !== undefined ? kpis.ot_alert_hours_unassigned : 2} horas sin estimación de tiempo.
                  </p>
                </div>
                <input 
                  id="kpi-alert-ot-unassigned"
                  type="number" 
                  className="input-control"
                  value={kpis.ot_alert_hours_unassigned !== undefined ? kpis.ot_alert_hours_unassigned : 2} 
                  onChange={e => handleKPIChange('ot_alert_hours_unassigned', e.target.value)}
                  disabled={kpis.ot_alert_hours_unassigned_enabled === false}
                  min="1"
                  style={{ margin: 0, cursor: kpis.ot_alert_hours_unassigned_enabled === false ? 'not-allowed' : 'text' }}
                />
              </div>

              <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', opacity: kpis.ot_alert_progress_warning_enabled === false ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label htmlFor="kpi-alert-ot-progress" style={{ margin: 0, fontWeight: 600 }}>Alerta Preventiva de Producción (%)</label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={kpis.ot_alert_progress_warning_enabled !== false} onChange={e => handleKPIChange('ot_alert_progress_warning_enabled', e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <div style={{ width: '36px', height: '20px', backgroundColor: kpis.ot_alert_progress_warning_enabled !== false ? 'var(--primary-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: 'background-color 0.2s' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: kpis.ot_alert_progress_warning_enabled !== false ? '18px' : '2px', transition: 'left 0.2s' }}></div>
                      </div>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, color: 'var(--text-muted)' }}>
                    Mostrar alerta preventiva (amarilla) cuando el tiempo consumido de la OT alcance el {kpis.ot_alert_progress_warning !== undefined ? kpis.ot_alert_progress_warning : 80}%.
                  </p>
                </div>
                <input 
                  id="kpi-alert-ot-progress"
                  type="number" 
                  className="input-control"
                  value={kpis.ot_alert_progress_warning !== undefined ? kpis.ot_alert_progress_warning : 80} 
                  onChange={e => handleKPIChange('ot_alert_progress_warning', e.target.value)}
                  disabled={kpis.ot_alert_progress_warning_enabled === false}
                  min="1" max="99"
                  style={{ margin: 0, cursor: kpis.ot_alert_progress_warning_enabled === false ? 'not-allowed' : 'text' }}
                />
              </div>

              <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem', opacity: kpis.ot_alert_hours_logistics_enabled === false ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label htmlFor="kpi-alert-ot-logistics" style={{ margin: 0, fontWeight: 600 }}>Alerta de Estancamiento en Logística (Horas)</label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={kpis.ot_alert_hours_logistics_enabled !== false} onChange={e => handleKPIChange('ot_alert_hours_logistics_enabled', e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <div style={{ width: '36px', height: '20px', backgroundColor: kpis.ot_alert_hours_logistics_enabled !== false ? 'var(--primary-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: 'background-color 0.2s' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: kpis.ot_alert_hours_logistics_enabled !== false ? '18px' : '2px', transition: 'left 0.2s' }}></div>
                      </div>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, color: 'var(--text-muted)' }}>
                    Mostrar alerta azul si una OT pasa más de {kpis.ot_alert_hours_logistics !== undefined ? kpis.ot_alert_hours_logistics : 24} horas en estado "Finalizado" sin ser entregada.
                  </p>
                </div>
                <input 
                  id="kpi-alert-ot-logistics"
                  type="number" 
                  className="input-control"
                  value={kpis.ot_alert_hours_logistics !== undefined ? kpis.ot_alert_hours_logistics : 24} 
                  onChange={e => handleKPIChange('ot_alert_hours_logistics', e.target.value)}
                  disabled={kpis.ot_alert_hours_logistics_enabled === false}
                  min="1"
                  style={{ margin: 0, cursor: kpis.ot_alert_hours_logistics_enabled === false ? 'not-allowed' : 'text' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

          <div style={buttonContainerStyle}>
            <button 
              onClick={saveKPIs} 
              className="btn btn-solid" 
              style={{ flex: 1 }}
              disabled={isLoadingKpis}
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
                      {formatDateTime(log.timestamp)}
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
