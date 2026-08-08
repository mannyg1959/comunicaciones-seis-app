export const defaultPermissions = {
  Admin: {
    crear_cotizaciones: true,
    eliminar_cotizaciones: true,
    aprobar_cotizaciones: true,
    gestionar_ordenes: true,
    configurar_sistema: true
  },
  Ventas: {
    crear_cotizaciones: true,
    eliminar_cotizaciones: true,
    aprobar_cotizaciones: false,
    gestionar_ordenes: false,
    configurar_sistema: false
  },
  Produccion: {
    crear_cotizaciones: false,
    eliminar_cotizaciones: false,
    aprobar_cotizaciones: false,
    gestionar_ordenes: true,
    configurar_sistema: false
  }
};

export const checkPermission = (user, permission) => {
  if (!user) return false;
  const saved = localStorage.getItem('comunicaciones_seis_permissions');
  const permissions = saved ? JSON.parse(saved) : defaultPermissions;
  const userRole = user.role || 'Ventas';
  return permissions[userRole]?.[permission] ?? false;
};
