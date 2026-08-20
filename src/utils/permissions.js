export const defaultPermissions = {
  Admin: {
    cotizaciones: { ver: true, crear: true, editar: true, cambiar_estatus: true, anular: true, eliminar: true, imprimir: true, gestionar_clientes: true },
    ordenes_trabajo: { ver: true, crear: true, editar: true, asignar_tecnicos: true, cambiar_estatus: true, imprimir: true, eliminar: true },
    dashboard: { ver_general: true, ver_financieros: true, ver_operativos: true },
    herramientas_analiticas: { ver_reportes: true, exportar_datos: true, ver_alertas: true, monitor: true },
    ajustes: { acceso: true, gestionar_usuarios: true, gestionar_roles: true, configurar_kpis: true, ver_logs: true }
  },
  Ventas: {
    cotizaciones: { ver: true, crear: true, editar: true, cambiar_estatus: true, anular: false, eliminar: false, imprimir: true, gestionar_clientes: true },
    ordenes_trabajo: { ver: true, crear: false, editar: false, asignar_tecnicos: false, cambiar_estatus: false, imprimir: false, eliminar: false },
    dashboard: { ver_general: true, ver_financieros: true, ver_operativos: false },
    herramientas_analiticas: { ver_reportes: false, exportar_datos: true, ver_alertas: true, monitor: false },
    ajustes: { acceso: false, gestionar_usuarios: false, gestionar_roles: false, configurar_kpis: false, ver_logs: false }
  },
  Produccion: {
    cotizaciones: { ver: false, crear: false, editar: false, cambiar_estatus: false, anular: false, eliminar: false, imprimir: false, gestionar_clientes: false },
    ordenes_trabajo: { ver: true, crear: true, editar: true, asignar_tecnicos: true, cambiar_estatus: true, imprimir: true, eliminar: false },
    dashboard: { ver_general: true, ver_financieros: false, ver_operativos: true },
    herramientas_analiticas: { ver_reportes: true, exportar_datos: false, ver_alertas: true, monitor: false },
    ajustes: { acceso: false, gestionar_usuarios: false, gestionar_roles: false, configurar_kpis: false, ver_logs: false }
  }
};
